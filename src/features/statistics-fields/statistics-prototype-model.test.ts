import { describe, expect, it } from 'vitest';
import { calculate, configError, initialRecords, type StatConfig } from './statistics-prototype-model';

const confirmed: StatConfig = { id: 'stat', name: '已确认回款', enabled: true, source: 'payment', method: 'sum', target: 'amount', scope: 'filtered', conditions: [{ id: 'status', field: 'status', operator: 'eq', value: '已确认' }] };

describe('statistics source filtering', () => {
  it('filters related records before all four aggregations', () => {
    expect(['count', 'sum', 'max', 'min'].map(method => calculate({ ...confirmed, method: method as StatConfig['method'] }, 'a', initialRecords).value)).toEqual([2, 55000, 35000, 20000]);
    expect(calculate({ ...confirmed, scope: 'all', conditions: [] }, 'a', initialRecords).value).toBe(70000);
  });

  it('re-evaluates membership when a non-target source field changes', () => {
    const changed = initialRecords.map(row => row.id === 'P001' ? { ...row, values: { ...row.values, status: '待确认' } } : row);
    expect(calculate(confirmed, 'a', changed).value).toBe(35000);
    expect(calculate(confirmed, 'b', changed).value).toBe(48000);
  });

  it('intersects conditions and preserves empty-set semantics', () => {
    const filtered = { ...confirmed, conditions: [...confirmed.conditions, { id: 'amount', field: 'amount', operator: 'gt', value: 20000 }] };
    expect(calculate(filtered, 'a', initialRecords).value).toBe(35000);
    const none = { ...filtered, conditions: [...filtered.conditions, { id: 'limit', field: 'amount', operator: 'lt', value: 0 }] };
    expect(calculate(none, 'a', initialRecords).value).toBe(0);
    expect(calculate({ ...none, method: 'max' }, 'a', initialRecords).value).toBeNull();
  });

  it('accepts zero and empty predicates while rejecting incomplete or incompatible conditions', () => {
    const condition = { id: 'amount', field: 'amount', operator: 'eq', value: 0 };
    expect(configError({ ...confirmed, conditions: [condition] })).toBeUndefined();
    expect(configError({ ...confirmed, conditions: [{ ...condition, value: null }] })).toBeDefined();
    expect(configError({ ...confirmed, conditions: [{ ...condition, operator: 'empty', value: null }] })).toBeUndefined();
    expect(configError({ ...confirmed, conditions: [{ ...condition, operator: 'contains' }] })).toBeDefined();
    expect(configError({ ...confirmed, conditions: [{ ...condition, field: 'missing' }] })).toBeDefined();
    expect(configError({ ...confirmed, conditions: [{ ...condition, field: 'status', value: '已撤销' }] })).toBeDefined();
  });

  it('counts matching empty values without treating zero as empty', () => {
    const records = initialRecords.map(row => row.id === 'P001' ? { ...row, values: { ...row.values, amount: null } } : row.id === 'P002' ? { ...row, values: { ...row.values, amount: 0 } } : row);
    const config: StatConfig = { ...confirmed, method: 'count', conditions: [{ id: 'amount', field: 'amount', operator: 'empty', value: null }] };
    expect(calculate(config, 'a', records).value).toBe(1);
    expect(calculate({ ...config, conditions: [{ ...config.conditions[0], operator: 'eq', value: 0 }] }, 'a', records).value).toBe(1);
  });
});

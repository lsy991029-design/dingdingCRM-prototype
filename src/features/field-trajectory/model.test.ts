import { describe, expect, it } from 'vitest';
import { datesInRange, getTrajectoryRows } from './model';

describe('field trajectory prototype model', () => {
  it('builds inclusive dynamic date columns', () => {
    expect(datesInRange('2026-08-12', '2026-08-14')).toEqual(['2026-08-12', '2026-08-13', '2026-08-14']);
  });

  it('intersects department and employee filters without exposing no-trajectory employees', () => {
    expect(getTrajectoryRows('2026-08-12', '2026-08-14', '北京一部')).toHaveLength(2);
    expect(getTrajectoryRows('2026-08-12', '2026-08-14', '天津分公司', 'zhou-chen')).toHaveLength(0);
  });
});

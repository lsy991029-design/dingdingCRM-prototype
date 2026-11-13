import { describe, expect, it } from 'vitest';
import {
  customerFixtures,
  filterCustomers,
  validateCustomer,
  type CustomerFormValues,
} from './model';

const candidate: CustomerFormValues = {
  type: '企业客户',
  name: '星河装备有限公司',
  stage: '新获取',
  owner: '李明',
  collaborators: [],
  tags: [],
  parentCustomer: '',
  address: '',
  source: '自主开发',
  notes: '',
};

describe('customer domain model', () => {
  it('filters customers by group, keyword, stage and owner together', () => {
    expect(
      filterCustomers(customerFixtures, {
        group: '我负责的',
        keyword: '云岭',
        stage: '待跟进',
        owner: '李明',
      }),
    ).toHaveLength(1);
  });

  it('rejects missing name, missing owner and a duplicate customer name', () => {
    expect(validateCustomer({ ...candidate, name: '' }, customerFixtures)).toMatchObject({
      field: 'name',
    });
    expect(validateCustomer({ ...candidate, owner: '' }, customerFixtures)).toMatchObject({
      field: 'owner',
    });
    expect(
      validateCustomer({ ...candidate, name: customerFixtures[0].name }, customerFixtures),
    ).toMatchObject({ field: 'name' });
  });
});

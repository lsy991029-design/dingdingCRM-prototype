export type CustomerStage = '新获取' | '待跟进' | '商机' | '报价' | '成交';

export type CustomerGroup =
  | '全部'
  | '今日新增'
  | '本月新增'
  | '我负责的'
  | '我协同的'
  | '即将掉保'
  | '待跟进'
  | '高价值客户';

export type FollowUpType = '电话' | '拜访' | '会议' | '聊天' | '邮件';

export interface FollowUp {
  id: number;
  type: FollowUpType;
  content: string;
  createdAt: string;
  author: string;
}

export interface Customer {
  id: number;
  name: string;
  type: string;
  stage: CustomerStage;
  owner: string;
  collaborators: string[];
  dueAt: string | null;
  tags: string[];
  followUps: FollowUp[];
  updatedAt: string;
  source: string;
  notes: string;
  orders: number;
  contracts: number;
  address: string;
  parentCustomer: string;
}

export interface Draft extends Customer {
  isDraft: true;
}

export interface CustomerFormValues {
  type: string;
  name: string;
  stage: CustomerStage;
  owner: string;
  collaborators: string[];
  tags: string[];
  parentCustomer: string;
  address: string;
  source: string;
  notes: string;
}

export interface CustomerFilters {
  group: CustomerGroup;
  keyword: string;
  stage?: CustomerStage;
  owner?: string;
}

export interface ValidationError {
  field: keyof CustomerFormValues;
  message: string;
}

export const stageOptions: CustomerStage[] = ['新获取', '待跟进', '商机', '报价', '成交'];
export const groupOptions: CustomerGroup[] = [
  '全部',
  '今日新增',
  '本月新增',
  '我负责的',
  '我协同的',
  '即将掉保',
  '待跟进',
  '高价值客户',
];
export const ownerOptions = ['李明', '王敏', '陈晨'];
export const customerTypeOptions = ['企业客户', '经销商', '代理商'];
export const sourceOptions = ['自主开发', '市场活动', '客户转介绍', '官网咨询'];
export const followUpTypes: FollowUpType[] = ['电话', '拜访', '会议', '聊天', '邮件'];

export const customerFixtures: Customer[] = [
  {
    id: 1,
    name: '华东新材料科技有限公司',
    type: '企业客户',
    stage: '新获取',
    owner: '李明',
    collaborators: [],
    dueAt: null,
    tags: ['重点客户'],
    followUps: [],
    updatedAt: '今天 10:35',
    source: '自主开发',
    notes: '',
    orders: 1,
    contracts: 0,
    address: '',
    parentCustomer: '',
  },
  {
    id: 2,
    name: '远景工业设备有限公司',
    type: '企业客户',
    stage: '成交',
    owner: '王敏',
    collaborators: ['陈晨'],
    dueAt: null,
    tags: [],
    followUps: [
      { id: 201, type: '会议', content: '合同执行中', createdAt: '昨天 16:20', author: '王敏' },
    ],
    updatedAt: '昨天 16:20',
    source: '市场活动',
    notes: '',
    orders: 2,
    contracts: 1,
    address: '',
    parentCustomer: '',
  },
  {
    id: 3,
    name: '云岭科技服务有限公司',
    type: '企业客户',
    stage: '待跟进',
    owner: '李明',
    collaborators: [],
    dueAt: '2026-08-20',
    tags: ['待激活'],
    followUps: [
      { id: 301, type: '邮件', content: '已发送方案资料', createdAt: '2026-08-11', author: '李明' },
      { id: 302, type: '电话', content: '确认采购需求', createdAt: '2026-08-10', author: '李明' },
    ],
    updatedAt: '2026-08-11',
    source: '官网咨询',
    notes: '',
    orders: 0,
    contracts: 0,
    address: '',
    parentCustomer: '',
  },
  {
    id: 4,
    name: '北辰智能制造有限公司',
    type: '企业客户',
    stage: '商机',
    owner: '陈晨',
    collaborators: ['王敏'],
    dueAt: '2026-08-18',
    tags: ['重点客户'],
    followUps: Array.from({ length: 11 }, (_, index) => ({
      id: 400 + index,
      type: '会议' as FollowUpType,
      content: index === 0 ? '确认下周技术交流' : '持续推进技术方案',
      createdAt: '2026-08-10',
      author: '陈晨',
    })),
    updatedAt: '2026-08-10',
    source: '客户转介绍',
    notes: '',
    orders: 1,
    contracts: 0,
    address: '',
    parentCustomer: '',
  },
  {
    id: 5,
    name: '启航新能源有限公司',
    type: '企业客户',
    stage: '报价',
    owner: '王敏',
    collaborators: [],
    dueAt: '2026-08-16',
    tags: [],
    followUps: Array.from({ length: 6 }, (_, index) => ({
      id: 500 + index,
      type: '电话' as FollowUpType,
      content: index === 0 ? '报价待确认' : '已沟通报价方案',
      createdAt: '2026-08-08',
      author: '王敏',
    })),
    updatedAt: '2026-08-08',
    source: '市场活动',
    notes: '',
    orders: 0,
    contracts: 0,
    address: '',
    parentCustomer: '',
  },
];

export const draftFixtures: Draft[] = [
  {
    id: 101,
    name: '南方科创有限公司',
    type: '企业客户',
    stage: '新获取',
    owner: '李明',
    collaborators: [],
    dueAt: null,
    tags: [],
    followUps: [],
    updatedAt: '今天 11:20',
    source: '自主开发',
    notes: '待补充采购联系人',
    orders: 0,
    contracts: 0,
    address: '',
    parentCustomer: '',
    isDraft: true,
  },
  {
    id: 102,
    name: '',
    type: '企业客户',
    stage: '新获取',
    owner: '',
    collaborators: [],
    dueAt: null,
    tags: [],
    followUps: [],
    updatedAt: '昨天 16:48',
    source: '市场活动',
    notes: '展会线索，待补充客户名称',
    orders: 0,
    contracts: 0,
    address: '',
    parentCustomer: '',
    isDraft: true,
  },
];

export function filterCustomers(customers: Customer[], filters: CustomerFilters): Customer[] {
  const keyword = filters.keyword.trim().toLowerCase();
  return customers.filter((customer) => {
    const latestFollowUp = customer.followUps[0]?.content ?? '';
    const matchesGroup =
      filters.group === '全部' ||
      (filters.group === '今日新增' && customer.updatedAt.includes('今天')) ||
      (filters.group === '本月新增' && !customer.updatedAt.includes('2026-07')) ||
      (filters.group === '我负责的' && customer.owner === '李明') ||
      (filters.group === '我协同的' && customer.collaborators.includes('李明')) ||
      (filters.group === '即将掉保' && Boolean(customer.dueAt)) ||
      (filters.group === '待跟进' && customer.stage === '待跟进') ||
      (filters.group === '高价值客户' && customer.tags.includes('重点客户'));
    return (
      matchesGroup &&
      (!keyword || `${customer.name}${latestFollowUp}`.toLowerCase().includes(keyword)) &&
      (!filters.stage || customer.stage === filters.stage) &&
      (!filters.owner || customer.owner === filters.owner)
    );
  });
}

export function validateCustomer(
  values: CustomerFormValues,
  customers: Customer[],
  editingId?: number,
): ValidationError | undefined {
  if (!values.name.trim()) return { field: 'name', message: '请输入客户名称' };
  if (!values.owner) return { field: 'owner', message: '请选择负责人后再创建客户' };
  if (customers.some((customer) => customer.name === values.name.trim() && customer.id !== editingId)) {
    return { field: 'name', message: '发现同名客户，请先核对查重结果后再创建' };
  }
  return undefined;
}

export function toFormValues(customer?: Customer): CustomerFormValues {
  return customer
    ? {
        type: customer.type,
        name: customer.name,
        stage: customer.stage,
        owner: customer.owner,
        collaborators: customer.collaborators,
        tags: customer.tags,
        parentCustomer: customer.parentCustomer,
        address: customer.address,
        source: customer.source,
        notes: customer.notes,
      }
    : {
        type: '企业客户',
        name: '',
        stage: '新获取',
        owner: '',
        collaborators: [],
        tags: [],
        parentCustomer: '',
        address: '',
        source: '自主开发',
        notes: '',
      };
}

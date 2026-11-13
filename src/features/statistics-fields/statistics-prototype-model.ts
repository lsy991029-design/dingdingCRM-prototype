// MVP prototype: validate configuration dependencies and automatic derived results with in-memory fixtures.
export type Method = 'count' | 'sum' | 'max' | 'min';
export type SourceId = 'followup' | 'contract' | 'payment' | 'visit';
export type ValueKind = 'text' | 'number' | 'money' | 'date' | 'choice';
export type SourceField = { id: string; label: string; kind: ValueKind; options?: string[] };
export type Source = { id: SourceId; label: string; fields: SourceField[] };
export type SourceRecord = { id: string; source: SourceId; customer: string; name: string; values: Record<string, string | number | null> };
export type Condition = { id: string; field?: string; operator: string; value: string | number | null };
export type StatConfig = { id: string; name: string; enabled: boolean; source?: SourceId; method: Method; target?: string; scope: 'all' | 'filtered'; conditions: Condition[] };

export const customers = [
  { id: 'a', name: '华东新材料科技有限公司', owner: '李明' },
  { id: 'b', name: '远景工业设备有限公司', owner: '王敏' },
  { id: 'c', name: '云岭科技服务有限公司', owner: '陈晨' },
];

const ownerField: SourceField = { id: 'owner', label: '负责人', kind: 'choice', options: ['李明', '王敏', '陈晨'] };
export const sources: Source[] = [
  { id: 'followup', label: '跟进记录', fields: [
    { id: 'content', label: '跟进内容', kind: 'text' },
    { id: 'duration', label: '跟进时长（分钟）', kind: 'number' },
    { id: 'time', label: '跟进时间', kind: 'date' },
    { id: 'status', label: '跟进方式', kind: 'choice', options: ['电话沟通', '线上会议', '客户拜访'] }, ownerField,
  ] },
  { id: 'contract', label: '合同', fields: [
    { id: 'amount', label: '合同金额', kind: 'money' },
    { id: 'time', label: '签约时间', kind: 'date' },
    { id: 'status', label: '合同状态', kind: 'choice', options: ['已签约', '审批中', '已作废'] }, ownerField,
  ] },
  { id: 'payment', label: '回款', fields: [
    { id: 'amount', label: '回款金额', kind: 'money' },
    { id: 'time', label: '回款时间', kind: 'date' },
    { id: 'status', label: '回款状态', kind: 'choice', options: ['已确认', '待确认', '已作废'] }, ownerField,
  ] },
  { id: 'visit', label: '外勤拜访', fields: [
    { id: 'duration', label: '拜访时长（分钟）', kind: 'number' },
    { id: 'time', label: '实际拜访时间', kind: 'date' },
    { id: 'status', label: '拜访状态', kind: 'choice', options: ['已完成', '进行中', '已取消'] }, ownerField,
  ] },
];

export const methodLabels: Record<Method, string> = { count: '计数', sum: '求和', max: '最大值', min: '最小值' };
export const kindLabels: Record<ValueKind, string> = { text: '文本', number: '数字', money: '金额', date: '日期时间', choice: '单选' };
export const sourceOf = (id?: SourceId) => sources.find(source => source.id === id);
export const freshConfig = (): StatConfig => ({ id: crypto.randomUUID(), name: '统计字段', enabled: true, method: 'count', scope: 'all', conditions: [] });
export const freshCondition = (): Condition => ({ id: crypto.randomUUID(), operator: 'eq', value: null });
export const availableTargets = (source: Source | undefined, method: Method) => (source?.fields ?? []).filter(field =>
  method === 'sum' ? ['number', 'money'].includes(field.kind) : ['number', 'money', 'date'].includes(field.kind));

export function operatorsFor(field?: SourceField) {
  const options = [{ value: 'eq', label: '等于' }, { value: 'ne', label: '不等于' }];
  if (field && ['number', 'money', 'date'].includes(field.kind)) options.push(
    { value: 'gt', label: '大于' }, { value: 'gte', label: '大于等于' }, { value: 'lt', label: '小于' }, { value: 'lte', label: '小于等于' });
  if (field?.kind === 'text') options.push({ value: 'contains', label: '包含' });
  return [...options, { value: 'empty', label: '为空' }, { value: 'notempty', label: '不为空' }];
}

export function configError(config: StatConfig): string | undefined {
  if (!config.name.trim()) return '请输入标题';
  const source = sourceOf(config.source);
  if (!source) return '请选择数据来源';
  if (config.method !== 'count' && !availableTargets(source, config.method).some(field => field.id === config.target)) return '请选择可用于当前统计方式的字段';
  if (config.scope === 'filtered') {
    if (!config.conditions.length) return '请至少添加一个统计条件';
    for (const condition of config.conditions) {
      const field = source.fields.find(field => field.id === condition.field);
      if (!field) return '请选择条件字段';
      if (!operatorsFor(field).some(option => option.value === condition.operator)) return '请选择适用于条件字段的运算符';
      if (!['empty', 'notempty'].includes(condition.operator) && (condition.value === null || String(condition.value).trim() === '')) return '请填写完整的筛选条件';
      if (!['empty', 'notempty'].includes(condition.operator)) {
        if (['number', 'money'].includes(field.kind) && !Number.isFinite(Number(condition.value))) return '请输入有效的筛选数值';
        if (field.kind === 'choice' && !field.options?.includes(String(condition.value))) return '请选择有效的筛选值';
        if (field.kind === 'date' && !Number.isFinite(Date.parse(String(condition.value).replace(' ', 'T')))) return '请选择有效的筛选时间';
      }
    }
  }
}

function matches(record: SourceRecord, condition: Condition) {
  const value = record.values[condition.field ?? ''];
  const empty = value === null || value === undefined || value === '';
  if (condition.operator === 'empty') return empty;
  if (condition.operator === 'notempty') return !empty;
  if (empty) return false;
  const expected = condition.value;
  switch (condition.operator) {
    case 'eq': return String(value) === String(expected);
    case 'ne': return String(value) !== String(expected);
    case 'contains': return String(value).includes(String(expected));
    case 'gt': return value > expected!;
    case 'gte': return value >= expected!;
    case 'lt': return value < expected!;
    case 'lte': return value <= expected!;
    default: return false;
  }
}

export function calculate(config: StatConfig, customer: string, records: SourceRecord[]) {
  const rows = [...new Map(records.filter(record => record.source === config.source && record.customer === customer &&
    (config.scope === 'all' || config.conditions.every(condition => matches(record, condition)))).map(record => [record.id, record])).values()];
  if (config.method === 'count') return { value: rows.length as string | number | null, rows };
  const values = rows.map(record => record.values[config.target ?? '']).filter((value): value is string | number => value !== null && value !== undefined && value !== '');
  if (config.method === 'sum') return { value: values.reduce<number>((sum, value) => sum + Math.round(Number(value) * 100), 0) / 100, rows };
  if (!values.length) return { value: null, rows };
  const sorted = [...values].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return { value: config.method === 'max' ? sorted[sorted.length - 1] : sorted[0], rows };
}

export function displayResult(config: StatConfig, value: string | number | null) {
  if (value === null) return '—';
  if (config.method === 'count') return Number(value).toLocaleString('zh-CN');
  const field = sourceOf(config.source)?.fields.find(item => item.id === config.target);
  if (field?.kind === 'money') return `¥ ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (field?.kind === 'number') return Number(value).toLocaleString('zh-CN');
  return String(value);
}

export const initialRecords: SourceRecord[] = [
  { id: 'P001', source: 'payment', customer: 'a', name: '首期回款', values: { amount: 20000, time: '2026-10-08 10:30', status: '已确认', owner: '李明' } },
  { id: 'P002', source: 'payment', customer: 'a', name: '二期回款', values: { amount: 35000, time: '2026-10-19 15:00', status: '已确认', owner: '李明' } },
  { id: 'P003', source: 'payment', customer: 'a', name: '尾款登记', values: { amount: 15000, time: '2026-10-22 09:00', status: '待确认', owner: '王敏' } },
  { id: 'P004', source: 'payment', customer: 'b', name: '设备采购回款', values: { amount: 48000, time: '2026-10-16 14:20', status: '已确认', owner: '王敏' } },
  { id: 'F001', source: 'followup', customer: 'a', name: '了解采购需求', values: { content: '确认新材料采购需求', duration: 30, time: '2026-10-10 10:00', status: '电话沟通', owner: '李明' } },
  { id: 'F002', source: 'followup', customer: 'a', name: '方案交流', values: { content: '演示技术方案', duration: 60, time: '2026-10-18 14:00', status: '线上会议', owner: '李明' } },
  { id: 'F003', source: 'followup', customer: 'a', name: '采购进度确认', values: { content: '确认下一批采购计划', duration: 15, time: '2026-10-22 16:30', status: '电话沟通', owner: '王敏' } },
  { id: 'F004', source: 'followup', customer: 'b', name: '设备需求沟通', values: { content: '沟通设备交付安排', duration: 45, time: '2026-10-17 09:30', status: '客户拜访', owner: '王敏' } },
  { id: 'C001', source: 'contract', customer: 'a', name: '年度材料采购合同', values: { amount: 120000, time: '2026-10-06 09:00', status: '已签约', owner: '李明' } },
  { id: 'C002', source: 'contract', customer: 'a', name: '补充采购合同', values: { amount: 60000, time: null, status: '审批中', owner: '李明' } },
  { id: 'C003', source: 'contract', customer: 'b', name: '设备采购合同', values: { amount: 240000, time: '2026-10-12 11:00', status: '已签约', owner: '王敏' } },
  { id: 'V001', source: 'visit', customer: 'a', name: '技术方案现场交流', values: { duration: 90, time: '2026-10-15 14:00', status: '已完成', owner: '李明' } },
  { id: 'V002', source: 'visit', customer: 'a', name: '采购部门拜访', values: { duration: 45, time: '2026-10-21 10:00', status: '已完成', owner: '李明' } },
  { id: 'V003', source: 'visit', customer: 'b', name: '设备验收回访', values: { duration: 60, time: '2026-10-20 15:00', status: '已完成', owner: '王敏' } },
];

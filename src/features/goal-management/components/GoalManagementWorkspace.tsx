import { useMemo, useState } from 'react';
import { Button, Card, Drawer, Form, Input, InputNumber, Modal, Progress, Select, Space, Switch, Table, Tabs, Tag, Tooltip, Typography, message, type TableColumnsType } from 'antd';

type GoalRule = { key: string; name: string; period: string; metric: string; target: string; objectCount: number; enabled: boolean };

const initialRules: GoalRule[] = [
  { key: 'receivable', name: '2026年度回款目标', period: '2026年 · 按月', metric: '实际回款金额 · 求和', target: '¥ 1,280 万', objectCount: 18, enabled: true },
  { key: 'contract', name: '2026年度新签合同目标', period: '2026年 · 按月', metric: '合同金额 · 求和', target: '¥ 860 万', objectCount: 12, enabled: true },
  { key: 'opportunity', name: '第三季度商机储备目标', period: '2026年 · 按季度', metric: '商机金额 · 求和', target: '¥ 1,500 万', objectCount: 8, enabled: false },
];

const rankRows = [
  { key: 'south', name: '华南一区', target: '¥260万', actual: '¥236万', rate: 90.8, status: '达成' },
  { key: 'east', name: '华东一区', target: '¥320万', actual: '¥256万', rate: 80, status: '关注' },
  { key: 'north', name: '华北一区', target: '¥280万', actual: '¥191万', rate: 68.2, status: '预警' },
  { key: 'central', name: '华中一区', target: '¥220万', actual: '¥131万', rate: 59.5, status: '预警' },
];

export function GoalManagementWorkspace({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [rules, setRules] = useState(initialRules);
  const [drawerRule, setDrawerRule] = useState<GoalRule>();
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [form] = Form.useForm<{ name: string; period: string; metric: string }>();
  const [messageApi, messageContext] = message.useMessage();

  const updateRule = (key: string, enabled: boolean) => {
    setRules((current) => current.map((rule) => rule.key === key ? { ...rule, enabled } : rule));
    messageApi.success(enabled ? '目标规则已启用' : '目标规则已停用');
  };

  const createRule = async () => {
    const values = await form.validateFields();
    setRules((current) => [...current, { key: `rule-${Date.now()}`, name: values.name, period: `2026年 · ${values.period}`, metric: `${values.metric} · 求和`, target: '待设置', objectCount: 0, enabled: false }]);
    setNewRuleOpen(false);
    form.resetFields();
    messageApi.success('目标规则已创建，请继续配置目标值');
  };

  const tabs = [
    { key: 'analysis', label: '目标分析', children: <GoalAnalysis /> },
    { key: 'rules', label: '目标设置', children: <RuleSettings rules={rules} onToggle={updateRule} onConfigure={setDrawerRule} onCreate={() => setNewRuleOpen(true)} /> },
    { key: 'settings', label: '系统设置', children: <SystemSettings /> },
    { key: 'permissions', label: '权限控制', children: <PermissionSettings /> },
  ];

  return <>{messageContext}<div className="goal-management-workspace"><header className="goal-heading"><div className="goal-heading-main"><Button type="text" className="goal-back-button" onClick={onBack}>返回应用中心</Button><div><Typography.Title level={3}>目标管理</Typography.Title><Typography.Text type="secondary">统一配置目标规则并跟踪组织达成情况</Typography.Text></div></div><Tooltip title="导出当前筛选范围内的目标分析数据"><Button onClick={() => messageApi.success('目标分析数据已开始导出')}>导出数据</Button></Tooltip></header><Card className="goal-content-card"><Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} /></Card><Drawer title={drawerRule ? `配置目标值：${drawerRule.name}` : '配置目标值'} open={Boolean(drawerRule)} onClose={() => setDrawerRule(undefined)} size="large" footer={<Space><Button onClick={() => setDrawerRule(undefined)}>取消</Button><Button type="primary" onClick={() => { setDrawerRule(undefined); messageApi.success('目标值已保存'); }}>保存目标值</Button></Space>}><GoalValueEditor rule={drawerRule} /></Drawer><Modal title="新建目标规则" open={newRuleOpen} onCancel={() => setNewRuleOpen(false)} onOk={createRule} okText="创建规则" cancelText="取消"><Form form={form} layout="vertical" initialValues={{ period: '按月', metric: '实际回款金额' }}><Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }, { max: 20, message: '规则名称最多 20 个字符' }]}><Input placeholder="例如：2026年度回款目标" /></Form.Item><Form.Item name="period" label="考核周期" rules={[{ required: true }]}><Select options={[{ value: '按月', label: '按月' }, { value: '按季度', label: '按季度' }, { value: '按年', label: '按年' }]} /></Form.Item><Form.Item name="metric" label="考核指标" rules={[{ required: true }]}><Select options={[{ value: '实际回款金额', label: '实际回款金额' }, { value: '合同金额', label: '合同金额' }, { value: '商机金额', label: '商机金额' }]} /></Form.Item></Form></Modal></div></>;
}

function GoalAnalysis() {
  const columns: TableColumnsType<(typeof rankRows)[number]> = useMemo(() => [
    { title: '排名', key: 'rank', width: 80, render: (_value, _row, index) => <b className={index < 2 ? 'goal-rank top' : 'goal-rank'}>{index + 1}</b> },
    { title: '团队', dataIndex: 'name', key: 'name', render: (name: string, row) => <div><b>{name}</b><span className="goal-table-sub">目标 {row.target} · 完成 {row.actual}</span></div> },
    { title: '完成率', key: 'rate', width: 240, render: (_value, row) => <div className="goal-rate-cell"><Progress percent={row.rate} size="small" showInfo={false} strokeColor={row.rate < 70 ? '#F04438' : row.rate < 90 ? '#F79009' : '#24A148'} /><b>{row.rate}%</b></div> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={status === '达成' ? 'success' : status === '关注' ? 'warning' : 'error'}>{status}</Tag> },
  ], []);
  return <div className="goal-tab-content"><section className="goal-filter-bar"><label>目标规则<Select defaultValue="receivable" options={[{ value: 'receivable', label: '2026年度回款目标' }, { value: 'contract', label: '2026年度新签合同目标' }]} /></label><label>考核对象<Select defaultValue="all" options={[{ value: 'all', label: '全部有权限对象' }, { value: 'east', label: '华东一区' }, { value: 'li', label: '李晓雯' }]} /></label><label>统计时间<Select defaultValue="half" options={[{ value: 'half', label: '2026年 1月-6月' }, { value: 'quarter', label: '2026年 1月-3月' }]} /></label></section><section className="goal-kpis"><Kpi label="目标值" value="¥ 1,280 万" detail="已配置 18 个考核对象" /><Kpi label="完成值" value="¥ 926 万" detail="较上周期 +8.4%" trend="positive" /><Kpi label="目标差值" value="- ¥ 354 万" detail="完成值 - 目标值" trend="warning" /><Kpi label="周期目标完成率" value="72.3%" detail="较时间进度低 2.7 个百分点" trend="warning" /></section><section className="goal-analysis-grid"><Card title="周期目标完成率" extra={<Typography.Text type="secondary">单位：万元</Typography.Text>}><div className="goal-chart" aria-label="一月至六月目标与完成值对比"><GoalBar month="1月" target={72} actual={57} /><GoalBar month="2月" target={76} actual={63} /><GoalBar month="3月" target={80} actual={72} /><GoalBar month="4月" target={88} actual={61} /><GoalBar month="5月" target={96} actual={72} /><GoalBar month="6月" target={102} actual={85} /></div><div className="goal-chart-legend"><span><i />目标值</span><span><i className="actual" />完成值</span></div></Card><Card title="团队达成排名" extra={<Typography.Text type="secondary">按完成率</Typography.Text>}><Table className="goal-ranking-table" rowKey="key" columns={columns} dataSource={rankRows} pagination={false} /></Card></section></div>;
}

function Kpi({ label, value, detail, trend }: { label: string; value: string; detail: string; trend?: 'positive' | 'warning' }) { return <Card className="goal-kpi"><Typography.Text type="secondary">{label}</Typography.Text><strong className={trend ? `is-${trend}` : ''}>{value}</strong><small className={trend ? `is-${trend}` : ''}>{detail}</small></Card>; }
function GoalBar({ month, target, actual }: { month: string; target: number; actual: number }) { return <div className="goal-bar-group"><div className="goal-bar-pair"><i style={{ height: `${target}%` }} /><i className="actual" style={{ height: `${actual}%` }} /></div><span>{month}</span></div>; }

function RuleSettings({ rules, onToggle, onConfigure, onCreate }: { rules: GoalRule[]; onToggle: (key: string, enabled: boolean) => void; onConfigure: (rule: GoalRule) => void; onCreate: () => void }) {
  const columns: TableColumnsType<GoalRule> = [
    { title: '规则名称', dataIndex: 'name', key: 'name', width: 230, render: (name: string, rule) => <div><b>{name}</b><span className="goal-table-sub">{rule.objectCount} 个考核对象</span></div> },
    { title: '考核财年 / 周期', dataIndex: 'period', key: 'period' },
    { title: '数据源 / 指标', dataIndex: 'metric', key: 'metric' },
    { title: '目标值', dataIndex: 'target', key: 'target' },
    { title: '状态', key: 'enabled', width: 130, render: (_value, rule) => <Space><Switch size="small" checked={rule.enabled} onChange={(checked) => onToggle(rule.key, checked)} /><Tag color={rule.enabled ? 'success' : 'default'}>{rule.enabled ? '启用中' : '已停用'}</Tag></Space> },
    { title: '操作', key: 'actions', width: 110, render: (_value, rule) => <Button type="link" onClick={() => onConfigure(rule)}>配置目标值</Button> },
  ];
  return <div className="goal-tab-content"><div className="goal-tab-toolbar"><div><Typography.Title level={5}>目标规则</Typography.Title><Typography.Text type="secondary">启用规则后，拥有数据权限的成员可在目标分析中查看达成情况。</Typography.Text></div><Button type="primary" onClick={onCreate}>新建目标规则</Button></div><Table rowKey="key" columns={columns} dataSource={rules} pagination={{ pageSize: 5, showSizeChanger: false }} /></div>;
}

type GoalValueRow = { name: string; type: string; value: number };

function GoalValueEditor({ rule }: { rule?: GoalRule }) { const rows: GoalValueRow[] = [{ name: '华东一区', type: '部门', value: 3200000 }, { name: '华南一区', type: '部门', value: 2600000 }, { name: '李晓雯', type: '个人', value: 680000 }]; return <div className="goal-value-editor"><Card size="small"><b>{rule?.target ?? '待设置'}</b><Typography.Text type="secondary"> {rule ? `· 已设置 ${Math.max(rule.objectCount - 3, 0)} / ${rule.objectCount} 个考核对象` : ''}</Typography.Text><Progress percent={rule?.objectCount ? Math.round((Math.max(rule.objectCount - 3, 0) / rule.objectCount) * 100) : 0} showInfo={false} /></Card><Typography.Title level={5}>部门与个人目标值</Typography.Title><Table<GoalValueRow> rowKey="name" pagination={false} columns={[{ title: '考核对象', dataIndex: 'name' }, { title: '对象类型', dataIndex: 'type' }, { title: '年度目标值（元）', key: 'value', render: (_value, row) => <InputNumber min={0} defaultValue={row.value} /> }]} dataSource={rows} /></div>; }

function SystemSettings() { const [locked, setLocked] = useState(true); return <div className="goal-tab-content goal-setting-list"><SettingRow title="完成率标记" description="在目标分析看板中，根据完成率区间显示不同颜色。" action={<div className="goal-range"><span className="low">低于 70%</span><span className="middle">70%-89%</span><span className="high">不低于 90%</span></div>} /><SettingRow title="目标拆分到日" description="将周期目标值转换为每日目标，供时间进度与阶段完成率计算使用。" action={<Select defaultValue="natural" options={[{ value: 'natural', label: '按自然日均分' }, { value: 'workday', label: '按工作日均分' }]} />} /><SettingRow title="目标完成数据锁定" description="已锁定规则的实例数据变更不会影响考核结果。" action={<Switch checked={locked} onChange={setLocked} />} /></div>; }
function SettingRow({ title, description, action }: { title: string; description: string; action: React.ReactNode }) { return <Card className="goal-setting-row"><div><b>{title}</b><Typography.Paragraph type="secondary">{description}</Typography.Paragraph></div>{action}</Card>; }

function PermissionSettings() { const data = [{ key: 'read', permission: '目标规则：查看', admin: '全部', ops: '全部', manager: '本部门', seller: '本人' }, { key: 'edit', permission: '目标规则：新增、编辑、启停', admin: '允许', ops: '允许', manager: '无', seller: '无' }, { key: 'value', permission: '目标值：录入、导入、平均拆分', admin: '允许', ops: '允许', manager: '本部门', seller: '无' }, { key: 'analysis', permission: '目标分析：查看、导出', admin: '全部', ops: '全部', manager: '本部门', seller: '本人' }]; return <div className="goal-tab-content"><div className="goal-permission-note">当前正在查看“销售运营管理员”权限组。数据权限决定目标分析与提醒中可见的统计范围。</div><Table rowKey="key" pagination={false} columns={[{ title: '资源 / 操作', dataIndex: 'permission', key: 'permission', width: 280 }, { title: '管理员', dataIndex: 'admin', key: 'admin' }, { title: '销售运营', dataIndex: 'ops', key: 'ops' }, { title: '销售主管', dataIndex: 'manager', key: 'manager' }, { title: '销售成员', dataIndex: 'seller', key: 'seller' }]} dataSource={data} /></div>; }

import { useState } from 'react';
import { Alert, Breadcrumb, Button, Checkbox, ConfigProvider, DatePicker, Dropdown, Empty, Form, Input, InputNumber, Modal, Popconfirm, Popover, Select, Space, Table, Tabs, Tooltip, message, type TableColumnsType } from 'antd';
import { CalculatorOutlined, CheckCircleOutlined, DeleteOutlined, DownOutlined, InfoCircleOutlined, PlusOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { AddIcon } from '../../shared/icons';
import dayjs from 'dayjs';
import { availableTargets, calculate, configError, customers, displayResult, freshCondition, freshConfig, initialRecords, kindLabels, methodLabels, operatorsFor, sourceOf, sources, type Condition, type Method, type Source, type SourceField, type SourceId, type SourceRecord, type StatConfig } from './statistics-prototype-model';
import './statistics-fields-prototype.css';

type FieldRow = { id: string; name: string; type: string; source?: string; method?: string; scope?: string; config?: StatConfig; required?: boolean };
const baseFields: FieldRow[] = [
  { id: 'customer-name', name: '客户名称', type: '单行文本', required: true },
  { id: 'customer-type', name: '客户类型', type: '单选' },
  { id: 'customer-stage', name: '跟进阶段', type: '单选' },
  { id: 'customer-owner', name: '负责人', type: '成员' },
  { id: 'customer-phone', name: '联系电话', type: '电话' },
  { id: 'customer-created', name: '创建时间', type: '日期时间' },
];

function ValueInput({ field, value, onChange, label, disabled = false }: { field?: SourceField; value: string | number | null; onChange: (value: string | number | null) => void; label: string; disabled?: boolean }) {
  if (field?.kind === 'choice') return <Select className="sf-value-control" aria-label={label} disabled={disabled} value={value ?? undefined} placeholder="请选择" options={field.options?.map(item => ({ value: item, label: item }))} onChange={onChange} />;
  if (field?.kind === 'money' || field?.kind === 'number') return <InputNumber className="sf-value-control" aria-label={label} disabled={disabled} value={value === null || value === '' ? null : Number(value)} precision={field.kind === 'money' ? 2 : undefined} placeholder="请输入数值" onChange={onChange} controls={false} />;
  if (field?.kind === 'date') return <DatePicker className="sf-value-control" aria-label={label} disabled={disabled} value={value ? dayjs(value) : null} showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" placeholder="请选择时间" onChange={date => onChange(date ? date.format('YYYY-MM-DD HH:mm') : null)} />;
  return <Input className="sf-value-control" aria-label={label} disabled={disabled} value={value ?? ''} placeholder="请输入" onChange={event => onChange(event.target.value)} />;
}

function ConditionsEditor({ source, conditions, onChange }: { source?: Source; conditions: Condition[]; onChange: (conditions: Condition[]) => void }) {
  const update = (id: string, next: Partial<Condition>) => onChange(conditions.map(condition => condition.id === id ? { ...condition, ...next } : condition));
  return <div className="sf-conditions">
    <p className="sf-condition-hint">{conditions.length ? '满足以下全部条件的关联记录参与统计' : '未设置条件，统计全部有效关联记录'}</p>
    {conditions.map((condition, index) => {
      const field = source?.fields.find(item => item.id === condition.field);
      const noValue = ['empty', 'notempty'].includes(condition.operator);
      return <div className="sf-condition" key={condition.id}>
        <div className="sf-condition-selects">
          <Select aria-label={`筛选字段${index + 1}`} value={condition.field} placeholder="请选择来源字段" options={source?.fields.map(item => ({ value: item.id, label: item.label }))} onChange={value => update(condition.id, { field: value, operator: 'eq', value: null })} />
          <Select aria-label={`筛选运算符${index + 1}`} disabled={!field} value={condition.operator} options={operatorsFor(field)} onChange={value => update(condition.id, { operator: value, value: null })} />
          <Button type="text" aria-label={`删除筛选条件${index + 1}`} icon={<DeleteOutlined />} onClick={() => onChange(conditions.filter(item => item.id !== condition.id))} />
        </div>
        {!noValue && <ValueInput field={field} disabled={!field} label={`筛选值${index + 1}`} value={condition.value} onChange={value => update(condition.id, { value })} />}
      </div>;
    })}
    <Button type="link" className="sf-add-condition" icon={<PlusOutlined />} disabled={!source || conditions.length >= 5} onClick={() => onChange([...conditions, freshCondition()])}>添加筛选条件</Button>
    {!source && <span className="sf-help">请先选择数据来源</span>}
  </div>;
}

function StatisticModal({ initial, existingNames, isEditing, onClose, onSave }: { initial: StatConfig; existingNames: string[]; isEditing: boolean; onClose: () => void; onSave: (config: StatConfig) => void }) {
  const [config, setConfig] = useState<StatConfig>(() => structuredClone(initial));
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const source = sourceOf(config.source);
  const target = source?.fields.find(item => item.id === config.target);
  const error = configError(config);
  const dirty = JSON.stringify(config) !== JSON.stringify(initial);
  const close = () => dirty ? setDiscard(true) : onClose();
  const change = (next: StatConfig) => { setConfig(next); setSaveError(undefined); };
  const submit = () => {
    setAttempted(true);
    if (error) return;
    const name = config.name.trim();
    if (existingNames.some(item => item.trim() === name)) { setSaveError('标题已存在，请使用其他标题'); return; }
    setSaving(true);
    window.setTimeout(() => { onSave({ ...config, name, target: config.method === 'count' ? undefined : config.target, conditions: config.scope === 'all' ? [] : config.conditions }); }, 450);
  };


  return <>
    <ConfigProvider theme={{ token: { controlHeight: 32 } }}>
    <Modal open title={<div className="sf-modal-title"><span>{isEditing ? '编辑字段' : '新增字段'}</span><Popover trigger="click" placement="bottomLeft" classNames={{ root: 'sf-field-help-popover' }} content="字段说明：用于统计当前表单的关联表单数据，比如合同数、订单数，最新外勤拜访时间等"><Button type="text" size="small" className="sf-field-help-button" aria-label="查看新增字段说明" icon={<QuestionCircleOutlined />} /></Popover></div>} width={520} centered className="sf-statistic-modal" classNames={{ container: 'sf-modal-container', header: 'sf-modal-header', body: 'sf-modal-body', footer: 'sf-modal-footer' }} mask={{ closable: false }} keyboard={!saving} closable={!saving} onCancel={close} footer={<div className="sf-modal-actions"><Space size={8}><Button disabled={saving} onClick={close}>取消</Button><Button type="primary" loading={saving} onClick={submit}>确定</Button></Space></div>}>
      <Form layout="vertical" colon={false} className="sf-config-form">
        <div className="sf-enable-field"><Checkbox checked={config.enabled} onChange={event => change({ ...config, enabled: event.target.checked })}>启用字段</Checkbox></div>
        <Form.Item label="字段类型" required>
          <Select aria-label="字段类型" value="statistics" options={[{ value: 'statistics', label: '统计字段' }]} />
        </Form.Item>
        <Form.Item label="标题" required validateStatus={attempted && !config.name.trim() ? 'error' : undefined} help={attempted && !config.name.trim() ? '请输入标题' : undefined}>
          <Input aria-label="标题" value={config.name} maxLength={100} placeholder="最多100字符" onChange={event => change({ ...config, name: event.target.value })} />
        </Form.Item>
        <Form.Item label="数据来源" required validateStatus={attempted && !source ? 'error' : undefined} help={attempted && !source ? '请选择数据来源' : undefined}>
          <Select aria-label="数据来源" value={config.source} placeholder="请选择关联表单" options={sources.map(item => ({ value: item.id, label: item.label }))} onChange={(value: SourceId) => { change({ ...config, source: value, target: undefined, scope: 'all', conditions: [] }); }} />
        </Form.Item>
        <Form.Item label="统计方式" required>
          <Select aria-label="统计方式" value={config.method} options={Object.entries(methodLabels).map(([value, label]) => ({ value, label }))} onChange={(method: Method) => change({ ...config, method, target: availableTargets(source, method).some(item => item.id === config.target) ? config.target : undefined })} />
        </Form.Item>
        <Form.Item label="统计字段" required={config.method !== 'count'} validateStatus={attempted && source && config.method !== 'count' && !config.target ? 'error' : undefined} help={attempted && source && config.method !== 'count' && !config.target ? '请选择统计字段' : undefined} extra={config.method === 'count' ? '按关联记录条数计数，无需选择具体字段' : config.method === 'sum' ? '仅支持数字、金额字段，空值不参与计算' : target?.kind === 'date' ? config.method === 'max' ? '日期取最大值，即最近发生时间' : '日期取最小值，即最早发生时间' : '支持数字、金额和日期时间字段，空值不参与计算'}>
          <Select aria-label="统计字段" disabled={!source || config.method === 'count'} value={config.method === 'count' ? '__count' : config.target} placeholder="请选择统计字段" options={config.method === 'count' ? [{ value: '__count', label: '记录数' }] : availableTargets(source, config.method).map(item => ({ value: item.id, label: `${item.label}（${kindLabels[item.kind]}）` }))} onChange={value => change({ ...config, target: value })} />
        </Form.Item>
        <Form.Item label="筛选条件">
          <ConditionsEditor source={source} conditions={config.conditions} onChange={conditions => change({ ...config, conditions, scope: conditions.length ? 'filtered' : 'all' })} />
        </Form.Item>
      </Form>
      {(attempted && error || saveError) && <Alert type="error" showIcon title={saveError || error} className="sf-config-error" />}
    </Modal>
    </ConfigProvider>
    <Modal open={discard} title="放弃本次修改？" centered width={400} onCancel={() => setDiscard(false)} onOk={onClose} okText="放弃修改" cancelText="继续编辑"><p>尚未保存的字段配置将不会保留。</p></Modal>
  </>;
}

function RecordModal({ record, onClose, onSave }: { record: SourceRecord; onClose: () => void; onSave: (record: SourceRecord) => void }) {
  const [draft, setDraft] = useState(() => structuredClone(record));
  const [error, setError] = useState(false);
  const source = sourceOf(record.source)!;
  return <Modal open title="编辑示例关联记录" width={560} centered onCancel={onClose} okText="保存记录" cancelText="取消" onOk={() => { if (!draft.name.trim()) { setError(true); return; } onSave({ ...draft, name: draft.name.trim() }); }} styles={{ body: { maxHeight: 'calc(100dvh - 210px)', overflowY: 'auto', paddingBlock: 16 } }}>
    <Form layout="vertical">
      <Form.Item label="记录名称" required validateStatus={error ? 'error' : undefined} help={error ? '请输入记录名称' : undefined}><Input aria-label="记录名称" value={draft.name} onChange={event => { setDraft({ ...draft, name: event.target.value }); setError(false); }} /></Form.Item>
      <Form.Item label="关联客户" required><Select aria-label="记录关联客户" value={draft.customer} options={customers.map(item => ({ value: item.id, label: item.name }))} onChange={value => setDraft({ ...draft, customer: value })} /></Form.Item>
      {source.fields.map(field => <Form.Item label={field.label} key={field.id}><ValueInput field={field} label={`记录${field.label}`} value={draft.values[field.id] ?? null} onChange={value => setDraft({ ...draft, values: { ...draft.values, [field.id]: value } })} /></Form.Item>)}
    </Form>
  </Modal>;
}

export function StatisticsFieldsPrototype() {
  const [configs, setConfigs] = useState<StatConfig[]>([]);
  const [records, setRecords] = useState<SourceRecord[]>(() => structuredClone(initialRecords));
  const [editing, setEditing] = useState<StatConfig>();
  const [recordEditing, setRecordEditing] = useState<SourceRecord>();
  const [tab, setTab] = useState('fields');
  const [search, setSearch] = useState('');
  const [dataSource, setDataSource] = useState<SourceId>('payment');
  const [dataCustomer, setDataCustomer] = useState('a');
  const [lastUpdated, setLastUpdated] = useState<string>();
  const [messages, messageContext] = message.useMessage();
  const enabledConfigs = configs.filter(config => config.enabled);
  const rows: FieldRow[] = [...baseFields, ...configs.map(config => ({ id: config.id, name: config.name, type: '统计字段', source: sourceOf(config.source)?.label, method: methodLabels[config.method], scope: config.scope === 'all' ? '全部关联数据' : `${config.conditions.length} 个条件`, config }))].filter(item => item.name.includes(search.trim()));
  const save = (config: StatConfig) => {
    setConfigs(items => items.some(item => item.id === config.id) ? items.map(item => item.id === config.id ? config : item) : [...items, config]);
    setEditing(undefined);
    setLastUpdated(dayjs().format('HH:mm:ss'));
    messages.success(config.enabled ? '统计字段已保存，可在「效果验证」中查看结果' : '统计字段已保存，当前未启用');
  };
  const source = sourceOf(dataSource)!;
  const stamp = () => setLastUpdated(dayjs().format('HH:mm:ss'));
  const dataColumns: TableColumnsType<SourceRecord> = [
    { title: '记录名称', dataIndex: 'name', width: 180 },
    ...source.fields.filter(field => field.id !== 'content').map(field => ({ title: field.label, width: field.kind === 'date' ? 175 : 120, render: (_: unknown, record: SourceRecord) => field.kind === 'money' && record.values[field.id] !== null ? `¥ ${Number(record.values[field.id]).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : String(record.values[field.id] ?? '—') })),
    { title: '操作', width: 115, fixed: 'right', render: (_, record) => <Space size={0}><Button type="link" size="small" onClick={() => setRecordEditing(record)}>编辑</Button><Popconfirm title="移除这条示例记录？" description="关联统计结果将自动更新。" okText="移除" cancelText="取消" onConfirm={() => { setRecords(items => items.filter(item => item.id !== record.id)); stamp(); messages.success('示例记录已移除，统计结果已更新'); }}><Button type="link" size="small" danger>移除</Button></Popconfirm></Space> },
  ];
  const fieldColumns: TableColumnsType<FieldRow> = [
    { title: '字段名称', dataIndex: 'name', width: 190, render: (name, row) => <span className="sf-field-name">{row.config && <CalculatorOutlined className="sf-stat-icon" />}{name}{row.required && <span className="sf-required-word">必填</span>}</span> },
    { title: '字段类型', dataIndex: 'type', width: 125, render: (type, row) => row.config ? <span className="sf-stat-type">{type}</span> : type },
    { title: '数据来源', dataIndex: 'source', width: 110, render: value => value || '—' },
    { title: '统计方式', dataIndex: 'method', width: 100, render: value => value || '—' },
    { title: '统计范围', dataIndex: 'scope', width: 150, render: value => value || '—' },
    { title: '状态', width: 90, render: (_, row) => row.config && !row.config.enabled ? <span className="sf-status is-disabled">未启用</span> : <span className="sf-status"><CheckCircleOutlined /> 已启用</span> },
    { title: '操作', width: 125, fixed: 'right', render: (_, row) => row.config ? <Space size={0}><Button type="link" size="small" aria-label={`编辑字段${row.name}`} onClick={() => setEditing(row.config)}>编辑</Button><Popconfirm title={`删除「${row.name}」？`} description="仅移除本次原型中的统计配置，不影响来源记录。" okText="删除" cancelText="取消" onConfirm={() => { setConfigs(items => items.filter(item => item.id !== row.id)); messages.success('统计字段已删除'); }}><Button type="link" size="small" danger>删除</Button></Popconfirm></Space> : <span className="sf-help">系统字段</span> },
  ];

  return <div className="sf-workspace">
    {messageContext}
    <Breadcrumb items={[{ title: '管理后台' }, { title: '表单管理' }, { title: '客户' }]} />
    <div className="sf-page-heading"><div><h1>客户表单</h1><p>配置客户字段，统一管理关联业务的统计口径。</p></div><span className="sf-prototype-note">MVP 原型 · 示例数据</span></div>
    <div className="sf-workarea crm-surface">
      <Tabs activeKey={tab} onChange={setTab} className="sf-page-tabs" items={[
        { key: 'fields', label: '字段配置', children: <>
          <div className="sf-fields-toolbar"><span>共 <strong>{baseFields.length + configs.length}</strong> 个字段 <span className="sf-toolbar-divider">/</span> 统计字段 <strong>{configs.length}</strong> 个</span><Space><Input aria-label="搜索字段" placeholder="搜索字段名称" prefix={<SearchOutlined />} allowClear value={search} onChange={event => setSearch(event.target.value)} /><Dropdown trigger={['click']} menu={{ items: [{ key: 'text', label: '单行文本', disabled: true }, { key: 'number', label: '数字', disabled: true }, { type: 'divider' }, { key: 'statistics', label: '统计字段', icon: <CalculatorOutlined /> }], onClick: ({ key }) => { if (key === 'statistics') setEditing(freshConfig()); } }}><Button type="primary" icon={<AddIcon />}>新增字段 <DownOutlined /></Button></Dropdown></Space></div>
          <Table rowKey="id" size="middle" dataSource={rows} columns={fieldColumns} pagination={false} scroll={{ x: 1000 }} locale={{ emptyText: '没有匹配的字段，请调整搜索内容' }} />
          <div className="sf-field-footnote"><InfoCircleOutlined /><span>统计字段从关联表单自动计算，业务人员只能查看统计结果。</span><Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setEditing(freshConfig())}>新增统计字段</Button></div>
        </> },
        { key: 'validation', label: '效果验证', children: <div className="sf-validation">
          <div className="sf-section-heading"><div><h2>客户统计结果</h2><p>修改下方关联记录，查看统计结果随数据变化自动更新。</p></div>{lastUpdated && <span className="sf-help">最近更新 {lastUpdated}</span>}</div>
          {!enabledConfigs.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={configs.length ? "暂无已启用的统计字段，请在字段配置中启用后验证" : "请先新增一个统计字段，再验证计算结果"}><Button type="primary" onClick={() => setEditing(freshConfig())}>新增统计字段</Button></Empty> : <Table rowKey="id" size="middle" pagination={false} scroll={{ x: Math.max(680, enabledConfigs.length * 200 + 320) }} dataSource={customers} columns={[{ title: '客户名称', dataIndex: 'name', width: 260, fixed: 'left' }, ...enabledConfigs.map(config => ({ title: <Tooltip title={`${sourceOf(config.source)?.label} · ${methodLabels[config.method]}`}><span><CalculatorOutlined /> {config.name}</span></Tooltip>, width: config.target === 'time' ? 200 : 180, render: (_: unknown, customer: typeof customers[number]) => <span className="sf-live-result">{displayResult(config, calculate(config, customer.id, records).value)}</span> }))]} />}
          <div className="sf-source-editor"><div className="sf-section-heading"><div><h2>示例关联数据</h2><p>仅用于本次验证，刷新页面后恢复初始数据。</p></div><Button icon={<PlusOutlined />} onClick={() => setRecordEditing({ id: `DEMO-${crypto.randomUUID().slice(0, 8)}`, source: dataSource, customer: dataCustomer, name: '', values: Object.fromEntries(source.fields.map(field => [field.id, null])) })}>新增关联记录</Button></div>
            <div className="sf-source-filters"><label htmlFor="sf-data-source">数据来源</label><Select id="sf-data-source" aria-label="示例数据来源" value={dataSource} onChange={setDataSource} options={sources.map(item => ({ value: item.id, label: item.label }))} /><label htmlFor="sf-data-customer">关联客户</label><Select id="sf-data-customer" aria-label="示例关联客户" value={dataCustomer} onChange={setDataCustomer} options={customers.map(item => ({ value: item.id, label: item.name }))} /></div>
            <Table size="middle" rowKey="id" columns={dataColumns} dataSource={records.filter(item => item.source === dataSource && item.customer === dataCustomer)} pagination={false} scroll={{ x: 850 }} locale={{ emptyText: '该客户暂无此类关联记录，可新增记录验证统计变化' }} />
          </div>
        </div> },
      ]} />
    </div>
    {editing && <StatisticModal key={editing.id} initial={editing} isEditing={configs.some(item => item.id === editing.id)} existingNames={[...baseFields.map(item => item.name), ...configs.filter(item => item.id !== editing.id).map(item => item.name)]} onClose={() => setEditing(undefined)} onSave={save} />}
    {recordEditing && <RecordModal key={recordEditing.id} record={recordEditing} onClose={() => setRecordEditing(undefined)} onSave={record => { setRecords(items => items.some(item => item.id === record.id) ? items.map(item => item.id === record.id ? record : item) : [...items, record]); setRecordEditing(undefined); stamp(); messages.success('关联记录已保存，统计结果已自动更新'); }} />}
  </div>;
}

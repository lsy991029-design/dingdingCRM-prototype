import { useMemo, useState } from 'react';
import {
  Button, Empty, Input, Modal, Popconfirm, Radio, Select, Space, Switch, Table, Tabs, Tag, Upload, message,
  type TableColumnsType, type UploadFile,
} from 'antd';
import { HolderOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import './receivables-admin.css';

type PaymentField = {
  key: string;
  name: string;
  property: '预设' | '自定义';
  type: string;
  required: boolean;
  enabled: boolean;
};

type FlowNode = { key: string; name: string; type: 'start' | 'approval' | 'end' };
type FlowPermission = 'editable' | 'readonly' | 'hidden';

const fieldSeed: PaymentField[] = [
  { key: 'payment-no', name: '回款编号', property: '预设', type: '流水号', required: false, enabled: true },
  { key: 'customer', name: '关联客户', property: '预设', type: '关联对象', required: true, enabled: true },
  { key: 'payment-detail', name: '回款明细', property: '预设', type: '表格', required: true, enabled: true },
  { key: 'payment-date', name: '回款日期', property: '预设', type: '日期', required: true, enabled: true },
  { key: 'payment-type', name: '回款类型', property: '预设', type: '单选框', required: false, enabled: true },
  { key: 'owner', name: '负责人', property: '预设', type: '成员', required: true, enabled: true },
  { key: 'contract', name: '关联合同', property: '预设', type: '关联对象', required: false, enabled: false },
  { key: 'order', name: '关联订单', property: '预设', type: '关联对象', required: false, enabled: false },
  { key: 'amount', name: '回款金额', property: '预设', type: '金额', required: false, enabled: false },
  { key: 'plan', name: '关联回款计划', property: '预设', type: '关联对象', required: false, enabled: false },
  { key: 'creator', name: '创建人', property: '预设', type: '成员', required: false, enabled: false },
];

const flowFormFields = ['回款编号', '关联客户', '回款明细', '关联合同', '关联订单', '回款金额', '关联回款计划', '回款日期', '回款类型', '负责人'];
const fieldTypes = ['单行文本', '多行文本', '数字', '金额', '单选框', '多选框', '日期', '成员', '关联对象', '表格', '流水号'];

const freshField = (): PaymentField => ({ key: `new-${Date.now()}`, name: '', property: '自定义', type: '单行文本', required: false, enabled: true });

type ReceivablesAdminWorkspaceProps = {
  periodAllocationEnabled: boolean;
  onPeriodAllocationChange: (enabled: boolean) => void;
};

export function ReceivablesAdminWorkspace({ periodAllocationEnabled, onPeriodAllocationChange }: ReceivablesAdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('type');
  const [fields, setFields] = useState(fieldSeed);
  const [fieldFilter, setFieldFilter] = useState<'enabled' | 'disabled'>('enabled');
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldEditing, setFieldEditing] = useState<PaymentField>();
  const [typeEnabled, setTypeEnabled] = useState(true);
  const [flowStarted, setFlowStarted] = useState(false);
  const [flowEnabled, setFlowEnabled] = useState(false);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([
    { key: 'start', name: '发起人', type: 'start' },
    { key: 'end', name: '流程结束', type: 'end' },
  ]);
  const [selectedNodeKey, setSelectedNodeKey] = useState('start');
  const [flowPanel, setFlowPanel] = useState<'node' | 'process'>('node');
  const [flowPermissions, setFlowPermissions] = useState<Record<string, FlowPermission>>({});
  const [templates, setTemplates] = useState<{ key: string; name: string; enabled: boolean }[]>([]);
  const [defaultTemplateEnabled, setDefaultTemplateEnabled] = useState(true);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateFile, setTemplateFile] = useState<UploadFile>();
  const [templateHelp, setTemplateHelp] = useState<'example' | 'fields'>();
  const [messages, messageContext] = message.useMessage();

  const enabledCount = fields.filter((field) => field.enabled).length;
  const disabledCount = fields.length - enabledCount;
  const visibleFields = useMemo(() => fields.filter((field) => field.enabled === (fieldFilter === 'enabled') && field.name.includes(fieldSearch.trim())), [fields, fieldFilter, fieldSearch]);
  const selectedNode = flowNodes.find((node) => node.key === selectedNodeKey) ?? flowNodes[0];

  const saveField = () => {
    if (!fieldEditing?.name.trim()) {
      messages.error('请输入字段名称');
      return;
    }
    const updated = { ...fieldEditing, name: fieldEditing.name.trim() };
    setFields((current) => current.some((field) => field.key === updated.key)
      ? current.map((field) => field.key === updated.key ? updated : field)
      : [...current, updated]);
    setFieldEditing(undefined);
    messages.success('字段配置已保存');
  };

  const addApprovalNode = () => {
    const node: FlowNode = { key: `approval-${Date.now()}`, name: '审批人', type: 'approval' };
    setFlowNodes((current) => [...current.slice(0, -1), node, current[current.length - 1]]);
    setSelectedNodeKey(node.key);
    setFlowPanel('node');
  };

  const fieldColumns: TableColumnsType<PaymentField> = [
    { title: '排序', width: 78, align: 'center', render: () => <HolderOutlined className="receivable-admin-sort-handle" /> },
    { title: '字段名称', dataIndex: 'name', width: 220, render: (name, row) => <span>{name}{row.required && <span className="receivable-admin-required">必填</span>}</span> },
    { title: '属性', dataIndex: 'property', width: 135 },
    { title: '字段类型', dataIndex: 'type', width: 170 },
    { title: '是否必填', width: 130, render: (_, row) => row.required ? <Tag color="red">必填</Tag> : <span className="receivable-admin-muted">可选</span> },
    { title: '操作', width: 180, fixed: 'right', render: (_, row) => <Space size={4}>
      <Button type="link" size="small" onClick={() => setFieldEditing({ ...row })}>编辑</Button>
      <Button type="link" size="small" danger={row.enabled} onClick={() => setFields((current) => current.map((field) => field.key === row.key ? { ...field, enabled: !field.enabled } : field))}>{row.enabled ? '停用' : '启用'}</Button>
    </Space> },
  ];

  const typeColumns: TableColumnsType<{ key: string; name: string; note: string }> = [
    { title: '类型', dataIndex: 'name', width: 300 },
    { title: '备注', dataIndex: 'note', width: 300 },
    { title: '操作', render: () => <Space size={8}>
      <Button type="link" size="small" onClick={() => setActiveTab('fields')}>设置字段</Button>
      <Popconfirm title={typeEnabled ? '停用回款类型？' : '启用回款类型？'} okText="确定" cancelText="取消" onConfirm={() => { setTypeEnabled((value) => !value); messages.success(typeEnabled ? '回款类型已停用' : '回款类型已启用'); }}>
        <Button type="link" size="small">{typeEnabled ? '停用' : '启用'}</Button>
      </Popconfirm>
    </Space> },
  ];

  const typePage = <Table
    className="receivable-admin-table"
    rowKey="key"
    size="middle"
    columns={typeColumns}
    dataSource={typeEnabled ? [{ key: 'payment', name: '回款', note: '--' }] : []}
    pagination={false}
    locale={{ emptyText: '暂无启用的回款类型' }}
  />;

  const fieldPage = <>
    <div className="receivable-admin-field-toolbar">
      <Radio.Group value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)} optionType="button" buttonStyle="solid" options={[
        { label: `已启用（${enabledCount}）`, value: 'enabled' },
        { label: `未启用（${disabledCount}）`, value: 'disabled' },
      ]} />
      <Space wrap>
        <Input allowClear prefix={<SearchOutlined />} placeholder="请输入搜索字段名称" value={fieldSearch} onChange={(event) => setFieldSearch(event.target.value)} />
        <Button onClick={() => messages.info('表单属性设置已打开')}>表单属性设置</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFieldEditing(freshField())}>新增字段</Button>
      </Space>
    </div>
    <Table className="receivable-admin-table" rowKey="key" size="middle" columns={fieldColumns} dataSource={visibleFields} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 900 }} locale={{ emptyText: '没有匹配的回款字段' }} />
  </>;

  const flowPage = !flowStarted ? <div className="receivable-admin-flow-empty">
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="流程可实现需要更多人流转的业务场景">
      <Button type="primary" onClick={() => setFlowStarted(true)}>开启流程</Button>
    </Empty>
  </div> : <div className="receivable-admin-flow-designer">
    <div className="receivable-admin-flow-topbar">
      <Space><Button type="link" className="receivable-admin-version">流程版本（v1）</Button><Tag color={flowEnabled ? 'green' : 'gold'}>{flowEnabled ? '已启用' : '设计中'}</Tag></Space>
      <Space>
        <Button onClick={() => messages.success('流程草稿已保存')}>保存</Button>
        <Button type="primary" onClick={() => { setFlowEnabled(true); messages.success('审批流程已启用'); }}>启用流程</Button>
      </Space>
    </div>
    <div className="receivable-admin-flow-body">
      <div className="receivable-admin-flow-canvas">
        {flowNodes.map((node, index) => <div className="receivable-admin-flow-step" key={node.key}>
          <button className={`receivable-admin-flow-node is-${node.type}${selectedNodeKey === node.key ? ' is-selected' : ''}`} onClick={() => { setSelectedNodeKey(node.key); setFlowPanel('node'); }}>
            <span>{node.type === 'start' ? '发起人' : node.type === 'end' ? '流程结束' : node.name}</span>
            {node.type !== 'end' && <strong>{node.name}</strong>}
          </button>
          {index < flowNodes.length - 1 && <div className="receivable-admin-flow-link"><span /><Button shape="circle" size="small" icon={<PlusOutlined />} aria-label="添加审批节点" onClick={addApprovalNode} /><span /></div>}
        </div>)}
      </div>
      <aside className="receivable-admin-flow-properties">
        <Tabs activeKey={flowPanel} onChange={(key) => setFlowPanel(key as 'node' | 'process')} items={[{ key: 'node', label: '节点属性' }, { key: 'process', label: '流程属性' }]} />
        {flowPanel === 'node' ? <div className="receivable-admin-node-panel">
          <label>节点名称</label>
          <Input value={selectedNode?.name} disabled={selectedNode?.type === 'start' || selectedNode?.type === 'end'} onChange={(event) => setFlowNodes((current) => current.map((node) => node.key === selectedNodeKey ? { ...node, name: event.target.value } : node))} />
          {selectedNode?.type === 'approval' && <><label>审批人</label><Select placeholder="请选择审批人" options={['直属上级', '指定成员', '部门负责人'].map((value) => ({ value, label: value }))} /></>}
          <strong>表单操作权限</strong>
          <div className="receivable-admin-permission-head"><span>表单字段</span><span>可编辑</span><span>只读</span><span>隐藏</span></div>
          {flowFormFields.map((field) => <div className="receivable-admin-permission-row" key={field}>
            <span>{field}</span>
            <Radio checked={(flowPermissions[field] ?? 'editable') === 'editable'} onChange={() => setFlowPermissions((current) => ({ ...current, [field]: 'editable' }))} aria-label={`${field}可编辑`} />
            <Radio checked={flowPermissions[field] === 'readonly'} onChange={() => setFlowPermissions((current) => ({ ...current, [field]: 'readonly' }))} aria-label={`${field}只读`} />
            <Radio checked={flowPermissions[field] === 'hidden'} onChange={() => setFlowPermissions((current) => ({ ...current, [field]: 'hidden' }))} aria-label={`${field}隐藏`} />
          </div>)}
        </div> : <div className="receivable-admin-process-panel">
          <label>流程名称</label><Input defaultValue="回款审批流程" />
          <label>审批说明</label><Input.TextArea rows={4} placeholder="请输入流程说明" />
          <label className="receivable-admin-process-switch"><span>允许撤回</span><Switch defaultChecked /></label>
        </div>}
      </aside>
    </div>
  </div>;

  const printPage = <>
    <div className="receivable-admin-print-toolbar"><span>可启用模板数：{templates.filter((item) => item.enabled).length} / 50</span><Button type="primary" icon={<PlusOutlined />} onClick={() => { setTemplateFile(undefined); setTemplateOpen(true); }}>添加模板</Button></div>
    <div className="receivable-admin-template-grid">
      <div className="receivable-admin-template-card"><div><strong>默认模板</strong><Switch checked={defaultTemplateEnabled} onChange={setDefaultTemplateEnabled} /></div><span className="receivable-admin-template-preview">回款单</span><span className="receivable-admin-muted">系统默认打印模板</span></div>
      {templates.map((template) => <div className="receivable-admin-template-card" key={template.key}>
        <div><strong title={template.name}>{template.name}</strong><Switch checked={template.enabled} onChange={(enabled) => setTemplates((current) => current.map((item) => item.key === template.key ? { ...item, enabled } : item))} /></div>
        <span className="receivable-admin-template-preview">DOCX</span><span className="receivable-admin-muted">自定义打印模板</span>
      </div>)}
    </div>
  </>;

  const settingsPage = <div className="receivable-admin-settings-page">
    <div className="receivable-admin-setting-row">
      <strong>回款计划期次分摊</strong>
      <div className="receivable-admin-setting-action">
        <Switch checked={periodAllocationEnabled} aria-label="回款计划期次分摊" onChange={(enabled) => {
          onPeriodAllocationChange(enabled);
          messages.success(enabled ? '回款计划期次分摊已启用' : '回款计划期次分摊已停用');
        }} />
        <span>{periodAllocationEnabled ? '已启用期次分摊，本次回款金额将分摊到所选回款计划期次中' : '已关闭期次分摊，本次回款金额将不再分摊到所选回款计划期次中'}</span>
      </div>
    </div>
  </div>;

  return <div className="receivables-admin-workspace">
    {messageContext}
    <div className="receivable-admin-heading"><div><h1>回款设置</h1><p>配置回款类型、字段、审批流程、打印模板与期次分摊。</p></div><span>管理后台 · 销售 · 回款</span></div>
    <div className="receivable-admin-surface crm-surface">
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="receivable-admin-tabs" items={[
        { key: 'type', label: '回款类型', children: typePage },
        { key: 'fields', label: '回款字段', children: fieldPage },
        { key: 'approval', label: '审批流程', children: flowPage },
        { key: 'print', label: '打印模板', children: printPage },
        { key: 'settings', label: '回款设置', children: settingsPage },
      ]} />
    </div>

    <Modal open={Boolean(fieldEditing)} title={fieldEditing?.key.startsWith('new-') ? '新增字段' : '编辑字段'} centered width={520} onCancel={() => setFieldEditing(undefined)} onOk={saveField} okText="保存" cancelText="取消">
      {fieldEditing && <div className="receivable-admin-field-form">
        <label>字段名称 <b>*</b></label><Input value={fieldEditing.name} onChange={(event) => setFieldEditing({ ...fieldEditing, name: event.target.value })} placeholder="请输入字段名称" />
        <label>字段类型</label><Select value={fieldEditing.type} options={fieldTypes.map((value) => ({ value, label: value }))} onChange={(type) => setFieldEditing({ ...fieldEditing, type })} />
        <label>是否必填</label><Switch checked={fieldEditing.required} onChange={(required) => setFieldEditing({ ...fieldEditing, required })} />
      </div>}
    </Modal>

    <Modal open={templateOpen} title="新增打印模板" centered width={600} onCancel={() => setTemplateOpen(false)} onOk={() => {
      if (!templateFile) { messages.error('请上传 Word 模板'); return; }
      setTemplates((current) => [...current, { key: `template-${Date.now()}`, name: templateFile.name.replace(/\.docx$/i, ''), enabled: true }]);
      setTemplateOpen(false);
      messages.success('打印模板已添加');
    }} okText="确定" cancelText="取消">
      <div className="receivable-admin-template-guide">
        <strong>1、制作 Word 模板</strong>
        <p>在你电脑本地制作需要打印的 Word 模板内容和样式。需要打印系统数据时，将字段代码复制到模板对应位置。</p>
        <Space split={<span className="receivable-admin-muted">|</span>}><Button type="link" size="small" onClick={() => setTemplateHelp('example')}>查看示例图</Button><Button type="link" size="small" onClick={() => setTemplateHelp('fields')}>查看表单字段代码</Button></Space>
        <strong>2、上传 Word 模板</strong>
        <Upload.Dragger accept=".docx" maxCount={1} fileList={templateFile ? [templateFile] : []} beforeUpload={(file) => {
          if (!file.name.toLowerCase().endsWith('.docx') || file.size > 1024 * 1024) {
            messages.error('仅支持上传不超过 1MB 的 docx 文件');
            return Upload.LIST_IGNORE;
          }
          setTemplateFile(file as UploadFile);
          return false;
        }} onRemove={() => { setTemplateFile(undefined); return true; }}>
          <p className="ant-upload-drag-icon"><UploadOutlined /></p><p className="ant-upload-text">点击或将文件拖拽到这里上传</p><p className="ant-upload-hint">仅支持 docx 格式，大小不超过 1M</p>
        </Upload.Dragger>
      </div>
    </Modal>

    <Modal open={Boolean(templateHelp)} title={templateHelp === 'fields' ? '回款表单字段代码' : '打印模板示例'} centered width={640} footer={<Button type="primary" onClick={() => setTemplateHelp(undefined)}>关闭</Button>} onCancel={() => setTemplateHelp(undefined)}>
      {templateHelp === 'fields' ? <Table size="small" pagination={false} rowKey="field" dataSource={flowFormFields.map((field) => ({ field, code: `{{${field}}}` }))} columns={[{ title: '字段名称', dataIndex: 'field' }, { title: '字段代码', dataIndex: 'code' }]} /> : <div className="receivable-admin-template-example"><strong>回款单</strong><span>回款编号：{'{{paymentNo}}'}</span><span>关联客户：{'{{customer}}'}</span><span>回款金额：{'{{amount}}'}</span><span>回款日期：{'{{date}}'}</span></div>}
    </Modal>
  </div>;
}

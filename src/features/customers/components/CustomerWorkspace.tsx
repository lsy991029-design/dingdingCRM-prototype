import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Alert,
  ConfigProvider,
  Descriptions,
  Dropdown,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
  type TableColumnsType,
  type ThemeConfig,
} from 'antd';
import { AddIcon, CreateCustomerIcon, MapIcon } from '../../../shared/icons';
import { CommunicationEntryPanel } from '../../communication/CommunicationWorkspace';
import { loadAMap, type AMapPoint, type AMapMapInstance } from '../../field-trajectory/amap';
import customerMapMarkerUrl from '../../../assets/customer-map-marker.svg';
import guideIconUrl from '../../../assets/指南.svg';
import {
  customerFixtures,
  customerTypeOptions,
  draftFixtures,
  filterCustomers,
  followUpTypes,
  groupOptions,
  ownerOptions,
  sourceOptions,
  stageOptions,
  toFormValues,
  validateCustomer,
  type Customer,
  type CustomerFilters,
  type CustomerFormValues,
  type Draft,
  type FollowUpType,
} from '../model';

type FormTarget = { kind: 'create' } | { kind: 'customer'; customer: Customer } | { kind: 'draft'; customer: Draft };
type ColumnKey = 'name' | 'stage' | 'owner' | 'collaborators' | 'dueAt' | 'tags' | 'followUps' | 'updatedAt' | 'latest' | 'orders' | 'contracts';
type CustomerMapState = 'config' | 'loading' | 'ready' | 'error';
type ExportScope = 'form' | 'relatedDisplay' | 'relatedForm' | 'formImages' | 'approvalAttachments';

const exportScopeLabels: Record<ExportScope, string> = {
  form: '表单数据', relatedDisplay: '表单关联显示字段', formImages: '表单附件图片', approvalAttachments: '审批图片/附件', relatedForm: '关联表单',
};

const exportFieldGroups = [
  { key: 'system', label: '系统字段', fields: [{ key: 'id', label: '数据 ID', locked: true }, { key: 'name', label: '客户名称' }, { key: 'stage', label: '跟进阶段' }, { key: 'owner', label: '负责人' }, { key: 'createdAt', label: '创建时间' }] },
  { key: 'basic', label: '基础信息', fields: [{ key: 'type', label: '客户类型' }, { key: 'industry', label: '所属行业' }, { key: 'address', label: '客户地址' }, { key: 'source', label: '客户来源' }] },
  { key: 'custom', label: '自定义字段', fields: [{ key: 'singleLine', label: '单行输入框' }, { key: 'singleSelect', label: '单选框' }, { key: 'attachment', label: '附件字段' }] },
];
const allExportFields = exportFieldGroups.flatMap((group) => group.fields);
const exportTableFields = [{ key: 'table1.relatedForm1', label: '关联表单1' }];
const allSelectableExportFields = [...allExportFields, ...exportTableFields];

const customerMapPoints: AMapPoint[] = [
  [116.3975, 39.9087], [116.4074, 39.9042], [116.3867, 39.9139], [116.4181, 39.9148], [116.3743, 39.9201],
];

function getCustomerMapPoint(customerId: number): AMapPoint {
  return customerMapPoints[Math.abs(customerId) % customerMapPoints.length];
}

const defaultColumns: ColumnKey[] = [
  'name', 'stage', 'owner', 'collaborators', 'dueAt', 'tags', 'followUps', 'updatedAt', 'latest', 'orders', 'contracts',
];

const stageColor: Record<Customer['stage'], string> = {
  新获取: 'blue', 待跟进: 'purple', 商机: 'cyan', 报价: 'gold', 成交: 'green',
};

const customerDetailTheme: ThemeConfig = {
  token: {
    colorPrimary: '#007FFF',
    colorInfo: '#007FFF',
    colorText: '#171A1D',
    colorTextSecondary: 'rgba(23, 26, 29, 0.6)',
    colorBorder: '#D9D9D9',
    colorBgLayout: '#EDF0F4',
    colorBgContainer: '#FFFFFF',
    controlHeight: 32,
    fontFamily: '-apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  },
  components: {
    Button: {
      defaultBorderColor: '#D9D9D9',
      defaultColor: 'rgba(0, 0, 0, 0.88)',
      primaryColor: '#FFFFFF',
      primaryShadow: 'none',
    },
    Tabs: {
      inkBarColor: '#007FFF',
      itemColor: 'rgba(23, 26, 29, 0.6)',
      itemHoverColor: '#007FFF',
      itemActiveColor: '#007FFF',
      itemSelectedColor: '#007FFF',
      titleFontSize: 16,
      horizontalItemGutter: 28,
    },
    Descriptions: {
      labelBg: '#f7f8fc',
      labelColor: '#171a1d',
      contentColor: '#333333',
    },
    Input: { activeBorderColor: '#007FFF', hoverBorderColor: '#80BFFF' },
    Select: { activeBorderColor: '#007FFF', hoverBorderColor: '#80BFFF' },
  },
};

const detailDescriptionStyles = {
  label: {
    width: 86,
    padding: 16,
    fontWeight: 400,
    lineHeight: '22px',
    textAlign: 'left' as const,
    verticalAlign: 'middle' as const,
    wordBreak: 'break-all' as const,
    background: '#f7f8fc',
    borderRight: '1px solid #e4edfc',
    borderBottom: '1px solid var(--sales-color-2)',
    fontSize: 14,
    color: '#171a1d',
    boxSizing: 'content-box' as const,
  },
  content: {
    width: 204,
    padding: 16,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: '22px',
    color: '#171a1d',
    boxSizing: 'border-box' as const,
    borderRight: '1px solid #e4edfc',
    borderBottom: '1px solid var(--sales-color-2)',
  },
};

function recordFromValues(id: number, values: CustomerFormValues, current?: Customer): Customer {
  return {
    id,
    ...values,
    dueAt: current?.dueAt ?? null,
    followUps: current?.followUps ?? [],
    updatedAt: '刚刚',
    orders: current?.orders ?? 0,
    contracts: current?.contracts ?? 0,
  };
}

export function CustomerWorkspace() {
  const [customers, setCustomers] = useState<Customer[]>(customerFixtures);
  const [drafts, setDrafts] = useState<Draft[]>(draftFixtures);
  const [filters, setFilters] = useState<CustomerFilters>({ group: '全部', keyword: '' });
  const [draftKeyword, setDraftKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'drafts'>('list');
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'列表' | '地图'>('列表');
  const [density, setDensity] = useState<'标准' | '密集'>('标准');
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(defaultColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnDraft, setColumnDraft] = useState<ColumnKey[]>(defaultColumns);
  const [selected, setSelected] = useState<Customer>();
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [formTarget, setFormTarget] = useState<FormTarget>();
  const [guideOpen, setGuideOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [defaultExportOpen, setDefaultExportOpen] = useState(false);
  const [defaultExportImages, setDefaultExportImages] = useState(false);
  const [exportTarget, setExportTarget] = useState<'selected' | 'filtered'>('filtered');
  const [exportRecordCount, setExportRecordCount] = useState(0);

  const filteredCustomers = useMemo(() => filterCustomers(customers, filters), [customers, filters]);
  const filteredDrafts = useMemo(
    () => drafts.filter((draft) => `${draft.name}${draft.owner}${draft.notes}`.toLowerCase().includes(draftKeyword.toLowerCase())),
    [draftKeyword, drafts],
  );

  const openCreate = () => setFormTarget({ kind: 'create' });
  const openDetail = useCallback((customer: Customer) => setSelected(customer), []);
  const openDraft = (customer: Draft) => setFormTarget({ kind: 'draft', customer });
  const openEdit = (customer: Customer) => setFormTarget({ kind: 'customer', customer });
  const getExportTarget = (target?: 'selected' | 'filtered') => {
    const hasSelection = selectedCustomerIds.length > 0;
    const currentTarget = target ?? (hasSelection ? 'selected' : 'filtered');
    setExportTarget(currentTarget);
    setExportRecordCount(currentTarget === 'selected' ? selectedCustomerIds.length : filteredCustomers.length);
    return currentTarget;
  };
  const openDefaultExport = (target?: 'selected' | 'filtered') => {
    getExportTarget(target);
    setDefaultExportImages(false);
    setDefaultExportOpen(true);
  };
  const openCustomExport = (target?: 'selected' | 'filtered') => {
    getExportTarget(target);
    setExportOpen(true);
  };
  const exportMenuItems = [
    { key: 'custom', label: <div className="export-menu-option"><strong>自定义导出...</strong><span>调整导出范围与字段</span></div> },
  ];
  const handleExportMenuClick = ({ key }: { key: string }) => {
    if (key === 'custom') openCustomExport();
  };

  const saveCustomer = (values: CustomerFormValues, target: FormTarget) => {
    const editingId = target.kind === 'customer' ? target.customer.id : undefined;
    const error = validateCustomer(values, customers, editingId);
    if (error) return error;
    if (target.kind === 'customer') {
      const updated = recordFromValues(target.customer.id, values, target.customer);
      setCustomers((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setSelected(updated);
      message.success('客户信息已保存');
      return undefined;
    }
    const created = recordFromValues(Date.now(), values);
    setCustomers((items) => [created, ...items]);
    if (target.kind === 'draft') setDrafts((items) => items.filter((item) => item.id !== target.customer.id));
    setSelected(created);
    message.success('客户已创建');
    return undefined;
  };

  const saveDraft = (values: CustomerFormValues, target: FormTarget) => {
    if (target.kind === 'draft') {
      setDrafts((items) => items.map((item) => ({ ...recordFromValues(item.id, values, item), isDraft: true as const })));
      message.success('草稿已更新');
      return;
    }
    if (drafts.length >= 50) { message.warning('草稿箱已达 50 条上限'); return; }
    setDrafts((items) => [{ ...recordFromValues(Date.now(), values), isDraft: true as const }, ...items]);
    message.success('草稿已保存，仅自己可见');
  };

  const submitDraft = (draft: Draft) => {
    const error = validateCustomer(toFormValues(draft), customers);
    if (error) { openDraft(draft); return; }
    const created = recordFromValues(draft.id, toFormValues(draft), draft);
    setCustomers((items) => [created, ...items]);
    setDrafts((items) => items.filter((item) => item.id !== draft.id));
    setSelected(created);
    message.success('草稿已提交');
  };

  const addFollowUp = (type: FollowUpType, content: string) => {
    if (!selected) return;
    const updated = {
      ...selected,
      updatedAt: '刚刚',
      followUps: [{ id: Date.now(), type, content, createdAt: '刚刚', author: selected.owner }, ...selected.followUps],
    };
    setCustomers((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    setSelected(updated);
    message.success('跟进记录已保存');
  };

  return (
    <div className="customer-workspace">
      <section className="crm-surface customer-tabs-bar">
        <div className="entity-label">企业客户 <span className="entity-chevron">⌄</span></div>
        {activeTab === 'list' && <div className="customer-groups-inline">
          {groupOptions.slice(0, 6).map((group) => (
            <Button key={group} className={`customer-group-button${filters.group === group ? ' is-active' : ''}`} type="text" onClick={() => setFilters((value) => ({ ...value, group }))}>{group}</Button>
          ))}
          <Select className="more-group-select" variant="borderless" value={groupOptions.slice(6).includes(filters.group) ? filters.group : undefined} placeholder="更多分组" options={[...groupOptions.slice(6).map((group) => ({ value: group, label: group })), { value: '__drafts__', label: `草稿箱 (${drafts.length})` }]} onChange={(value) => { if ((value as string) === '__drafts__') { setActiveTab('drafts'); return; } setFilters((current) => ({ ...current, group: value })); }} />
        </div>}
        {activeTab === 'drafts' && <Button className="customer-back-button" type="text" onClick={() => setActiveTab('list')}>客户列表</Button>}
        <div className="toolbar-spacer" />
        {activeTab === 'list' ? (
          <Input className="customer-keyword-input" allowClear placeholder="请输入关键字搜索" value={filters.keyword} onChange={(event) => setFilters((value) => ({ ...value, keyword: event.target.value }))} />
        ) : (
          <Input className="customer-keyword-input" allowClear placeholder="搜索草稿" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
        )}
        {activeTab === 'list' && <><Button className="filter-action" onClick={() => message.info('筛选设置仅作原型演示')}>筛选设置</Button><Button className="filter-action" onClick={() => message.info('高级筛选仅作原型演示')}>高级筛选</Button><Button className="filter-action" onClick={() => setFiltersCollapsed((value) => !value)}>{filtersCollapsed ? '展开' : '收起'} <span className="filter-chevron">⌃</span></Button></>}
      </section>

      {activeTab === 'list' ? (
        <>
          {!filtersCollapsed && <section className="crm-surface customer-filters">
            <Form layout="vertical">
              <Form.Item label="客户名称"><Input placeholder="请输入" value={filters.keyword} onChange={(event) => setFilters((value) => ({ ...value, keyword: event.target.value }))} /></Form.Item>
              <Form.Item label="跟进阶段"><Select allowClear placeholder="请选择" value={filters.stage} options={stageOptions.map((value) => ({ value }))} onChange={(stage) => setFilters((value) => ({ ...value, stage }))} /></Form.Item>
              <Form.Item label="负责人"><Select allowClear placeholder="请选择" value={filters.owner} options={ownerOptions.map((value) => ({ value }))} onChange={(owner) => setFilters((value) => ({ ...value, owner }))} /></Form.Item>
            </Form>
          </section>}
          <section className="crm-surface customer-list-card">
            <div className="list-heading"><span>共 <b>{filteredCustomers.length}</b> 条数据</span></div>
            <div className="list-actions"><Button type="primary" icon={<CreateCustomerIcon size={18} />} onClick={openCreate}>新建客户</Button><div className="export-split-button"><Button className="export-main-button" aria-label="导出" onClick={() => openDefaultExport()} disabled={!filteredCustomers.length}>导出</Button><Dropdown placement="bottomRight" trigger={['click']} styles={{ root: { width: 'max-content', maxWidth: 'calc(100vw - 32px)' }, item: { paddingInline: 20 } }} menu={{ items: exportMenuItems, onClick: handleExportMenuClick, style: { width: 'max-content', minWidth: 0 } }} disabled={!filteredCustomers.length}><Button className="export-split-trigger" aria-label="导出选项" disabled={!filteredCustomers.length}><span aria-hidden="true">⌄</span></Button></Dropdown></div><Button onClick={() => message.info('导入功能仅作原型演示')}>导入</Button><div className="toolbar-spacer" /><Segmented value={viewMode} options={[{ label: '列表', value: '列表' }, { label: '地图', value: '地图', icon: <MapIcon size={16} /> }]} onChange={(value) => setViewMode(value as '列表' | '地图')} /><Segmented value={density} options={['标准', '密集']} onChange={(value) => setDensity(value as '标准' | '密集')} /><Button onClick={() => { setColumnDraft(visibleColumns); setColumnModalOpen(true); }}>自定义列</Button></div>
            {viewMode === '列表' ? <CustomerTable customers={filteredCustomers} density={density} visibleColumns={visibleColumns} selectedRowKeys={selectedCustomerIds} onSelectionChange={setSelectedCustomerIds} onOpen={openDetail} onFollowUp={openDetail} /> : <CustomerMapView customers={filteredCustomers} onOpen={openDetail} />}
          </section>
        </>
      ) : (
        <section className="crm-surface customer-list-card"><div className="list-heading"><span>我的草稿 <b>{drafts.length}</b> / 50 条</span><div className="toolbar-spacer" /><Button type="primary" icon={<AddIcon size={18} />} onClick={openCreate}>新建客户</Button></div><DraftTable drafts={filteredDrafts} onEdit={openDraft} onSubmit={submitDraft} onDelete={(draft) => setDrafts((items) => items.filter((item) => item.id !== draft.id))} /></section>
      )}

      <ColumnSettingsModal open={columnModalOpen} values={columnDraft} onChange={setColumnDraft} onClose={() => setColumnModalOpen(false)} onConfirm={() => { setVisibleColumns(columnDraft); setColumnModalOpen(false); message.success('列配置已保存'); }} />
      <DefaultExportConfirmModal open={defaultExportOpen} target={exportTarget} count={exportRecordCount} includeImages={defaultExportImages} onIncludeImagesChange={setDefaultExportImages} onClose={() => setDefaultExportOpen(false)} onConfirm={() => { setDefaultExportOpen(false); message.success(defaultExportImages ? '已创建包含图片的默认导出任务' : '已创建默认导出任务'); }} />
      <ExportDataModal open={exportOpen} target={exportTarget} selectedCount={exportRecordCount} filteredCount={exportRecordCount} onClose={() => setExportOpen(false)} />
      <CustomerFormDrawer target={formTarget} onClose={() => setFormTarget(undefined)} onSaveCustomer={saveCustomer} onSaveDraft={saveDraft} onSaved={() => setFormTarget(undefined)} />
      <CustomerDetailDrawer customer={selected} onClose={() => setSelected(undefined)} onEdit={openEdit} onFollowUp={addFollowUp} />
      {activeTab === 'list' && <Tooltip title="打开客户列表指南" placement="left"><button className="customer-list-guide" type="button" aria-label="打开客户列表指南" onClick={() => setGuideOpen(true)}><img src={guideIconUrl} alt="" aria-hidden="true" /><span>指南</span></button></Tooltip>}
      <CustomerListGuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function CustomerListGuideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Drawer className="customer-list-guide-drawer" title="客户列表指南" placement="right" size={380} open={open} onClose={onClose} destroyOnClose>
    <div className="guide-drawer-intro">快速了解客户列表中的查询、视图和列配置能力。</div>
    <div className="guide-drawer-section">
      <h3>查询客户</h3>
      <p>使用顶部关键词搜索，或展开筛选条件按客户名称、跟进阶段和负责人缩小结果范围。</p>
    </div>
    <div className="guide-drawer-section">
      <h3>切换客户分组</h3>
      <p>通过“全部、今日新增、我负责的”等快捷分组，快速查看常用客户范围。</p>
    </div>
    <div className="guide-drawer-section">
      <h3>切换展示方式</h3>
      <p>列表视图适合逐条查看客户信息，地图视图适合按客户位置浏览。</p>
    </div>
    <div className="guide-drawer-section">
      <h3>调整列表信息</h3>
      <p>使用“标准/密集”调整信息密度，通过“自定义列”选择需要展示的字段。</p>
    </div>
    <div className="guide-drawer-section">
      <h3>处理客户</h3>
      <p>点击客户名称或“查看”打开客户详情；需要记录进展时使用“写跟进”。</p>
    </div>
  </Drawer>;
}

function CustomerMapView({ customers, onOpen }: { customers: Customer[]; onOpen: (customer: Customer) => void }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapMapInstance | undefined>(undefined);
  const [mapState, setMapState] = useState<CustomerMapState>('loading');
  const [mapError, setMapError] = useState('');
  const amapKey = import.meta.env.VITE_AMAP_KEY?.trim();
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE?.trim();

  useEffect(() => {
    let cancelled = false;
    if (!amapKey) {
      setMapState('config');
      return;
    }
    setMapState('loading');
    loadAMap(amapKey, securityJsCode)
      .then((AMap) => {
        if (cancelled || !mapContainerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new AMap.Map(mapContainerRef.current, {
            zoom: 11,
            center: customerMapPoints[0],
            resizeEnable: true,
          });
        }
        const map = mapRef.current;
        map.clearMap();
        const markers = customers.map((customer) => {
          const marker = new AMap.Marker({
            position: getCustomerMapPoint(customer.id),
            title: `${customer.name}（演示位置）`,
            content: `<img src="${customerMapMarkerUrl}" alt="" width="32" height="40" style="display:block;transform:translate(-16px,-38px)" />`,
          });
          marker.on('click', () => onOpen(customer));
          return marker;
        });
        if (markers.length) {
          map.add(markers);
          map.setFitView(markers, false, [70, 70, 70, 70]);
        } else {
          map.setCenter(customerMapPoints[0]);
        }
        setMapState('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMapState('error');
        setMapError(error instanceof Error ? error.message : '高德地图加载失败');
      });
    return () => { cancelled = true; };
  }, [amapKey, customers, onOpen, securityJsCode]);

  useEffect(() => () => mapRef.current?.destroy(), []);

  return <div className="customer-map-view">
    <div ref={mapContainerRef} className="customer-amap-container" aria-label="客户分布地图" />
    <div className="customer-map-heading"><strong>客户分布</strong><span>{customers.length} 位客户</span></div>
    {mapState !== 'ready' && <div className="customer-map-state">
      {mapState === 'loading' && <><span className="customer-map-spinner" aria-hidden="true" /> <span>正在加载高德地图</span></>}
      {mapState === 'config' && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未配置高德地图 Key"><span>配置 VITE_AMAP_KEY 后将显示客户点位。</span></Empty>}
      {mapState === 'error' && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="高德地图加载失败"><span>{mapError}</span></Empty>}
    </div>}
    {mapState === 'ready' && !customers.length && <div className="customer-map-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前筛选条件下暂无客户" /></div>}
    {mapState === 'ready' && customers.length > 0 && <div className="customer-map-legend"><span className="customer-map-legend-dot" />客户点位 <span>点位为原型演示位置</span></div>}
  </div>;
}

function DefaultExportConfirmModal({ open, target, count, includeImages, onIncludeImagesChange, onClose, onConfirm }: { open: boolean; target: 'selected' | 'filtered'; count: number; includeImages: boolean; onIncludeImagesChange: (checked: boolean) => void; onClose: () => void; onConfirm: () => void }) {
  const description = target === 'selected'
    ? `确定要导出已选中的 ${count} 条企业客户数据吗？`
    : `确定要导出当前范围内的 ${count} 条企业客户数据吗？`;
  return <Modal className="default-export-modal" width={520} title="导出企业客户" open={open} onCancel={onClose} footer={<><Button onClick={onClose}>取消</Button><Button type="primary" disabled={!count} onClick={onConfirm}>确认导出</Button></>}>
    <div className="default-export-confirm-content">
      <p className="default-export-question">{description}</p>
      <p className="default-export-note">每 10,000 条数据将会生成一个 Excel 文档</p>
      <Checkbox checked={includeImages} onChange={(event) => onIncludeImagesChange(event.target.checked)}>同时导出数据中的图片（图片导出耗时较长，请耐心等待）</Checkbox>
    </div>
  </Modal>;
}

function ExportDataModal({ open, target, selectedCount, filteredCount, onClose }: { open: boolean; target: 'selected' | 'filtered'; selectedCount: number; filteredCount: number; onClose: () => void }) {
  const [scopes, setScopes] = useState<ExportScope[]>(['form']);
  const [fields, setFields] = useState<string[]>(allSelectableExportFields.map((field) => field.key));
  const [fieldSearch, setFieldSearch] = useState('');
  const [relatedFormTypes, setRelatedFormTypes] = useState<string[]>(['联系人']);
  const [tableExpanded, setTableExpanded] = useState(true);
  const [fieldModuleExpanded, setFieldModuleExpanded] = useState(true);
  const [phase, setPhase] = useState<'editing' | 'processing' | 'success' | 'failed'>('editing');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(12);
  const count = target === 'selected' ? selectedCount : filteredCount;

  useEffect(() => {
    if (open) { setPhase('editing'); setError(''); setProgress(12); setScopes(['form']); setFields(allSelectableExportFields.map((field) => field.key)); setFieldSearch(''); setRelatedFormTypes(['联系人']); setTableExpanded(true); setFieldModuleExpanded(true); }
  }, [open, target]);
  useEffect(() => {
    if (phase !== 'processing') return undefined;
    const timer = window.setInterval(() => setProgress((value) => Math.min(92, value + 16)), 260);
    return () => window.clearInterval(timer);
  }, [phase]);

  const tableFieldMatches = !fieldSearch || '表格1'.includes(fieldSearch) || exportTableFields.some((field) => field.label.includes(fieldSearch));
  const allSelected = allSelectableExportFields.every((field) => fields.includes(field.key));
  const toggleField = (key: string, checked: boolean) => setFields((current) => checked ? [...new Set([...current, key])] : current.filter((item) => item !== key));
  const toggleScope = (scope: ExportScope, checked: boolean) => setScopes((current) => checked ? [...new Set([...current, scope])] : current.filter((item) => item !== scope));
  const toggleTableFields = (checked: boolean) => setFields((current) => checked ? [...new Set([...current, ...exportTableFields.map((field) => field.key)])] : current.filter((key) => !exportTableFields.some((field) => field.key === key)));
  const submit = () => {
    if (!count) { setError('当前范围没有可导出的客户，请调整筛选条件或返回列表勾选客户。'); return; }
    if (!fields.length) { setError('请至少选择一项表单字段。'); return; }
    setError('');
    setPhase('processing');
    window.setTimeout(() => { setProgress(100); setPhase('success'); }, 1850);
  };
  const download = () => {
    const orderedFields = allSelectableExportFields.filter((field) => fields.includes(field.key));
    const payload = `CRM 导出任务演示\n导出对象：${target === 'selected' ? '已选客户' : '当前筛选结果'}\n客户数量：${count}\n表单字段：${orderedFields.map((field) => field.label).join('、')}\n导出范围：${scopes.map((scope) => exportScopeLabels[scope]).join('、')}\n关联表单类型：${relatedFormTypes.join('、')}`;
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/zip' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `客户导出_${new Date().toISOString().slice(0, 10)}.zip`; anchor.click(); URL.revokeObjectURL(url); message.success('ZIP 文件已开始下载');
  };
  const footer = phase === 'editing' ? <><Button onClick={onClose}>取消</Button><Button type="primary" onClick={submit}>确认导出</Button></> : <>{phase === 'processing' && <Button onClick={onClose}>关闭</Button>}{phase === 'success' && <Button type="primary" onClick={download}>下载 ZIP</Button>}</>;
  return <Modal className="export-data-modal" width={760} title="导出数据" open={open} onCancel={phase === 'processing' ? undefined : onClose} footer={footer} maskClosable={phase !== 'processing'}>
    {phase === 'processing' ? <div className="export-result-state"><Progress type="circle" percent={progress} size={82} strokeColor="#007FFF" /><h3>正在生成导出文件</h3><p>正在按权限整理 {count} 条客户数据，Excel 与图片将统一打包为 ZIP。</p><Button onClick={onClose}>关闭窗口，后台继续</Button></div> : phase === 'success' ? <div className="export-result-state export-success-state"><div className="export-success-icon">✓</div><h3>导出任务已完成</h3><p>已生成 1 个 ZIP 文件，包含 Excel 与已选择的附件内容。</p><Space><Tag color="green">已完成</Tag><span className="muted-text">任务编号 EXP-{String(Date.now()).slice(-6)}</span></Space></div> : <div className="export-form-body">
      <div className="export-confirm-intro"><p>{target === 'selected' ? `确定要导出已选中的 ${count} 条企业客户数据吗？` : '确定要导出当前范围内的 2000 条企业客户数据吗？'}</p><span>每 10,000 条数据将会生成一个 Excel 文档</span></div>
      {error && <Alert type="error" showIcon message={error} className="export-error-alert" />}
      <section className="export-section"><div className="export-section-heading"><h3>导出范围</h3></div><div className="export-scope-options" role="group" aria-label="导出范围选项">{(Object.keys(exportScopeLabels) as ExportScope[]).map((scope) => scope === 'relatedForm' ? <div className="export-scope-related-group" role="group" aria-label="关联表单范围" key={scope}><Checkbox className="export-scope-option" checked={scopes.includes(scope)} onChange={(event) => toggleScope(scope, event.target.checked)}>{exportScopeLabels[scope]}</Checkbox>{scopes.includes(scope) && <div className="export-related-form-picker"><span>关联表单类型</span><Checkbox.Group value={relatedFormTypes} onChange={(values) => setRelatedFormTypes(values as string[])} options={[{ label: '联系人', value: '联系人' }, { label: '回款', value: '回款' }, { label: '项目', value: '项目' }]} /></div>}</div> : <Checkbox className="export-scope-option" key={scope} checked={scopes.includes(scope)} disabled={scope === 'form'} onChange={(event) => toggleScope(scope, event.target.checked)}>{exportScopeLabels[scope]}</Checkbox>)}</div>
        {scopes.includes('relatedDisplay') && <Alert className="export-scope-alert" type="warning" showIcon message="选中表单关联显示，导出文档将无法用于导入更新" />}
      </section>
      <section className="export-section"><div className="export-section-heading"><h3>表单字段</h3></div><div className={`export-field-module${fieldModuleExpanded ? '' : ' is-collapsed'}`}><div className="export-field-module-toolbar"><button type="button" className="export-module-toggle" aria-label={fieldModuleExpanded ? '折叠表单字段' : '展开表单字段'} aria-expanded={fieldModuleExpanded} onClick={() => setFieldModuleExpanded((value) => !value)}><span className={`export-module-chevron${fieldModuleExpanded ? ' is-down' : ''}`} aria-hidden="true" /></button><Checkbox indeterminate={fields.length > 0 && !allSelected} checked={allSelected} onChange={(event) => setFields(event.target.checked ? allSelectableExportFields.map((field) => field.key) : ['id'])}>全部</Checkbox>{fieldModuleExpanded && <p className="export-field-description">勾选需要导出的字段</p>}<span>{fields.length}/{allSelectableExportFields.length} 项已选择</span></div>{fieldModuleExpanded && <div className="export-field-list" role="group" aria-label="可选导出字段">
        <div className="export-transfer-tools"><Input size="small" allowClear placeholder="搜索字段" value={fieldSearch} onChange={(event) => setFieldSearch(event.target.value)} /></div>
        <div className="export-transfer-list">
          {exportFieldGroups.map((group) => {
            const matchingFields = group.fields.filter((field) => !fieldSearch || field.label.includes(fieldSearch));
            if (!matchingFields.length) return null;
            return <div className="export-field-group" key={group.key}><div className="export-field-group-heading">{group.label}</div>{matchingFields.map((field) => <div className="export-transfer-option" key={field.key}><Checkbox checked={fields.includes(field.key)} disabled={field.locked} onChange={(event) => toggleField(field.key, event.target.checked)}>{field.label}</Checkbox>{field.locked && <Tag>必选</Tag>}</div>)}</div>;
          })}
          {tableFieldMatches && <div className="export-transfer-table"><div className="export-field-group-heading">表格字段</div><div className="export-transfer-option"><button type="button" className="export-tree-toggle" aria-label={tableExpanded ? '收起表格1字段' : '展开表格1字段'} onClick={() => setTableExpanded((value) => !value)}>{tableExpanded ? '⌄' : '›'}</button><Checkbox indeterminate={fields.some((key) => exportTableFields.some((field) => field.key === key)) && !exportTableFields.every((field) => fields.includes(field.key))} checked={exportTableFields.every((field) => fields.includes(field.key))} onChange={(event) => toggleTableFields(event.target.checked)}>表格1</Checkbox></div>{tableExpanded && exportTableFields.filter((field) => !fieldSearch || field.label.includes(fieldSearch) || '表格1'.includes(fieldSearch)).map((field) => <div className="export-transfer-option export-transfer-child" key={field.key}><Checkbox checked={fields.includes(field.key)} onChange={(event) => toggleField(field.key, event.target.checked)}>{field.label}</Checkbox></div>)}</div>}
          {!exportFieldGroups.some((group) => group.fields.some((field) => !fieldSearch || field.label.includes(fieldSearch))) && !tableFieldMatches && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的字段" />}
        </div>
      </div>}</div>
      </section>
    </div>}
  </Modal>;
}

function CustomerTable({ customers, density, visibleColumns, selectedRowKeys, onSelectionChange, onOpen, onFollowUp }: { customers: Customer[]; density: '标准' | '密集'; visibleColumns: ColumnKey[]; selectedRowKeys: number[]; onSelectionChange: (keys: number[]) => void; onOpen: (customer: Customer) => void; onFollowUp: (customer: Customer) => void }) {
  const definitions: Record<ColumnKey, TableColumnsType<Customer>[number]> = {
    name: { title: '客户名称', dataIndex: 'name', fixed: 'left', width: 250, render: (name, record) => <Button type="link" onClick={() => onOpen(record)}>{name}</Button> },
    stage: { title: '跟进阶段', dataIndex: 'stage', width: 110, render: (stage: Customer['stage']) => <Tag color={stageColor[stage]}>{stage}</Tag> },
    owner: { title: '负责人', dataIndex: 'owner', width: 100 },
    collaborators: { title: '协同人', dataIndex: 'collaborators', width: 110, render: (value: string[]) => value.join('、') || '-' },
    dueAt: { title: '掉保时间', dataIndex: 'dueAt', width: 120, render: (value: string | null) => value ?? '-' },
    tags: { title: '客户标签', dataIndex: 'tags', width: 130, render: (value: string[]) => value.length ? value.map((tag) => <Tag key={tag}>{tag}</Tag>) : '-' },
    followUps: { title: '跟进记录次数', width: 130, render: (_, record) => record.followUps.length },
    updatedAt: { title: '最近跟进时间', dataIndex: 'updatedAt', width: 140 },
    latest: { title: '最新跟进记录', width: 210, ellipsis: true, render: (_, record) => record.followUps[0]?.content ?? '待首次沟通' },
    orders: { title: '订单数', dataIndex: 'orders', width: 90 },
    contracts: { title: '合同数', dataIndex: 'contracts', width: 90 },
  };
  const columns: TableColumnsType<Customer> = [
    { title: '提醒', width: 70, render: () => <Tooltip title="跟进提醒"><span className="reminder-dot" /></Tooltip> },
    ...visibleColumns.map((key) => definitions[key]),
    { title: '操作', fixed: 'right', width: 155, render: (_, record) => <Space size={4}><Button type="link" aria-label={`查看${record.name}`} onClick={() => onOpen(record)}>查看</Button><Button type="link" aria-label={`写${record.name}跟进`} onClick={() => onFollowUp(record)}>写跟进</Button></Space> },
  ];
  return <Table className={density === '密集' ? 'compact-table' : undefined} rowKey="id" rowSelection={{ selectedRowKeys, onChange: (keys) => onSelectionChange(keys as number[]), preserveSelectedRowKeys: true }} columns={columns} dataSource={customers} scroll={{ x: 1500 }} pagination={{ pageSize: 10, showSizeChanger: false }} locale={{ emptyText: <Empty description="没有匹配的客户"><Button onClick={() => window.location.reload()}>重置筛选</Button></Empty> }} />;
}

function DraftTable({ drafts, onEdit, onSubmit, onDelete }: { drafts: Draft[]; onEdit: (draft: Draft) => void; onSubmit: (draft: Draft) => void; onDelete: (draft: Draft) => void }) {
  return <Table rowKey="id" dataSource={drafts} pagination={false} columns={[{ title: '客户名称', dataIndex: 'name', render: (name: string, draft) => <Button type="link" onClick={() => onEdit(draft)}>{name || '未填写'}</Button> }, { title: '跟进阶段', dataIndex: 'stage' }, { title: '负责人', dataIndex: 'owner', render: (owner: string) => owner || '未填写' }, { title: '更新时间', dataIndex: 'updatedAt' }, { title: '操作', render: (_, draft) => <Space><Button type="link" onClick={() => onEdit(draft)}>继续编辑</Button><Button type="link" onClick={() => onSubmit(draft)}>提交</Button><Popconfirm title="确认永久删除此草稿吗？" okText="删除" cancelText="取消" onConfirm={() => { onDelete(draft); message.success('草稿已删除，不可恢复'); }}><Button type="link" danger>删除</Button></Popconfirm></Space> }]} />;
}

function FormLabel({ text, required = false }: { text: string; required?: boolean }) {
  return <span className={required ? 'crm-form-label crm-form-label-required' : 'crm-form-label'}>{required && <span className="crm-form-required-mark">*</span>}{text}</span>;
}

function CustomerFormDrawer({ target, onClose, onSaveCustomer, onSaveDraft, onSaved }: { target?: FormTarget; onClose: () => void; onSaveCustomer: (values: CustomerFormValues, target: FormTarget) => { field: keyof CustomerFormValues; message: string } | undefined; onSaveDraft: (values: CustomerFormValues, target: FormTarget) => void; onSaved: () => void }) {
  const [form] = Form.useForm<CustomerFormValues>();
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (target) form.setFieldsValue(toFormValues(target.kind === 'create' ? undefined : target.customer)); }, [form, target]);
  const submit = async (continueCreating = false) => {
    if (!target) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      const error = onSaveCustomer(values, target);
      setSaving(false);
      if (error) { form.setFields([{ name: error.field, errors: [error.message] }]); return; }
      if (continueCreating) { form.resetFields(); message.success('已保存，继续创建下一位客户'); return; }
      onSaved();
    } catch { setSaving(false); }
  };
  return <Drawer className="customer-form-drawer" title={target?.kind === 'create' ? '新建企业客户' : target?.kind === 'draft' ? '编辑客户草稿' : '编辑企业客户'} open={Boolean(target)} onClose={onClose} size={window.innerWidth < 900 ? '100%' : 700} forceRender extra={<span className="drawer-mode-label">☰ 单列</span>} footer={<Space style={{ justifyContent: 'flex-end', width: '100%' }}><Button onClick={onClose}>取消</Button><Button onClick={() => { if (target) { onSaveDraft(form.getFieldsValue() as CustomerFormValues, target); onSaved(); } }}>暂存草稿</Button>{target?.kind === 'create' && <Button onClick={() => void submit(true)}>保存并继续创建</Button>}<Button type="primary" loading={saving} onClick={() => void submit()}>{target?.kind === 'customer' ? '提交修改' : '提交'}</Button></Space>}>
    <Form form={form} layout="vertical" requiredMark={false} colon={false}><div className="form-grid form-single-column"><Form.Item label={<FormLabel text="客户类型" required />} name="type" rules={[{ required: true, message: '请选择客户类型' }]}><Select options={customerTypeOptions.map((value) => ({ value }))} /></Form.Item><Form.Item label={<FormLabel text="客户名称" required />} name="name" rules={[{ required: true, whitespace: true, message: '请输入客户名称' }]}><Space.Compact block><Input placeholder="请输入" /><Button onClick={() => message.info('工商信息查询仅作原型演示')}>工商信息</Button></Space.Compact></Form.Item><Form.Item label={<FormLabel text="跟进阶段" required />} name="stage" rules={[{ required: true }]}><Select placeholder="跟进状态" options={stageOptions.map((value) => ({ value }))} /></Form.Item><Form.Item label={<FormLabel text="负责人" required />} name="owner" rules={[{ required: true, message: '请选择负责人' }]}><Select placeholder="请选择" options={ownerOptions.map((value) => ({ value }))} /></Form.Item><Form.Item label="协同人" name="collaborators"><Select mode="multiple" placeholder="请选择" options={ownerOptions.map((value) => ({ value }))} /></Form.Item><Form.Item label="客户标签" name="tags"><Select mode="tags" placeholder="编辑客户标签" /></Form.Item><Form.Item label="上级客户" name="parentCustomer"><Input placeholder="请选择" /></Form.Item><Form.Item label="客户来源" name="source"><Select placeholder="请选择" options={sourceOptions.map((value) => ({ value }))} /></Form.Item><Form.Item label="地址" name="address"><Input placeholder="请输入详细地址" /></Form.Item><Form.Item label="备注" name="notes"><Input.TextArea rows={4} placeholder="请输入" /></Form.Item></div></Form>
  </Drawer>;
}

function CustomerDetailDrawer({ customer, onClose, onEdit, onFollowUp }: { customer?: Customer; onClose: () => void; onEdit: (customer: Customer) => void; onFollowUp: (type: FollowUpType, content: string) => void }) {
  if (!customer) return null;
  return <CustomerDetailContent customer={customer} onClose={onClose} onEdit={onEdit} onFollowUp={onFollowUp} />;
}

function CustomerDetailContent({ customer, onClose, onEdit, onFollowUp }: { customer: Customer; onClose: () => void; onEdit: (customer: Customer) => void; onFollowUp: (type: FollowUpType, content: string) => void }) {
  const [form] = Form.useForm<{ type: FollowUpType; content: string }>();
  const [followMode, setFollowMode] = useState<'manual' | 'ai'>('manual');
  useEffect(() => { if (customer) form.resetFields(); }, [customer, form]);
  const detailItems = [
    { key: 'name', label: '客户名称', children: customer.name },
    { key: 'stage', label: '跟进阶段', children: <Tag color={stageColor[customer.stage]}>{customer.stage}</Tag> },
    { key: 'owner', label: '负责人', children: customer.owner },
    { key: 'collab', label: '协同人', children: customer.collaborators.join('、') || '-' },
    { key: 'dueAt', label: '掉保时间', children: customer.dueAt ?? '-' },
    { key: 'followUps', label: '跟进记录次数', children: customer.followUps.length },
    { key: 'updatedAt', label: '最近跟进时间', children: customer.updatedAt },
    { key: 'parent', label: '上级客户', children: customer.parentCustomer || '-' },
    { key: 'source', label: '客户来源', children: customer.source || '-' },
    { key: 'address', label: '地址', children: customer.address || '-' },
    { key: 'notes', label: '备注', children: customer.notes || '-', span: 2 },
  ];

  return <ConfigProvider theme={customerDetailTheme}><Drawer className="customer-detail-drawer" title={null} closable={false} open onClose={onClose} size={window.innerWidth < 900 ? '100%' : 1100} styles={{ body: { padding: '0 0 24px' } }}>
    <div className="customer-detail-layout">
      <div className="detail-main">
        <div className="detail-main-header"><h2>{customer.name}</h2><div className="toolbar-spacer" /><Button className="detail-edit-button" type="text" onClick={() => onEdit(customer)}>编辑客户</Button><Button className="detail-close-button" type="text" aria-label="关闭详情" onClick={onClose}>×</Button></div>
        <div className="detail-summary"><span>负责人：<b>{customer.owner}</b></span><span>协同人：<b>{customer.collaborators.join('、') || '-'}</b></span><span>掉保时间：<b>{customer.dueAt ?? '-'}</b></span><span>更新时间：<b>{customer.updatedAt}</b></span></div>
        <div className="stage-track">{stageOptions.map((stage) => <span key={stage} className={stageOptions.indexOf(stage) <= stageOptions.indexOf(customer.stage) ? 'stage-active' : ''}>{stage}</span>)}</div>
        <Tabs className="detail-primary-tabs" styles={{ header: { marginBottom: 0 }, item: { padding: '13px 24px' } }} items={[
          { key: 'info', label: '客户信息', children: <Tabs className="detail-subtabs" size="small" styles={{ header: { marginBottom: 16 }, item: { margin: '0 12px', padding: '12px 0' } }} items={[
            { key: 'basic-info', label: '基本信息', children: <><div className="detail-section-heading"><h3>基本信息</h3><Button className="detail-show-all-button" type="link">显示全部</Button></div><Descriptions bordered column={2} classNames={{ root: 'detail-descriptions' }} styles={detailDescriptionStyles} items={detailItems} /></> },
            { key: 'contacts', label: '客户联系人 (0)', children: <Empty description="暂无客户联系人" /> },
          ]} /> },
          { key: 'activity', label: `客户动态(${customer.followUps.length})`, children: <Empty description="动态将在跟进记录后展示" /> },
          { key: 'data', label: '企业大数据', children: <Empty description="企业大数据将在接入后展示" /> },
          { key: 'orders', label: `订单(${customer.orders})`, children: <Empty description="暂无订单" /> },
          { key: 'contracts', label: `合同(${customer.contracts})`, children: <Empty description="暂无合同" /> },
          { key: 'receivable', label: '回款', children: <Empty description="暂无回款记录" /> },
        ]} />
      </div>
      <aside className="follow-up-panel">
        <div className="follow-up-title"><div className="follow-mode-tabs"><Button type="text" className={followMode === 'manual' ? 'is-active' : ''} onClick={() => setFollowMode('manual')}>写跟进</Button><Button type="text" className={followMode === 'ai' ? 'is-active' : ''} onClick={() => setFollowMode('ai')}>AI 录入</Button></div></div>
        {followMode === 'manual' ? <Form className="follow-up-form" form={form} layout="vertical" onFinish={(values) => { onFollowUp(values.type, values.content); form.resetFields(); }}>
          <Form.Item name="type" rules={[{ required: true, message: '请选择跟进类型' }]}><Select placeholder="跟进类型" options={followUpTypes.map((value) => ({ value }))} /></Form.Item>
          <Form.Item name="content" rules={[{ required: true, whitespace: true, message: '请输入跟进记录' }]}><Input.TextArea className="follow-up-textarea" rows={6} placeholder="请输入跟进记录" /></Form.Item>
          <div className="follow-up-actions"><Button onClick={() => message.info('全部跟进记录将在正式版本展开')}>展开全部记录</Button><div className="toolbar-spacer" /><Button onClick={() => message.success('跟进内容已暂存')}>暂 存</Button><Button className="follow-up-submit-button" type="primary" htmlType="submit">提 交</Button></div>
        </Form> : <CommunicationEntryPanel customer={customer} onFollowUp={(type, content) => { onFollowUp(type, content); setFollowMode('manual'); }} />}
        <div className="follow-up-history-heading"><h3>跟进记录 ({customer.followUps.length})</h3><Button type="text" onClick={() => message.info('跟进记录筛选仅作原型演示')}>筛选</Button></div>
        {customer.followUps.length ? customer.followUps.map((item) => <div className="follow-item" key={item.id}><b>{item.createdAt} · {item.author}</b><span>{item.type}</span><p>{item.content}</p></div>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无跟进记录" />}
      </aside>
    </div>
  </Drawer></ConfigProvider>;
}

function ColumnSettingsModal({ open, values, onChange, onClose, onConfirm }: { open: boolean; values: ColumnKey[]; onChange: (values: ColumnKey[]) => void; onClose: () => void; onConfirm: () => void }) {
  const labels: Record<ColumnKey, string> = { name: '客户名称', stage: '跟进阶段', owner: '负责人', collaborators: '协同人', dueAt: '掉保时间', tags: '客户标签', followUps: '跟进记录次数', updatedAt: '最近跟进时间', latest: '最新跟进记录', orders: '订单数', contracts: '合同数' };
  return <Modal title="自定义列" open={open} onCancel={onClose} onOk={onConfirm} okText="保存配置" cancelText="取消"><Checkbox.Group className="column-choice" value={values} onChange={(next) => onChange(next as ColumnKey[])} options={defaultColumns.map((value) => ({ value, label: labels[value] }))} /></Modal>;
}

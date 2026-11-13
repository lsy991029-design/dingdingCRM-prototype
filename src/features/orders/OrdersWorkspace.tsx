import { useMemo, useState } from 'react';
import {
  Button, Card, Drawer, Empty, Input, InputNumber, Select, Space, Table, Tabs, Tag, Tooltip, Typography, message,
  type TableColumnsType,
} from 'antd';
import { CloseOutlined, DeleteOutlined, EditOutlined, HistoryOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

type DetailField = 'productCode' | 'category' | 'quantity' | 'unitPrice' | 'discountedUnitPrice' | 'shippedQuantity';
type EventKind = 'row_add' | 'row_delete' | 'cell_add' | 'cell_delete' | 'cell_update' | 'created';
type OrderRow = { key: string; productCode: string; category: string; quantity: number | null; unitPrice: number | null; discountedUnitPrice: number | null; shippedQuantity: number | null };
type OrderEvent = { id: string; kind: EventKind; at: string; actor: string; rowKey?: string; rowLabel?: string; field?: DetailField; oldValue?: string | number | null; newValue?: string | number | null; snapshot?: Partial<OrderRow> };

const fieldLabels: Record<DetailField, string> = { productCode: '产品编号', category: '产品分类', quantity: '数量', unitPrice: '单价', discountedUnitPrice: '产品折后单价', shippedQuantity: '已出库数量' };
const initialRows: OrderRow[] = [
  { key: 'line-1', productCode: '068', category: '水果', quantity: 100, unitPrice: 1000, discountedUnitPrice: 0, shippedQuantity: 0 },
  { key: 'line-2', productCode: '068', category: '水果', quantity: 100, unitPrice: 1000, discountedUnitPrice: 0, shippedQuantity: 0 },
  { key: 'line-3', productCode: '068', category: '水果', quantity: 100, unitPrice: 1000, discountedUnitPrice: 0, shippedQuantity: 0 },
];
const initialEvents: OrderEvent[] = [
  { id: 'created', kind: 'created', at: '2026-09-17 13:51', actor: '李佳楠' },
  { id: 'seed-1', kind: 'cell_update', at: '2026-09-17 13:52', actor: '李佳楠', rowKey: 'line-1', rowLabel: '明细 01 · 产品 068', field: 'quantity', oldValue: 100, newValue: 120 },
  { id: 'seed-2', kind: 'cell_update', at: '2026-09-17 13:51', actor: '李佳楠', rowKey: 'line-2', rowLabel: '明细 02 · 产品 068', field: 'unitPrice', oldValue: 1000, newValue: 980 },
];

const money = (value: string | number | null | undefined) => value === null || value === undefined || value === '' ? '—' : `¥ ${Number(value).toFixed(2)}`;
const displayValue = (field: DetailField | undefined, value: string | number | null | undefined) => value === null || value === undefined || value === '' ? '—' : field === 'unitPrice' || field === 'discountedUnitPrice' ? money(value) : String(value);
const classifyChange = (oldValue: string | number | null | undefined, newValue: string | number | null | undefined): EventKind => {
  const oldEmpty = oldValue === null || oldValue === undefined || oldValue === '';
  const newEmpty = newValue === null || newValue === undefined || newValue === '';
  if (oldEmpty && !newEmpty) return 'cell_add';
  if (!oldEmpty && newEmpty) return 'cell_delete';
  return 'cell_update';
};

export function OrdersWorkspace() {
  const orders = [{ key: 'order-1', orderNo: 'DDQQ202609170002', customer: '华东智能制造有限公司', total: 100000, owner: '李佳楠', updatedAt: '2026-09-17 13:52' }];
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('info');
  const [eventTab, setEventTab] = useState('all');
  const [rows, setRows] = useState<OrderRow[]>(initialRows);
  const [events, setEvents] = useState<OrderEvent[]>(initialEvents);

  const rowLabel = (rowKey: string) => {
    const index = rows.findIndex((row) => row.key === rowKey);
    const row = rows[index];
    return `明细 ${String(index + 1).padStart(2, '0')} · 产品 ${row?.productCode || '—'}`;
  };

  const commitCell = (rowKey: string, field: DetailField, nextValue: string | number | null) => {
    const row = rows.find((item) => item.key === rowKey);
    if (!row) return;
    const oldValue = row[field];
    if (String(oldValue ?? '') === String(nextValue ?? '')) return;
    const kind = classifyChange(oldValue, nextValue);
    setRows((items) => items.map((item) => item.key === rowKey ? { ...item, [field]: nextValue } : item));
    setEvents((items) => [{ id: `${Date.now()}-${rowKey}-${field}`, kind, at: dayjs().format('YYYY-MM-DD HH:mm'), actor: '当前用户', rowKey, rowLabel: rowLabel(rowKey), field, oldValue, newValue: nextValue }, ...items]);
    message.success(`${fieldLabels[field]}变更已记录`);
  };

  const addRow = () => {
    const key = `line-${Date.now()}`;
    const newRow: OrderRow = { key, productCode: '', category: '', quantity: null, unitPrice: null, discountedUnitPrice: null, shippedQuantity: 0 };
    setRows((items) => [...items, newRow]);
    setEvents((items) => [{ id: `add-${key}`, kind: 'row_add', at: dayjs().format('YYYY-MM-DD HH:mm'), actor: '当前用户', rowKey: key, rowLabel: `明细 ${String(rows.length + 1).padStart(2, '0')} · 新增明细`, snapshot: newRow }, ...items]);
    message.info('已新增一行产品明细');
  };

  const deleteRow = (rowKey: string) => {
    const row = rows.find((item) => item.key === rowKey);
    if (!row) return;
    setRows((items) => items.filter((item) => item.key !== rowKey));
    setEvents((items) => [{ id: `delete-${rowKey}-${Date.now()}`, kind: 'row_delete', at: dayjs().format('YYYY-MM-DD HH:mm'), actor: '当前用户', rowKey, rowLabel: rowLabel(rowKey), snapshot: row }, ...items]);
    message.info('已记录产品明细删除');
  };

  const eventList = useMemo(() => eventTab === 'all' ? events : eventTab === 'change' ? events.filter((item) => item.kind !== 'created') : events.filter((item) => item.kind === 'created'), [eventTab, events]);
  const productColumns: TableColumnsType<OrderRow> = [
    { title: '产品编号', dataIndex: 'productCode', width: 150, render: (_, row) => <Input size="small" defaultValue={row.productCode} placeholder="请输入" onBlur={(event) => commitCell(row.key, 'productCode', event.target.value)} onPressEnter={(event) => commitCell(row.key, 'productCode', event.currentTarget.value)} /> },
    { title: '产品分类', dataIndex: 'category', width: 150, render: (_, row) => <Select size="small" value={row.category || undefined} placeholder="请选择" options={[{ value: '水果', label: '水果' }, { value: '电子元件', label: '电子元件' }, { value: '办公用品', label: '办公用品' }]} onChange={(value) => commitCell(row.key, 'category', value)} /> },
    { title: '数量', dataIndex: 'quantity', width: 120, render: (_, row) => <InputNumber size="small" min={0} value={row.quantity ?? undefined} placeholder="—" onChange={(value) => commitCell(row.key, 'quantity', value)} /> },
    { title: '单价', dataIndex: 'unitPrice', width: 140, render: (_, row) => <InputNumber size="small" min={0} precision={2} value={row.unitPrice ?? undefined} placeholder="—" onChange={(value) => commitCell(row.key, 'unitPrice', value)} /> },
    { title: '产品小计', width: 150, render: (_, row) => money((row.quantity ?? 0) * (row.unitPrice ?? 0)) },
    { title: '产品折后单价', dataIndex: 'discountedUnitPrice', width: 150, render: (_, row) => <InputNumber size="small" min={0} precision={2} value={row.discountedUnitPrice ?? undefined} placeholder="—" onChange={(value) => commitCell(row.key, 'discountedUnitPrice', value)} /> },
    { title: '已出库数量', dataIndex: 'shippedQuantity', width: 120, render: (_, row) => <InputNumber size="small" min={0} value={row.shippedQuantity ?? undefined} placeholder="—" onChange={(value) => commitCell(row.key, 'shippedQuantity', value)} /> },
    { title: '操作', fixed: 'right', width: 64, render: (_, row) => <Tooltip title="删除明细"><Button type="text" danger icon={<DeleteOutlined />} aria-label={`删除${rowLabel(row.key)}`} onClick={() => deleteRow(row.key)} /></Tooltip> },
  ];
  const orderColumns: TableColumnsType<typeof orders[number]> = [
    { title: '订单编号', dataIndex: 'orderNo', render: (value) => <Button type="link" className="order-link" onClick={() => setDetailOpen(true)}>{value}</Button> },
    { title: '关联客户', dataIndex: 'customer' }, { title: '订单总额', dataIndex: 'total', render: (value) => money(value) }, { title: '负责人', dataIndex: 'owner' }, { title: '最近动态', dataIndex: 'updatedAt' },
    { title: '操作', width: 90, render: () => <Button type="link" onClick={() => setDetailOpen(true)}>查看详情</Button> },
  ];
  const readOnlyProductColumns: TableColumnsType<OrderRow> = [
    { title: '产品编号', dataIndex: 'productCode', width: 150 },
    { title: '产品分类', dataIndex: 'category', width: 150 },
    { title: '数量', dataIndex: 'quantity', width: 120 },
    { title: '单价', dataIndex: 'unitPrice', width: 140, render: (value) => money(value) },
    { title: '产品小计', width: 150, render: (_, row) => money((row.quantity ?? 0) * (row.unitPrice ?? 0)) },
    { title: '产品折后单价', dataIndex: 'discountedUnitPrice', width: 150, render: (value) => money(value) },
    { title: '已出库数量', dataIndex: 'shippedQuantity', width: 120 },
  ];
  const eventTitle = (event: OrderEvent) => event.kind === 'created' ? '新建订单' : event.kind === 'row_add' ? '新增产品明细' : event.kind === 'row_delete' ? '删除产品明细' : event.kind === 'cell_add' ? '新增产品明细字段' : event.kind === 'cell_delete' ? '删除产品明细字段' : '修改产品明细字段';
  const renderEvent = (event: OrderEvent) => <div className="order-event" key={event.id}><div className="order-event-marker"><HistoryOutlined /></div><div className="order-event-main"><div className="order-event-meta"><span>{event.at}</span><span>{event.actor}</span></div><div className="order-event-title">{eventTitle(event)}</div><div className="order-event-body">{event.kind === 'created' ? <span>订单已创建，产品明细初始快照已建立</span> : event.kind === 'row_add' || event.kind === 'row_delete' ? <><strong>{event.rowLabel}</strong><div className="order-event-sub">{event.kind === 'row_add' ? '已新增一行产品明细' : '已删除一行产品明细'}</div></> : <><strong>{event.rowLabel}</strong><div className="order-event-diff"><span>{fieldLabels[event.field!]}</span><span>{displayValue(event.field, event.oldValue)}</span><b>→</b><span>{displayValue(event.field, event.newValue)}</span></div></>}</div></div></div>;

  return <div className="orders-workspace">
    <div className="orders-heading"><div><Typography.Title level={3}>订单</Typography.Title><Typography.Text type="secondary">查看订单明细，并追踪产品表格的每一次字段变更。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />}>新建订单</Button></div>
    <Card className="orders-list-card" bordered={false}><div className="orders-list-toolbar"><Space><Typography.Text strong>全部订单</Typography.Text><Tag color="blue">1 条</Tag></Space><Input allowClear placeholder="搜索订单编号或客户" className="orders-search" /></div><Table rowKey="key" columns={orderColumns} dataSource={orders} pagination={false} scroll={{ x: 880 }} /></Card>
    <Drawer className="order-detail-drawer" width={minDrawerWidth()} open={detailOpen} onClose={() => setDetailOpen(false)} title={orders[0].orderNo} extra={<Space><Tooltip title="编辑订单"><Button type="text" icon={<EditOutlined />} aria-label="编辑订单" onClick={() => setEditOpen(true)} /></Tooltip><Tooltip title="关闭"><Button type="text" icon={<CloseOutlined />} aria-label="关闭订单详情" onClick={() => setDetailOpen(false)} /></Tooltip></Space>}>
      <div className="order-summary"><div><span>订单编号</span><strong>{orders[0].orderNo}</strong></div><div><span>订单总额</span><strong>{money(orders[0].total)}</strong></div><div><span>负责人</span><strong>{orders[0].owner}</strong></div></div>
      <Tabs activeKey={detailTab} onChange={setDetailTab} items={[{ key: 'info', label: '订单信息' }, { key: 'dynamic', label: '订单动态' }]} />
      {detailTab === 'info' ? <div className="order-info-view"><div className="order-section-heading"><div><Typography.Title level={5}>产品明细</Typography.Title><Typography.Text type="secondary">共 {rows.length} 条产品明细</Typography.Text></div><Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑订单</Button></div><Table rowKey="key" size="small" columns={readOnlyProductColumns} dataSource={rows} pagination={false} scroll={{ x: 780 }} /></div> : <div className="order-dynamic-view"><Tabs activeKey={eventTab} onChange={setEventTab} size="small" items={[{ key: 'all', label: '全部' }, { key: 'follow', label: '跟进记录' }, { key: 'change', label: '修改记录' }]} />{eventList.length ? <div className="order-timeline">{eventList.map(renderEvent)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={eventTab === 'follow' ? '暂无跟进记录' : '暂无修改记录'} />}</div>}
    </Drawer>
    <Drawer className="order-edit-drawer" width={minEditDrawerWidth()} open={editOpen} onClose={() => setEditOpen(false)} title="编辑订单" extra={<Space><Button onClick={() => setEditOpen(false)}>取消</Button><Button type="primary" icon={<SaveOutlined />} onClick={() => { setEditOpen(false); message.success('订单已保存，动态已同步'); }}>保存订单</Button></Space>}>
      <div className="edit-order-meta"><strong>{orders[0].orderNo}</strong><span>表格字段在完成一次输入后立即生成修改动态</span></div><div className="order-edit-section"><div className="order-section-heading"><div><Typography.Title level={5}>产品明细</Typography.Title><Typography.Text type="secondary">新增、删除或修改单元格后，返回订单动态查看记录。</Typography.Text></div><Button type="link" icon={<PlusOutlined />} onClick={addRow}>新增明细</Button></div><Table rowKey="key" size="small" columns={productColumns} dataSource={rows} pagination={false} scroll={{ x: 1050 }} /></div>
    </Drawer>
  </div>;
}

function minDrawerWidth() { return typeof window === 'undefined' ? 960 : Math.min(1100, Math.max(360, window.innerWidth - 24)); }
function minEditDrawerWidth() { return typeof window === 'undefined' ? 1180 : Math.min(1180, Math.max(360, window.innerWidth - 24)); }

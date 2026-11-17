import { useMemo, useState } from 'react';
import {
  Button, DatePicker, Drawer, Empty, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, Typography, message,
  type TableColumnsType,
} from 'antd';
import { BellOutlined, CheckOutlined, CloseOutlined, CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, FullscreenOutlined, LeftOutlined, LinkOutlined, PlusOutlined, PrinterOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './receivables.css';

type ReceiptStatus = '草稿' | '待审批' | '已通过' | '已驳回';
type Plan = { key: string; no: string; customer: string; contract: string; installments: { key: string; period: number; dueDate: string; planned: number }[] };
type SalesOrder = { key: string; no: string; customer: string; total: number; owner: string; creator: string };
type Allocation = { installmentKey: string; amount: number };
type DetailDraft = { rowKey: string; orderKey?: string; planKey?: string };
type Receipt = { key: string; no: string; customer: string; date: string; type: string; owner: string; status: ReceiptStatus; allocations: Allocation[]; orderKeys?: string[] };

const plansSeed: Plan[] = [
  { key: 'plan-a', no: '2026110900000001', customer: '北京搜狐互联网信息服务有限公司', contract: '电子产品销售合同', installments: [
    { key: 'plan-a-1', period: 1, dueDate: '2026-11-09', planned: 300 },
    { key: 'plan-a-2', period: 2, dueDate: '2026-12-09', planned: 500 },
  ] },
  { key: 'plan-b', no: '2026110500000002', customer: '北京搜狐互联网信息服务有限公司', contract: '年度技术服务合同', installments: [
    { key: 'plan-b-1', period: 1, dueDate: '2026-11-15', planned: 5000 },
    { key: 'plan-b-2', period: 2, dueDate: '2027-05-15', planned: 5000 },
  ] },
  { key: 'plan-c', no: '2026102800000003', customer: '百度（中国）有限公司', contract: '渠道服务合同', installments: [
    { key: 'plan-c-1', period: 1, dueDate: '2026-10-28', planned: 12000 },
    { key: 'plan-c-2', period: 2, dueDate: '2027-01-28', planned: 12000 },
  ] },
];

const receiptsSeed: Receipt[] = [
  { key: 'receipt-a', no: '2026110900000021', customer: plansSeed[2].customer, date: '2026-11-09', type: '银行转账', owner: '李佳楠', status: '已通过', allocations: [{ installmentKey: 'plan-c-1', amount: 8000 }] },
  { key: 'receipt-b', no: '2026111000000022', customer: plansSeed[2].customer, date: '2026-11-10', type: '银行转账', owner: '李佳楠', status: '待审批', allocations: [{ installmentKey: 'plan-c-1', amount: 1000 }, { installmentKey: 'plan-c-2', amount: 500 }] },
];

const ordersSeed: SalesOrder[] = [
  { key: 'order-a', no: '2026111200000003', customer: plansSeed[0].customer, total: 800, owner: '李佳楠', creator: '李佳楠' },
  { key: 'order-b', no: '2026110900000004', customer: plansSeed[0].customer, total: 1500, owner: '王敏', creator: '王敏' },
  { key: 'order-c', no: '2026102800000007', customer: plansSeed[2].customer, total: 24000, owner: '李佳楠', creator: '李佳楠' },
];

const customers = [...new Set(plansSeed.map((plan) => plan.customer))];
const money = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const getPlanForPeriod = (plans: Plan[], key: string) => plans.find((plan) => plan.installments.some((period) => period.key === key));
const getPeriod = (plans: Plan[], key: string) => plans.flatMap((plan) => plan.installments).find((period) => period.key === key);

type ReceivablesWorkspaceProps = { periodAllocationEnabled?: boolean };

export function ReceivablesWorkspace({ periodAllocationEnabled = true }: ReceivablesWorkspaceProps) {
  const [plans] = useState(plansSeed);
  const [receipts, setReceipts] = useState(receiptsSeed);
  const [activeTab, setActiveTab] = useState('receipts');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailReceiptKey, setDetailReceiptKey] = useState<string>();
  const [detailPlanKey, setDetailPlanKey] = useState<string>();
  const [detailAllocationPlanKey, setDetailAllocationPlanKey] = useState<string>();
  const [detailTab, setDetailTab] = useState('info');
  const [showAllDetailFields, setShowAllDetailFields] = useState(true);
  const [detailLayout, setDetailLayout] = useState<'table' | 'list'>('table');
  const [customer, setCustomer] = useState('');
  const [receiptDate, setReceiptDate] = useState(dayjs('2026-11-10'));
  const [receiptType, setReceiptType] = useState('银行转账');
  const [detailRows, setDetailRows] = useState<DetailDraft[]>([]);
  const [allocationModalRowKey, setAllocationModalRowKey] = useState<string>();
  const [allocationModalDraft, setAllocationModalDraft] = useState<Record<string, number>>({});
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});

  const amounts = useMemo(() => {
    const result: Record<string, { approved: number; pending: number }> = {};
    receipts.forEach((receipt) => receipt.allocations.forEach((allocation) => {
      const row = result[allocation.installmentKey] ?? { approved: 0, pending: 0 };
      if (receipt.status === '已通过') row.approved += allocation.amount;
      if (receipt.status === '待审批') row.pending += allocation.amount;
      result[allocation.installmentKey] = row;
    }));
    return result;
  }, [receipts]);

  const totalsForPlan = (plan: Plan) => plan.installments.reduce((total, period) => {
    const state = amounts[period.key] ?? { approved: 0, pending: 0 };
    return { planned: total.planned + period.planned, approved: total.approved + state.approved, pending: total.pending + state.pending };
  }, { planned: 0, approved: 0, pending: 0 });
  const detailReceipt = receipts.find((receipt) => receipt.key === detailReceiptKey);
  const detailPlan = plans.find((plan) => plan.key === detailPlanKey);
  const detailAllocationPlan = plans.find((plan) => plan.key === detailAllocationPlanKey);
  const receiptDetailRows = detailReceipt?.allocations.map((allocation) => {
    const plan = getPlanForPeriod(plans, allocation.installmentKey);
    const period = getPeriod(plans, allocation.installmentKey);
    const order = ordersSeed.find((item) => detailReceipt.orderKeys?.includes(item.key));
    const contractPlans = plans.filter((item) => item.contract === plan?.contract);
    const contractOutstanding = contractPlans.reduce((sum, item) => {
      const totals = totalsForPlan(item);
      return sum + Math.max(0, totals.planned - totals.approved - totals.pending);
    }, 0);
    const orderPaid = order ? receipts.filter((receipt) => receipt.status === '已通过' && receipt.orderKeys?.includes(order.key))
      .reduce((sum, receipt) => sum + receipt.allocations.reduce((amount, row) => amount + row.amount, 0), 0) : 0;
    const planTotals = plan ? totalsForPlan(plan) : { planned: 0, approved: 0, pending: 0 };
    return {
      key: allocation.installmentKey,
      contractOutstanding,
      orderNo: order?.no ?? '',
      orderOutstanding: order ? Math.max(0, order.total - orderPaid) : undefined,
      planNo: plan?.no ?? '',
      planOutstanding: Math.max(0, planTotals.planned - planTotals.approved - planTotals.pending),
      period: period?.period,
      amount: allocation.amount,
    };
  }) ?? [];
  const allocationModalPlan = plans.find((plan) => plan.key === detailRows.find((row) => row.rowKey === allocationModalRowKey)?.planKey);
  const draftAllocations = Object.entries(manualAllocations)
    .map(([installmentKey, amount]) => ({ installmentKey, amount }))
    .filter((allocation) => allocation.amount > 0);
  const allocatedTotal = draftAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const visibleReceipts = receipts.filter((receipt) => {
    const matchesStatus = statusFilter === '全部' || receipt.status === statusFilter;
    const matchesKeyword = !keyword || `${receipt.no}${receipt.customer}${receipt.allocations.map((row) => getPlanForPeriod(plans, row.installmentKey)?.no).join('')}`.toLowerCase().includes(keyword.toLowerCase());
    return matchesStatus && matchesKeyword;
  });
  const visiblePlans = plans.filter((plan) => !keyword || `${plan.no}${plan.customer}${plan.contract}`.toLowerCase().includes(keyword.toLowerCase()));
  const openCreate = () => {
    setCustomer('');
    setReceiptDate(dayjs('2026-11-10'));
    setReceiptType('银行转账');
    setDetailRows([{ rowKey: `detail-row-${Date.now()}` }]);
    setAllocationModalRowKey(undefined);
    setAllocationModalDraft({});
    setManualAllocations({});
    setCreateOpen(true);
  };
  const addDetailRow = () => setDetailRows((current) => [...current, { rowKey: `detail-row-${Date.now()}-${Math.random()}` }]);
  const setOrderAssociation = (rowKey: string, orderKey: string) => {
    setDetailRows((current) => current.map((row) => row.rowKey === rowKey ? { ...row, orderKey } : row));
  };
  const setAllocationPlan = (rowKey: string, planKey: string) => {
    const currentRow = detailRows.find((row) => row.rowKey === rowKey);
    const previousPlan = plans.find((plan) => plan.key === currentRow?.planKey);
    setAllocationModalRowKey(undefined);
    setAllocationModalDraft({});
    setDetailRows((current) => current.map((row) => row.rowKey === rowKey ? { ...row, planKey } : row));
    if (previousPlan) setManualAllocations((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !previousPlan.installments.some((period) => period.key === key))));
  };
  const openAllocationModal = (rowKey: string, planKey: string) => {
    const plan = plans.find((item) => item.key === planKey);
    if (!plan) return;
    setAllocationModalDraft(Object.fromEntries(plan.installments.map((period) => [period.key, manualAllocations[period.key] ?? 0])));
    setAllocationModalRowKey(rowKey);
  };
  const closeAllocationModal = () => {
    setAllocationModalRowKey(undefined);
    setAllocationModalDraft({});
  };
  const confirmAllocationModal = () => {
    if (!allocationModalPlan) return;
    const receiptAmount = allocationModalPlan.installments.reduce((sum, period) => sum + (manualAllocations[period.key] ?? 0), 0);
    const allocationTotal = allocationModalPlan.installments.reduce((sum, period) => sum + (allocationModalDraft[period.key] ?? 0), 0);
    if (Math.round(receiptAmount * 100) !== Math.round(allocationTotal * 100)) {
      message.error('分摊总金额大于本次回款金额');
      return;
    }
    const planKeys = new Set(allocationModalPlan.installments.map((period) => period.key));
    setManualAllocations((current) => ({
      ...Object.fromEntries(Object.entries(current).filter(([key]) => !planKeys.has(key))),
      ...allocationModalDraft,
    }));
    closeAllocationModal();
  };
  const setPlanReceiptAmount = (rowKey: string, amount: number | null) => {
    const row = detailRows.find((item) => item.rowKey === rowKey);
    const plan = plans.find((item) => item.key === row?.planKey);
    if (!plan) return;
    let remaining = Math.max(0, amount ?? 0);
    const nextAmounts: Record<string, number> = {};
    plan.installments.forEach((period, index) => {
      const state = amounts[period.key] ?? { approved: 0, pending: 0 };
      const capacity = Math.max(0, period.planned - state.approved - state.pending);
      const value = index === plan.installments.length - 1 ? remaining : Math.min(remaining, capacity);
      nextAmounts[period.key] = value;
      remaining -= value;
    });
    setManualAllocations((current) => ({ ...Object.fromEntries(Object.entries(current).filter(([key]) => !plan.installments.some((period) => period.key === key))), ...nextAmounts }));
  };
  const removeDetailRow = (rowKey: string) => {
    const row = detailRows.find((item) => item.rowKey === rowKey);
    const plan = plans.find((item) => item.key === row?.planKey);
    if (allocationModalRowKey === rowKey) closeAllocationModal();
    setDetailRows((current) => current.filter((item) => item.rowKey !== rowKey));
    if (plan) setManualAllocations((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !plan.installments.some((period) => period.key === key))));
  };

  const saveReceipt = (status: ReceiptStatus, keepCreating = false) => {
    if (!customer) { message.error('请选择关联客户'); return; }
    const activeRows = detailRows.filter((row) => row.orderKey || row.planKey);
    if (!activeRows.length || activeRows.some((row) => !row.planKey)) { message.error('请至少关联一张回款计划'); return; }
    if (allocatedTotal <= 0) { message.error('请填写回款明细中的本次分摊金额'); return; }
    const overage = draftAllocations.find((allocation) => {
      const period = getPeriod(plans, allocation.installmentKey)!;
      const state = amounts[allocation.installmentKey] ?? { approved: 0, pending: 0 };
      return state.approved + state.pending + allocation.amount > period.planned;
    });
    if (overage) {
      const period = getPeriod(plans, overage.installmentKey)!;
      message.error(`回款金额不能超过第${period.period}期未回款金额`);
      return;
    }
    const newReceipt: Receipt = {
      key: `receipt-${Date.now()}`, no: `20261110${String(Date.now()).slice(-6)}`, customer,
      date: receiptDate.format('YYYY-MM-DD'), type: receiptType, owner: '当前用户', status,
      allocations: draftAllocations, orderKeys: [...new Set(activeRows.flatMap((row) => row.orderKey ? [row.orderKey] : []))],
    };
    setReceipts((current) => [newReceipt, ...current]);
    if (keepCreating) {
      setCustomer('');
      setDetailRows([{ rowKey: `detail-row-${Date.now()}` }]);
      setManualAllocations({});
      message.success('已保存，继续创建下一张回款单');
      return;
    }
    setCreateOpen(false);
    setDetailRows([]);
    setManualAllocations({});
    setActiveTab('receipts');
    setStatusFilter('全部');
    if (status === '待审批') setDetailReceiptKey(newReceipt.key);
    message.success(status === '草稿' ? '回款草稿已暂存' : '回款单已提交审批；审批通过后计入已回款金额');
  };
  const changeReceiptStatus = (status: ReceiptStatus) => {
    if (!detailReceipt) return;
    setReceipts((current) => current.map((receipt) => receipt.key === detailReceipt.key ? { ...receipt, status } : receipt));
    message.success(status === '已通过' ? '审批已通过，已回款金额已更新' : '回款单已驳回，未计入已回款金额');
  };

  const receiptColumns: TableColumnsType<Receipt> = [
    { title: '回款编号', dataIndex: 'no', width: 190, render: (value, row) => <Button type="link" className="receivables-link" onClick={() => setDetailReceiptKey(row.key)}>{value}</Button> },
    { title: '关联客户', dataIndex: 'customer', width: 260, ellipsis: true },
    { title: '关联计划期次', width: 300, render: (_, row) => <div className="receivable-relation-list">{row.allocations.map((allocation) => { const plan = getPlanForPeriod(plans, allocation.installmentKey); const period = getPeriod(plans, allocation.installmentKey); return <span key={allocation.installmentKey}>{plan?.no} · 第 {period?.period} 期</span>; })}</div> },
    { title: '回款总额', width: 140, render: (_, row) => money(row.allocations.reduce((sum, allocation) => sum + allocation.amount, 0)) },
    { title: '回款日期', dataIndex: 'date', width: 120 }, { title: '回款类型', dataIndex: 'type', width: 120 }, { title: '负责人', dataIndex: 'owner', width: 100 },
    { title: '状态', dataIndex: 'status', width: 110, render: (status: ReceiptStatus) => <Tag color={status === '已通过' ? 'green' : status === '待审批' ? 'gold' : 'default'}>{status}</Tag> },
    { title: '操作', fixed: 'right', width: 90, render: (_, row) => <Button type="link" onClick={() => setDetailReceiptKey(row.key)}>查看</Button> },
  ];
  const planColumns: TableColumnsType<Plan> = [
    { title: '回款计划编号', dataIndex: 'no', width: 190, render: (value, row) => <Button type="link" className="receivables-link" onClick={() => setDetailPlanKey(row.key)}>{value}</Button> },
    { title: '关联客户', dataIndex: 'customer', width: 260, ellipsis: true }, { title: '关联合同', dataIndex: 'contract', width: 200, ellipsis: true },
    { title: '计划回款总额', width: 150, render: (_, row) => money(totalsForPlan(row).planned) },
    { title: '已回款金额', width: 150, render: (_, row) => money(totalsForPlan(row).approved) },
    { title: '审批中金额', width: 150, render: (_, row) => <span className="receivable-pending-amount">{money(totalsForPlan(row).pending)}</span> },
    { title: '未回款金额', width: 150, render: (_, row) => { const total = totalsForPlan(row); return money(Math.max(0, total.planned - total.approved - total.pending)); } },
    { title: '操作', fixed: 'right', width: 100, render: (_, row) => <Button type="link" onClick={() => setDetailPlanKey(row.key)}>查看明细</Button> },
  ];
  const statusText = (paid: number, pending: number, planned: number) => paid > planned ? '超额回款' : paid >= planned ? '已回款' : paid > 0 ? '部分回款' : pending > 0 ? '审批中' : '未回款';
  const periodColumns: TableColumnsType<Plan['installments'][number]> = [
    { title: '第几期', dataIndex: 'period', width: 100, render: (value) => `第 ${value} 期` }, { title: '计划回款金额', dataIndex: 'planned', width: 150, render: money },
    { title: '已回款金额', width: 150, render: (_, row) => money(amounts[row.key]?.approved ?? 0) },
    { title: '审批中金额', width: 150, render: (_, row) => money(amounts[row.key]?.pending ?? 0) },
    { title: '未回款金额', width: 150, render: (_, row) => { const state = amounts[row.key] ?? { approved: 0, pending: 0 }; return money(Math.max(0, row.planned - state.approved - state.pending)); } },
    { title: '预计回款日期', dataIndex: 'dueDate', width: 140 },
    { title: '回款状态', width: 120, render: (_, row) => { const paid = amounts[row.key]?.approved ?? 0; const pending = amounts[row.key]?.pending ?? 0; const status = statusText(paid, pending, row.planned); return <Tag color={status === '超额回款' ? 'red' : status === '已回款' ? 'green' : status === '审批中' || status === '部分回款' ? 'gold' : 'default'}>{status}</Tag>; } },
    { title: '关联回款单', width: 130, render: (_, row) => { const related = receipts.filter((receipt) => receipt.allocations.some((allocation) => allocation.installmentKey === row.key)); return related.length ? <Button type="link" onClick={() => { setDetailPlanKey(undefined); setDetailReceiptKey(related[0].key); }}>{related.length} 条记录</Button> : <span className="receivable-muted">暂无</span>; } },
  ];
  const allocationModalColumns: TableColumnsType<Plan['installments'][number]> = [
    { title: '期次', dataIndex: 'period', width: 68, render: (value) => <strong>第 {value} 期</strong> },
    { title: '计划金额', dataIndex: 'planned', width: 88, render: money },
    { title: '已回款', width: 86, render: (_, row) => money(amounts[row.key]?.approved ?? 0) },
    { title: '审批中', width: 86, render: (_, row) => <span className="receivable-pending-amount">{money(amounts[row.key]?.pending ?? 0)}</span> },
    { title: '未回款', width: 92, render: (_, row) => { const state = amounts[row.key] ?? { approved: 0, pending: 0 }; return money(Math.max(0, row.planned - state.approved - state.pending)); } },
    { title: '本次分摊', width: 150, render: (_, row) => <InputNumber aria-label={`第${row.period}期本次分摊`} min={0} precision={2} value={allocationModalDraft[row.key] ?? 0} onChange={(value) => setAllocationModalDraft((current) => ({ ...current, [row.key]: value ?? 0 }))} /> },
  ];
  const receiptDetailColumns: TableColumnsType<(typeof receiptDetailRows)[number]> = [
    { title: '关联合同', children: [{ title: '合同未回金额', width: 180, dataIndex: 'contractOutstanding', render: money }] },
    { title: '关联订单', children: [
      { title: '关联订单', width: 190, dataIndex: 'orderNo', render: (value) => value || <span className="receivable-muted">-</span> },
      { title: '订单未回金额', width: 180, dataIndex: 'orderOutstanding', render: (value) => value === undefined ? <span className="receivable-muted">-</span> : money(value) },
    ] },
    { title: '关联回款计划', children: [
      { title: '回款计划编号', width: 250, render: (_, row) => <div className="receivable-detail-plan-ref"><LinkOutlined /><span>{row.planNo}</span>{periodAllocationEnabled && <Button type="link" size="small" onClick={() => setDetailAllocationPlanKey(getPlanForPeriod(plans, row.key)?.key)}>期次分摊</Button>}</div> },
      { title: '回款计划未回金额', width: 190, dataIndex: 'planOutstanding', render: money },
    ] },
    { title: '回款金额', width: 140, dataIndex: 'amount', render: money },
  ];

  const detailColumns: TableColumnsType<DetailDraft> = [
    { title: '关联订单', children: [
      { title: '订单编号', width: 220, render: (_, row) => <Select aria-label={`关联订单 ${row.rowKey}`} placeholder="请选择" value={row.orderKey} disabled={!customer} options={ordersSeed.filter((order) => order.customer === customer && !detailRows.some((other) => other.rowKey !== row.rowKey && other.orderKey === order.key)).map((order) => ({ value: order.key, label: order.no }))} onChange={(value) => setOrderAssociation(row.rowKey, value)} /> },
      { title: '订单总额', width: 140, render: (_, row) => { const order = ordersSeed.find((item) => item.key === row.orderKey); return order ? money(order.total) : <span className="receivable-muted">-</span>; } },
      { title: '负责人', width: 110, render: (_, row) => ordersSeed.find((item) => item.key === row.orderKey)?.owner ?? <span className="receivable-muted">-</span> },
      { title: '创建人', width: 110, render: (_, row) => ordersSeed.find((item) => item.key === row.orderKey)?.creator ?? <span className="receivable-muted">-</span> },
    ] },
    { title: '关联回款计划', children: [
      { title: '回款计划编号', width: 230, render: (_, row) => {
        const plan = plans.find((item) => item.key === row.planKey);
        return <div className="receivable-plan-cell">
          <Select aria-label={`关联回款计划 ${row.rowKey}`} placeholder="请选择" value={row.planKey} disabled={!customer} options={plans.filter((item) => item.customer === customer && !detailRows.some((other) => other.rowKey !== row.rowKey && other.planKey === item.key)).map((item) => ({ value: item.key, label: item.no }))} onChange={(value) => setAllocationPlan(row.rowKey, value)} />
          {plan && periodAllocationEnabled && <div className="receivable-plan-period-action"><span>{plan.installments.length}期</span><Button type="link" size="small" onClick={() => openAllocationModal(row.rowKey, plan.key)}>期次分摊</Button></div>}
        </div>;
      } },
      { title: '回款计划未回金额', width: 180, render: (_, row) => {
        const plan = plans.find((item) => item.key === row.planKey);
        if (!plan) return <span className="receivable-muted">-</span>;
        const totals = totalsForPlan(plan);
        return money(Math.max(0, totals.planned - totals.approved - totals.pending));
      } },
    ] },
    { title: <span><b className="receivable-required-mark">*</b> 回款金额</span>, width: 150, render: (_, row) => {
      const plan = plans.find((item) => item.key === row.planKey);
      const amount = plan?.installments.reduce((sum, period) => sum + (manualAllocations[period.key] ?? 0), 0) ?? 0;
      return <InputNumber aria-label={`回款金额 ${row.rowKey}`} min={0} precision={2} value={amount || undefined} placeholder="请输入" disabled={!plan} onChange={(value) => setPlanReceiptAmount(row.rowKey, value)} />;
    } },
    { title: '操作', width: 72, render: (_, row) => <Button type="text" aria-label="删除回款明细" icon={<DeleteOutlined />} onClick={() => removeDetailRow(row.rowKey)} /> },
  ];

  return <div className="receivables-workspace">
    <div className="receivables-heading"><div><Typography.Title level={3}>回款</Typography.Title><Typography.Text type="secondary">跟踪实际到账与计划期次的分摊情况。</Typography.Text></div>{activeTab === 'receipts' && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建回款</Button>}</div>
    <div className="receivables-panel">
      <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key); setStatusFilter('全部'); setKeyword(''); }} items={[{ key: 'receipts', label: '回款' }, { key: 'plans', label: '回款计划' }]} />
      <div className="receivables-toolbar">
        {activeTab === 'receipts' ? <Space className="receivables-status-filter" size={4}>{['全部', '待审批', '已通过', '已驳回'].map((status) => <Button key={status} type={statusFilter === status ? 'primary' : 'text'} className={statusFilter === status ? 'is-active' : ''} onClick={() => setStatusFilter(status)}>{status}</Button>)}</Space> : <Typography.Text type="secondary">共 {visiblePlans.length} 条回款计划</Typography.Text>}
        <Input allowClear prefix={<SearchOutlined />} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={activeTab === 'receipts' ? '搜索回款编号或客户' : '搜索计划编号、客户或合同'} className="receivables-search" />
      </div>
      {activeTab === 'receipts' ? <Table rowKey="key" columns={receiptColumns} dataSource={visibleReceipts} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1320 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的回款记录" /> }} /> : <Table rowKey="key" columns={planColumns} dataSource={visiblePlans} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1280 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的回款计划" /> }} />}
    </div>

    <Drawer className="receivable-form-drawer" title="新建回款" size={Math.min(800, Math.max(360, window.innerWidth - 24))} open={createOpen} onClose={() => setCreateOpen(false)} footer={<div className="receivable-drawer-footer"><Button icon={<CheckOutlined />} onClick={() => saveReceipt('草稿')}>暂存</Button><div /><Button onClick={() => setCreateOpen(false)}>取消</Button><Button onClick={() => saveReceipt('待审批', true)}>保存并继续创建</Button><Button type="primary" onClick={() => saveReceipt('待审批')}>提交</Button></div>}>
      <div className="receivable-existing-form">
        <div className="receivable-existing-field"><span>回款编号</span><strong>系统自动生成</strong></div>
        <div className="receivable-existing-field receivable-customer-field"><label>关联客户 <b>*</b></label><Select aria-label="关联客户" value={customer || undefined} placeholder="请选择" options={customers.map((name) => ({ value: name, label: name }))} onChange={setCustomer} disabled={detailRows.some((row) => row.orderKey || row.planKey)} /></div>

        <section className="receivable-existing-details">
          <div className="receivable-existing-section-title"><strong>回款明细 <b>*</b></strong><div><Button type="text" disabled={!customer}>表格</Button><Button type="text" disabled={!customer}>列表</Button></div></div>
          <Table
            className="receivable-detail-lines-table"
            rowKey="rowKey"
            size="small"
            bordered
            tableLayout="fixed"
            columns={detailColumns}
            dataSource={detailRows}
            scroll={{ x: 1260 }}
            pagination={{ pageSize: 10, pageSizeOptions: [10, 20, 50], showSizeChanger: true, showTotal: () => <Button className="receivable-existing-add" icon={<PlusOutlined />} disabled={!customer} onClick={addDetailRow}>添加</Button> }}
            locale={{ emptyText: '暂无回款明细，请点击添加' }}
          />
        </section>

        <div className="receivable-existing-field"><label>回款类型</label><Select aria-label="回款类型" value={receiptType} options={['银行转账', '线上支付', '现金', '其他'].map((value) => ({ value, label: value }))} onChange={setReceiptType} /></div>
        <div className="receivable-existing-field"><label>回款总金额 <b>*</b></label><strong className="receivable-derived-total">{allocatedTotal ? money(allocatedTotal) : '-'}</strong></div>
        <div className="receivable-existing-field"><label>回款日期 <b>*</b></label><DatePicker aria-label="回款日期" value={receiptDate} onChange={(value) => value && setReceiptDate(value)} /></div>
      </div>
    </Drawer>

    <Modal title="期次分摊" open={Boolean(allocationModalRowKey)} width={Math.min(920, window.innerWidth - 32)} onCancel={closeAllocationModal} onOk={confirmAllocationModal} cancelText="取消" okText="确定">
      {allocationModalPlan && <Table rowKey="key" className="receivable-allocation-modal-table" size="small" bordered tableLayout="fixed" columns={allocationModalColumns} dataSource={allocationModalPlan.installments} pagination={false} scroll={{ x: 700 }} />}
    </Modal>

    <Drawer
      className="receivable-detail-drawer receivable-detail-page"
      title={detailReceipt && <div className="receivable-detail-header">
        <div className="receivable-detail-header-main">
          <strong>{detailReceipt.no}</strong>
          <Space size={2} className="receivable-detail-actions">
            <Button type="text" title="编辑" aria-label="编辑回款" icon={<EditOutlined />} onClick={() => message.info('编辑回款')} />
            <Button type="text" title="打印" aria-label="打印回款" icon={<PrinterOutlined />} onClick={() => window.print()} />
            <Button type="text" title="下载" aria-label="下载回款" icon={<DownloadOutlined />} onClick={() => message.info('下载回款详情')} />
            <Button type="text" title="删除" aria-label="删除回款" icon={<DeleteOutlined />} onClick={() => message.info('删除回款')} />
            <Button type="text" title="全屏" aria-label="全屏查看" icon={<FullscreenOutlined />} onClick={() => message.info('全屏查看')} />
            <Button type="text" title="复制链接" aria-label="复制回款链接" icon={<CopyOutlined />} onClick={() => { void navigator.clipboard?.writeText(detailReceipt.no); message.success('已复制回款编号'); }} />
            <Button type="text" title="关闭" aria-label="关闭回款详情" icon={<CloseOutlined />} onClick={() => setDetailReceiptKey(undefined)} />
            <Button type="link" className="receivable-detail-followup" onClick={() => message.info('写跟进')}>写跟进 »</Button>
          </Space>
        </div>
        <div className="receivable-detail-header-meta">
          <span><em>关联客户：</em><LinkOutlined />{detailReceipt.customer}</span>
          <span><em>回款日期：</em>{detailReceipt.date}</span>
          <span><em>负责人：</em>{detailReceipt.owner}（Alice）</span>
        </div>
      </div>}
      size={Math.max(360, window.innerWidth - (window.innerWidth > 760 ? 130 : 24))}
      open={Boolean(detailReceipt)}
      closable={false}
      onClose={() => setDetailReceiptKey(undefined)}
      footer={detailReceipt && <div className="receivable-detail-footer">
        <Space className="receivable-detail-footer-actions">
          <Button type="text" icon={<BellOutlined />} onClick={() => message.info('提醒设置')}>设置提醒</Button>
          <Button type="text" icon={<CopyOutlined />} onClick={() => {
            const planKeys = [...new Set(detailReceipt.allocations.map((allocation) => getPlanForPeriod(plans, allocation.installmentKey)?.key).filter((key): key is string => Boolean(key)))];
            setDetailReceiptKey(undefined);
            setCustomer(detailReceipt.customer);
            setReceiptDate(dayjs(detailReceipt.date));
            setReceiptType(detailReceipt.type);
            setDetailRows(planKeys.map((planKey, index) => ({ rowKey: `copy-detail-${Date.now()}-${index}`, planKey })));
            setManualAllocations(Object.fromEntries(detailReceipt.allocations.map((allocation) => [allocation.installmentKey, allocation.amount])));
            setCreateOpen(true);
          }}>复制并新建</Button>
          {detailReceipt.status === '待审批' && <><Button onClick={() => changeReceiptStatus('已驳回')}>模拟审批驳回</Button><Button type="primary" onClick={() => changeReceiptStatus('已通过')}>模拟审批通过</Button></>}
        </Space>
        <Space className="receivable-detail-footer-navigation">
          <Button onClick={() => setDetailReceiptKey(undefined)}>关闭</Button>
          <Button aria-label="上一条回款" icon={<LeftOutlined />} disabled={visibleReceipts.findIndex((receipt) => receipt.key === detailReceipt.key) <= 0} onClick={() => { const index = visibleReceipts.findIndex((receipt) => receipt.key === detailReceipt.key); if (index > 0) setDetailReceiptKey(visibleReceipts[index - 1].key); }} />
          <Button aria-label="下一条回款" icon={<RightOutlined />} disabled={visibleReceipts.findIndex((receipt) => receipt.key === detailReceipt.key) >= visibleReceipts.length - 1} onClick={() => { const index = visibleReceipts.findIndex((receipt) => receipt.key === detailReceipt.key); if (index < visibleReceipts.length - 1) setDetailReceiptKey(visibleReceipts[index + 1].key); }} />
        </Space>
      </div>}
    >
      {detailReceipt && <>
        <Tabs activeKey={detailTab} onChange={setDetailTab} className="receivable-detail-tabs" items={[{ key: 'info', label: '回款信息' }, { key: 'activity', label: '回款动态' }]} />
        {detailTab === 'info' ? <>
          <div className="receivable-detail-section-heading">
            <strong>基本信息</strong>
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setShowAllDetailFields((value) => !value)}>{showAllDetailFields ? '收起' : '显示全部'}</Button>
          </div>
          <div className="receivable-detail-info-grid">
            {[
              ['回款编号', detailReceipt.no], ['关联客户', <span className="receivable-detail-customer"><LinkOutlined />{detailReceipt.customer}</span>],
              ['回款日期', detailReceipt.date], ['回款类型', detailReceipt.type || '-'],
              ['负责人', `${detailReceipt.owner}（Alice）`], ['创建人', `${detailReceipt.owner}（Alice）`],
              ['更新人', `${detailReceipt.owner}（Alice）`], ['创建时间', `${detailReceipt.date} 16:17:32`],
              ['更新时间', `${detailReceipt.date} 16:17:32`, 'wide'],
            ].map(([label, value, width]) => <div className={`receivable-detail-info-item${width === 'wide' ? ' is-wide' : ''}`} key={label as string}>
              <span>{label}</span><strong>{value}</strong>
            </div>)}
          </div>

          <div className="receivable-detail-section-heading receivable-detail-lines-heading">
            <strong>回款明细</strong>
            <Space.Compact size="small">
              <Button type={detailLayout === 'table' ? 'default' : 'text'} onClick={() => setDetailLayout('table')}>表格</Button>
              <Button type={detailLayout === 'list' ? 'default' : 'text'} onClick={() => setDetailLayout('list')}>列表</Button>
            </Space.Compact>
          </div>
          {detailLayout === 'table' ? <Table rowKey="key" className="receivable-detail-lines-view" size="small" bordered tableLayout="fixed" pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共${total}项` }} scroll={{ x: 1370 }} dataSource={receiptDetailRows} columns={receiptDetailColumns} /> :
            <div className="receivable-detail-line-list">{receiptDetailRows.map((row) => <div key={row.key}>
              <span>回款计划编号</span><strong>{row.planNo}</strong><span>期次</span><strong>第 {row.period} 期</strong><span>回款金额</span><strong>{money(row.amount)}</strong>
              {periodAllocationEnabled && <Button type="link" onClick={() => setDetailAllocationPlanKey(getPlanForPeriod(plans, row.key)?.key)}>期次分摊</Button>}
            </div>)}</div>}
        </> : <div className="receivable-detail-activity">
          <div><i /><span>{detailReceipt.date} 16:17:32</span><strong>{detailReceipt.owner}（Alice）创建了回款单</strong></div>
          {detailReceipt.status !== '草稿' && <div><i /><span>{detailReceipt.date} 16:20:10</span><strong>回款单状态：{detailReceipt.status}</strong></div>}
        </div>}
      </>}
    </Drawer>

    <Modal title="期次分摊" open={Boolean(detailAllocationPlan)} onCancel={() => setDetailAllocationPlanKey(undefined)} footer={<Button type="primary" onClick={() => setDetailAllocationPlanKey(undefined)}>关闭</Button>}>
      {detailReceipt && detailAllocationPlan && <Table rowKey="installmentKey" size="small" pagination={false} dataSource={detailReceipt.allocations.filter((allocation) => getPlanForPeriod(plans, allocation.installmentKey)?.key === detailAllocationPlan.key)} columns={[
        { title: '期次', render: (_, row) => `第 ${getPeriod(plans, row.installmentKey)?.period} 期` },
        { title: '计划金额', render: (_, row) => money(getPeriod(plans, row.installmentKey)?.planned ?? 0) },
        { title: '本次回款分摊', dataIndex: 'amount', render: money },
      ]} />}
    </Modal>

    <Drawer className="receivable-detail-drawer" title={detailPlan ? `回款计划 ${detailPlan.no}` : ''} size={Math.min(1160, Math.max(360, window.innerWidth - 24))} open={Boolean(detailPlan)} onClose={() => setDetailPlanKey(undefined)}>
      {detailPlan && <>
        <div className="receivable-plan-meta"><div><span>关联客户</span><strong>{detailPlan.customer}</strong></div><div><span>关联合同</span><strong>{detailPlan.contract}</strong></div></div>
        <div className="receivable-plan-totals">{[
          ['计划回款总额', totalsForPlan(detailPlan).planned], ['已回款金额', totalsForPlan(detailPlan).approved],
          ['审批中金额', totalsForPlan(detailPlan).pending], ['未回款金额', Math.max(0, totalsForPlan(detailPlan).planned - totalsForPlan(detailPlan).approved - totalsForPlan(detailPlan).pending)],
        ].map(([label, amount]) => <div key={String(label)}><span>{label}</span><strong>{money(Number(amount))}</strong></div>)}</div>
        <div className="receivable-form-section-title receivable-detail-section-title"><strong>回款计划明细</strong><span>审批通过后更新已回款金额</span></div>
        <Table rowKey="key" size="small" pagination={false} scroll={{ x: 1050 }} columns={periodColumns} dataSource={detailPlan.installments} />
      </>}
    </Drawer>
  </div>;
}

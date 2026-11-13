import { useEffect, useMemo, useState } from 'react';
import { CopyOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Input,
  Modal,
  Progress,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
  type MenuProps,
  type UploadFile,
  type TableColumnsType,
} from 'antd';

type CoverageStatus = '已覆盖' | '未覆盖';
type MigrationStatus = '待开始' | '并行中' | '迁移失败' | '已完成';
type Version = '基础版' | '高级版' | '旗舰版';
type UsageOption = '客户管理' | '联系人' | '商机' | '合同' | '回款' | '标签';
type OldSystemStatus = '可用' | '已关闭';
type ParallelStatus = '不适用' | '并行中' | '并行到期' | '已结束';
type ImportMode = '新增' | '新增并更新' | '仅更新';
type ResultStatus = '成功' | '失败';
type ExecuteRow = { key: number; name: string; corpid: string };

type Enterprise = {
  id: number;
  name: string;
  corpid: string;
  version: Version;
  expiry: string;
  activeRate: number;
  t3ActiveUsers: number;
  t3ActiveRate: number;
  startTime: string;
  endTime: string;
  resultStatus: ResultStatus;
  parallelTime: string;
  usage: UsageOption[];
  risk: '高' | '中' | '低';
  coverage: CoverageStatus;
  migration: MigrationStatus;
  parallel: ParallelStatus;
  oldSystem: OldSystemStatus;
  owner: string;
  operatedAt: string;
  technicalNote?: string;
};

const initialEnterprises: Enterprise[] = [
  { id: 1001, name: '星河科技', corpid: 'ding788999', version: '旗舰版', expiry: '2026-09-05 18:00:00', activeRate: 0, t3ActiveUsers: 0, t3ActiveRate: 0, startTime: '2026-09-01 09:40:12', endTime: '2026-09-01 09:42:18', resultStatus: '成功', parallelTime: '-', usage: ['客户管理'], risk: '低', coverage: '已覆盖', migration: '已完成', parallel: '不适用', oldSystem: '可用', owner: '林晓', operatedAt: '2026-09-01 09:42:18' },
  { id: 1002, name: '远山制造', corpid: 'ding788998', version: '高级版', expiry: '2026-09-08 23:59:59', activeRate: 0, t3ActiveUsers: 0, t3ActiveRate: 0, startTime: '2026-09-01 09:16:44', endTime: '2026-09-01 09:18:03', resultStatus: '成功', parallelTime: '-', usage: ['客户管理', '联系人'], risk: '低', coverage: '已覆盖', migration: '待开始', parallel: '不适用', oldSystem: '可用', owner: '周宁', operatedAt: '2026-09-01 09:18:03' },
  { id: 1003, name: '蓝岸零售', corpid: 'ding788997', version: '旗舰版', expiry: '2026-09-12 18:00:00', activeRate: 36, t3ActiveUsers: 128, t3ActiveRate: 42, startTime: '2026-08-31 16:20:11', endTime: '2026-08-31 16:22:38', resultStatus: '成功', parallelTime: '2026-08-31 16:20:11 - 至今', usage: ['客户管理', '商机', '合同'], risk: '中', coverage: '已覆盖', migration: '并行中', parallel: '并行中', oldSystem: '可用', owner: '林晓', operatedAt: '2026-08-31 16:20:11' },
  { id: 1004, name: '清源服务', corpid: 'ding788996', version: '高级版', expiry: '2026-09-15 18:00:00', activeRate: 58, t3ActiveUsers: 76, t3ActiveRate: 61, startTime: '2026-08-31 14:06:29', endTime: '2026-08-31 14:08:47', resultStatus: '成功', parallelTime: '2026-08-31 14:06:29 - 至今', usage: ['客户管理', '商机', '回款'], risk: '高', coverage: '已覆盖', migration: '并行中', parallel: '并行到期', oldSystem: '可用', owner: '陈默', operatedAt: '2026-08-31 14:06:29' },
  { id: 1005, name: '北辰软件', corpid: 'ding788995', version: '基础版', expiry: '2026-09-18 23:59:59', activeRate: 12, t3ActiveUsers: 24, t3ActiveRate: 16, startTime: '2026-09-01 11:24:09', endTime: '2026-09-01 11:26:42', resultStatus: '失败', parallelTime: '-', usage: ['客户管理'], risk: '中', coverage: '未覆盖', migration: '待开始', parallel: '不适用', oldSystem: '可用', owner: '周宁', operatedAt: '2026-09-01 11:26:42', technicalNote: '等待平台管理员确认功能覆盖' },
  { id: 1006, name: '麦田教育', corpid: 'ding788994', version: '基础版', expiry: '2026-09-20 18:00:00', activeRate: 0, t3ActiveUsers: 0, t3ActiveRate: 0, startTime: '2026-08-31 18:37:30', endTime: '2026-08-31 18:40:16', resultStatus: '成功', parallelTime: '-', usage: ['客户管理', '标签'], risk: '低', coverage: '已覆盖', migration: '已完成', parallel: '不适用', oldSystem: '已关闭', owner: '陈默', operatedAt: '2026-08-31 18:40:16' },
  { id: 1007, name: '云杉物流', corpid: 'ding788993', version: '高级版', expiry: '2026-09-22 18:00:00', activeRate: 22, t3ActiveUsers: 41, t3ActiveRate: 24, startTime: '2026-08-31 15:10:02', endTime: '2026-08-31 15:12:06', resultStatus: '失败', parallelTime: '-', usage: ['客户管理', '联系人', '商机'], risk: '中', coverage: '已覆盖', migration: '迁移失败', parallel: '不适用', oldSystem: '可用', owner: '林晓', operatedAt: '2026-08-31 15:12:06', technicalNote: '迁移任务超时，待技术重试' },
  { id: 1008, name: '瀚海传媒', corpid: 'ding788992', version: '基础版', expiry: '2026-09-25 23:59:59', activeRate: 0, t3ActiveUsers: 0, t3ActiveRate: 0, startTime: '-', endTime: '-', resultStatus: '失败', parallelTime: '-', usage: ['客户管理'], risk: '低', coverage: '未覆盖', migration: '待开始', parallel: '不适用', oldSystem: '可用', owner: '周宁', operatedAt: '2026-08-30 10:22:34', technicalNote: '新系统能力待补齐' },
  { id: 1009, name: '青禾医疗', corpid: 'ding788991', version: '旗舰版', expiry: '2026-09-28 18:00:00', activeRate: 76, t3ActiveUsers: 318, t3ActiveRate: 79, startTime: '2026-09-01 10:03:27', endTime: '2026-09-01 10:05:51', resultStatus: '成功', parallelTime: '2026-09-01 10:03:27 - 至今', usage: ['客户管理', '商机', '合同', '回款'], risk: '高', coverage: '已覆盖', migration: '并行中', parallel: '并行中', oldSystem: '可用', owner: '陈默', operatedAt: '2026-09-01 10:03:27' },
];

const migrationOptions: MigrationStatus[] = ['待开始', '并行中', '迁移失败', '已完成'];
const resultStatusOptions: ResultStatus[] = ['成功', '失败'];
const coverageOptions: CoverageStatus[] = ['已覆盖', '未覆盖'];
const versionOptions: Version[] = ['基础版', '高级版', '旗舰版'];
const usageOptions: UsageOption[] = ['客户管理', '联系人', '商机', '合同', '回款', '标签'];

const riskColors: Record<Enterprise['risk'], string> = { 高: 'error', 中: 'warning', 低: 'success' };
const legacyClosedNames = new Set<string>();

const disableMigrationTime = (current: Dayjs | null) => {
  if (!current || !current.isSame(dayjs(), 'day')) return {};
  const now = dayjs();
  return {
    disabledHours: () => Array.from({ length: now.hour() }, (_, index) => index),
    disabledMinutes: (hour: number) => hour === now.hour()
      ? Array.from({ length: now.minute() }, (_, index) => index)
      : [],
    disabledSeconds: (hour: number, minute: number) => hour === now.hour() && minute === now.minute()
      ? Array.from({ length: now.second() + 1 }, (_, index) => index)
      : [],
  };
};

export function MigrationWorkspace({ onOpenCloseLegacy }: { onOpenCloseLegacy: (enterprise?: Enterprise) => void }) {
  const [enterprises, setEnterprises] = useState<Enterprise[]>(() => initialEnterprises.map((item) => legacyClosedNames.has(item.name) ? { ...item, oldSystem: '已关闭' } : item));
  const [corpidFilter, setCorpidFilter] = useState('');
  const [resultStatus, setResultStatus] = useState<ResultStatus>();
  const [executorFilter, setExecutorFilter] = useState<string>();
  const [executionRange, setExecutionRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executeRows, setExecuteRows] = useState<ExecuteRow[]>([]);
  const [migrationMode, setMigrationMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('新增');
  const [importFile, setImportFile] = useState<UploadFile>();
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const handleLegacyClosed = (event: Event) => {
      const enterpriseName = (event as CustomEvent<{ enterpriseName?: string }>).detail?.enterpriseName;
      if (!enterpriseName) return;
      legacyClosedNames.add(enterpriseName);
      setEnterprises((items) => items.map((item) => item.name === enterpriseName ? { ...item, oldSystem: '已关闭', operatedAt: '2026-09-01 20:12:01' } : item));
    };
    window.addEventListener('crm:legacy-closed', handleLegacyClosed);
    return () => window.removeEventListener('crm:legacy-closed', handleLegacyClosed);
  }, []);

  const filtered = useMemo(() => enterprises.filter((item) => {
    const normalizedCorpid = corpidFilter.trim().toLowerCase();
    const matchCorpid = !normalizedCorpid || item.corpid.toLowerCase().includes(normalizedCorpid);
    const matchStatus = !resultStatus || item.resultStatus === resultStatus;
    const matchExecutor = !executorFilter || item.owner === executorFilter;
    const hasExecutionFilter = Boolean(executionRange[0] || executionRange[1]);
    const operatedAt = item.operatedAt !== '-' ? dayjs(item.operatedAt) : null;
    const matchExecutionTime = !hasExecutionFilter || Boolean(operatedAt?.isValid() &&
      (!executionRange[0] || !operatedAt.isBefore(executionRange[0])) &&
      (!executionRange[1] || !operatedAt.isAfter(executionRange[1])));
    return matchCorpid && matchStatus && matchExecutor && matchExecutionTime;
  }), [corpidFilter, enterprises, executionRange, executorFilter, resultStatus]);

  const executorOptions = useMemo(() => [...new Set(enterprises.map((item) => item.owner))]
    .map((owner) => ({ value: owner, label: owner })), [enterprises]);

  const summary = useMemo(() => ({
    total: enterprises.length,
    completed: enterprises.filter((item) => item.migration === '已完成').length,
    parallel: enterprises.filter((item) => item.migration === '并行中').length,
    notStarted: enterprises.filter((item) => item.migration === '待开始').length,
  }), [enterprises]);

  const updateEnterprise = (id: number, patch: Partial<Enterprise>) => {
    setEnterprises((items) => items.map((item) => item.id === id ? { ...item, ...patch, operatedAt: '2026-09-01 20:12:01' } : item));
  };

  const requestExecute = (ids: number[]) => {
    if (!ids.length) {
      message.info('请先选择需要迁移的企业');
      return;
    }
    const blocked = enterprises.filter((item) => ids.includes(item.id) && item.coverage !== '已覆盖');
    if (blocked.length) {
      message.warning(`有 ${blocked.length} 家企业新系统功能未覆盖，暂不能执行迁移`);
      return;
    }
    setExecuteOpen(true);
  };

  const openExecute = () => {
    setExecuteRows([{ key: Date.now(), name: '', corpid: '' }]);
    setExecuteOpen(true);
  };

  const closeExecute = () => {
    if (executing) return;
    setExecuteOpen(false);
    setExecuteRows([]);
    setMigrationMode('immediate');
    setScheduledAt(null);
  };

  const openImport = (mode: ImportMode) => {
    setImportMode(mode);
    setImportFile(undefined);
    setImportOpen(true);
  };

  const importMenu: MenuProps = {
    items: ['新增', '新增并更新', '仅更新'].map((mode) => ({ key: mode, label: mode })),
    onClick: ({ key }) => openImport(key as ImportMode),
  };

  const submitImport = () => {
    if (!importFile) {
      message.info('请先选择企业台账文件');
      return;
    }
    setImporting(true);
    window.setTimeout(() => {
      setImporting(false);
      setImportOpen(false);
      message.success(`${importMode}导入已完成，结果可在台账中查看`);
    }, 850);
  };

  const executeMigration = () => {
    const rows = executeRows.map((row) => ({ ...row, name: row.name.trim(), corpid: row.corpid.trim() }));
    if (!rows.length || rows.some((row) => !row.name || !row.corpid)) {
      message.warning('请完整填写每一行的企业名称和 corpid');
      return;
    }
    if (migrationMode === 'scheduled') {
      if (!scheduledAt || !scheduledAt.isAfter(dayjs())) {
        message.warning('请选择当前时间之后的迁移时间');
        return;
      }
      setExecuting(true);
      window.setTimeout(() => {
        setExecuting(false);
        closeExecute();
        message.success(`指定时间迁移任务已创建，将于 ${scheduledAt.format('YYYY-MM-DD HH:mm:ss')} 执行`);
      }, 650);
      return;
    }
    setExecuting(true);
    const startedAt = dayjs();
    const createdId = Math.max(...enterprises.map((item) => item.id), 1000) + 1;
    window.setTimeout(() => {
      const finishedAt = dayjs();
      const created: Enterprise[] = rows.map((row, index) => ({
        id: createdId + index,
        name: row.name,
        corpid: row.corpid,
        version: '基础版',
        expiry: '-',
        activeRate: 0,
        t3ActiveUsers: 0,
        t3ActiveRate: 0,
        startTime: startedAt.format('YYYY-MM-DD HH:mm:ss'),
        endTime: finishedAt.format('YYYY-MM-DD HH:mm:ss'),
        resultStatus: '成功',
        parallelTime: '-',
        usage: [],
        risk: '低',
        coverage: '已覆盖',
        migration: '已完成',
        parallel: '不适用',
        oldSystem: '可用',
        owner: '平台迁移管理员',
        operatedAt: finishedAt.format('YYYY-MM-DD HH:mm:ss'),
      }));
      setEnterprises((items) => [...created, ...items]);
      setExecuting(false);
      closeExecute();
      message.success('迁移指令已下发，状态已更新');
    }, 1100);
  };

  const columns: TableColumnsType<Enterprise> = [
    { title: '企业名称', dataIndex: 'name', fixed: 'left', width: 150, render: (value: string, record) => <button type="button" className="migration-enterprise-link" onClick={() => message.info(`打开 ${record.name} 详情`)}>{value}</button> },
    { title: 'corpid', dataIndex: 'corpid', width: 130, render: (value: string) => <span className="migration-mono">{value}</span> },
    { title: '状态', dataIndex: 'resultStatus', width: 110, render: (value: ResultStatus) => <span className={`migration-result-status is-${value === '成功' ? 'success' : 'failure'}`}><i aria-hidden="true" />{value}</span> },
    { title: '执行人', dataIndex: 'owner', width: 110 },
    { title: '执行时间', dataIndex: 'operatedAt', width: 170 },
  ];

  return <div className="migration-workspace">
    <section className="crm-surface migration-list-card">
      <div className="migration-list-toolbar"><div><strong>迁移企业列表</strong><span>共 {filtered.length} 家</span></div><Space wrap><Button onClick={() => { setCorpidFilter(''); setResultStatus(undefined); setExecutorFilter(undefined); setExecutionRange([null, null]); }}>重置筛选</Button></Space></div>
      <div className="migration-filter-grid">
        <Input allowClear value={corpidFilter} placeholder="请输入 corpid" onChange={(event) => setCorpidFilter(event.target.value)} />
        <Select allowClear value={resultStatus} placeholder="状态" options={resultStatusOptions.map((option) => ({ value: option, label: option }))} onChange={setResultStatus} />
        <Select allowClear value={executorFilter} placeholder="执行人" options={executorOptions} onChange={setExecutorFilter} />
        <DatePicker.RangePicker allowClear showTime value={executionRange} format="YYYY-MM-DD HH:mm:ss" placeholder={['执行时间开始', '执行时间结束']} onChange={(value) => setExecutionRange(value ?? [null, null])} />
      </div>
      <div className="migration-list-actions"><Button type="primary" onClick={openExecute}>执行迁移</Button></div>
      <Table<Enterprise> rowKey="id" size="middle" scroll={{ x: 1000 }} columns={columns} dataSource={filtered} pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `共 ${total} 家` }} />
    </section>

    <Modal title="请输入执行迁移企业" open={executeOpen} onCancel={closeExecute} footer={<Space><Button disabled={executing} onClick={closeExecute}>取消</Button><Button type="primary" loading={executing} onClick={executeMigration}>执行迁移</Button></Space>} destroyOnClose>
      <Table<ExecuteRow>
        rowKey="key"
        size="small"
        pagination={false}
        dataSource={executeRows}
        columns={[
          { title: '企业名称', dataIndex: 'name', render: (value: string, record) => <Input value={value} placeholder="请输入企业名称" disabled={executing} onChange={(event) => setExecuteRows((rows) => rows.map((row) => row.key === record.key ? { ...row, name: event.target.value } : row))} /> },
          { title: 'corpid', dataIndex: 'corpid', render: (value: string, record) => <Input value={value} placeholder="请输入 corpid" disabled={executing} onChange={(event) => setExecuteRows((rows) => rows.map((row) => row.key === record.key ? { ...row, corpid: event.target.value } : row))} /> },
          { title: '操作', key: 'remove', width: 96, render: (_, record) => <Space size={2}><Button type="text" size="small" className="migration-row-icon-button" aria-label="复制新增一行" title="复制新增一行" disabled={executing} icon={<CopyOutlined />} onClick={() => setExecuteRows((rows) => { const index = rows.findIndex((row) => row.key === record.key); const copied = { ...record, key: Date.now() + Math.floor(Math.random() * 1000) }; return [...rows.slice(0, index + 1), copied, ...rows.slice(index + 1)]; })} /><Button type="text" size="small" danger className="migration-row-icon-button" aria-label="删除当前行" title="删除当前行" disabled={executing || executeRows.length === 1} icon={<DeleteOutlined />} onClick={() => setExecuteRows((rows) => rows.filter((row) => row.key !== record.key))} /></Space> },
        ]}
      />
    </Modal>

    <Modal title={`导入企业台账 · ${importMode}`} open={importOpen} onCancel={() => !importing && setImportOpen(false)} footer={<Space><Button disabled={importing} onClick={() => setImportOpen(false)}>取消</Button><Button type="primary" loading={importing} disabled={!importFile} onClick={submitImport}>确认导入</Button></Space>} destroyOnClose>
      <div className="migration-import-summary"><strong>导入方式：{importMode}</strong><span>{importMode === '新增' ? '仅新增不存在的企业，重复企业将返回失败明细。' : importMode === '新增并更新' ? '不存在则新增，已存在企业按 corpid 更新。' : '仅更新已存在企业，不新增企业。'}</span></div>
      <Upload accept=".xlsx,.xls,.csv" maxCount={1} beforeUpload={() => false} fileList={importFile ? [importFile] : []} onChange={({ fileList }) => setImportFile(fileList[0])}><Button>选择企业台账文件</Button></Upload>
      <Typography.Paragraph type="secondary">支持 XLSX、XLS、CSV；建议使用平台导出模板，导入结果会保留成功和失败明细。</Typography.Paragraph>
    </Modal>
  </div>;
}

function SummaryCard({ label, value, total, suffix, tone, active, onClick }: { label: string; value: number; total: number; suffix: string; tone?: 'blue' | 'cyan' | 'green' | 'orange'; active?: boolean; onClick: () => void }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return <button type="button" className={`migration-summary-card${tone ? ` is-${tone}` : ''}${active ? ' is-active' : ''}`} onClick={onClick}><span>{label}</span><strong>{value}<small>{suffix}</small></strong><Progress percent={percent} showInfo={false} strokeColor={tone === 'green' ? '#24a148' : tone === 'orange' ? '#d97706' : '#007fff'} size="small" /></button>;
}

export function CloseLegacySystemModal({ open, enterpriseName, onCancel, onSuccess }: { open: boolean; enterpriseName: string; onCancel: () => void; onSuccess: (enterpriseName: string) => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const closeLegacy = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setConfirmed(false);
      legacyClosedNames.add(enterpriseName);
      window.dispatchEvent(new CustomEvent('crm:legacy-closed', { detail: { enterpriseName } }));
      onSuccess(enterpriseName);
      message.success('旧系统已关闭');
    }, 650);
  };

  return <Modal title="关闭旧系统" open={open} onCancel={() => !submitting && onCancel()} footer={<Space><Button disabled={submitting} onClick={onCancel}>取消</Button><Button type="primary" danger disabled={!confirmed} loading={submitting} onClick={closeLegacy}>确认关闭旧系统</Button></Space>} destroyOnClose>
    <div className="legacy-modal-meta"><Tag color="blue">租户级超级管理员</Tag><span>当前企业：{enterpriseName}</span></div>
    <Alert type="warning" showIcon message="关闭后客户侧将无法进入旧系统" description="旧系统将从“可用”变为“已关闭”。新系统产生的数据不会回写旧系统；技术恢复由技术侧处理，本页面不提供恢复入口。" />
    <div className="legacy-modal-detail"><div><span>旧系统状态</span><strong>可用</strong></div><div><span>关闭后状态</span><strong className="is-danger">已关闭</strong></div><div><span>操作范围</span><strong>仅当前企业</strong></div></div>
    <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}>我已了解关闭旧系统后的影响，并确认继续</Checkbox>
  </Modal>;
}

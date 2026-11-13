import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Drawer,
  Empty,
  Input,
  List,
  Modal,
  Segmented,
  Select,
  Space,
  Tag,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd';
import type { Customer, FollowUpType } from '../customers/model';

type SourceType = 'dingtalk' | 'tencent' | 'chat';
type DraftStatus = '待确认' | '已写入' | '解析失败' | '处理中';
type WorkspaceTab = 'new' | 'drafts' | 'history';
type DingtalkAuthState = 'ready' | 'adminPending' | 'userPending' | 'expired' | 'denied';
type DingtalkMeetingStatus = 'ready' | 'processing' | 'notGenerated';

export interface CommunicationDraft {
  id: number;
  source: SourceType;
  sourceLabel: string;
  title: string;
  sourceTime: string;
  customer: string;
  contact: string;
  opportunity: string;
  summary: string;
  needs: string;
  customerCommitment: string;
  salesCommitment: string;
  nextStep: string;
  taskOwner: string;
  taskDue: string;
  taskDefinition: string;
  status: DraftStatus;
  confidence: '高' | '中' | '待确认';
  evidence: string;
}

const sourceMeta: Record<SourceType, { label: string }> = {
  dingtalk: { label: '钉钉会议' },
  tencent: { label: '腾讯会议' },
  chat: { label: '聊天截图' },
};

const dingtalkMeetings: Array<{ value: string; label: string; status: DingtalkMeetingStatus; statusLabel: string; taskUuid?: string }> = [
  { value: '华东新材料 · 采购需求沟通', label: '今天 10:20 · 华东新材料 · 采购需求沟通', status: 'ready', statusLabel: '已生成听记', taskUuid: '演示 taskUuid · 20260825-001' },
  { value: '远景工业 · 合同执行复盘', label: '昨天 16:20 · 远景工业 · 合同执行复盘', status: 'ready', statusLabel: '已生成听记', taskUuid: '演示 taskUuid · 20260824-002' },
  { value: '北辰制造 · 例行周会', label: '今天 09:00 · 北辰制造 · 例行周会', status: 'processing', statusLabel: '听记处理中' },
  { value: '客户拜访 · 现场沟通', label: '昨天 14:00 · 客户拜访 · 现场沟通', status: 'notGenerated', statusLabel: '仅有日程，无听记' },
];

const tencentMeetings = [
  { value: '华东新材料 · 采购需求沟通', label: '今天 10:20 · 华东新材料 · 采购需求沟通' },
  { value: '远景工业 · 合同执行复盘', label: '昨天 16:20 · 远景工业 · 合同执行复盘' },
];

const demoDrafts: CommunicationDraft[] = [
  {
    id: 201,
    source: 'dingtalk',
    sourceLabel: '钉钉会议',
    title: '华东新材料 · 采购需求沟通',
    sourceTime: '今天 10:20',
    customer: '华东新材料科技有限公司',
    contact: '周敏 · 采购负责人',
    opportunity: '华东新材料数字化采购项目',
    summary: '客户希望在本季度完成采购协同方案评估，重点关注权限、数据同步和上线周期。',
    needs: '需要支持多部门审批、供应商协同和历史订单数据导入。',
    customerCommitment: '客户将在周五前补充现有审批流程和数据样例。',
    salesCommitment: '销售下周一前提供方案初稿和实施周期说明。',
    nextStep: '整理方案初稿并预约下一次评审会议',
    taskOwner: '李明',
    taskDue: '2026-08-28',
    taskDefinition: '完成方案初稿并发送给周敏确认',
    status: '待确认',
    confidence: '高',
    evidence: '会议纪要 00:12:18-00:18:42：客户明确提到审批、供应商协同和数据导入。',
  },
  {
    id: 202,
    source: 'tencent',
    sourceLabel: '腾讯会议',
    title: '远景工业 · 合同执行复盘',
    sourceTime: '昨天 16:20',
    customer: '远景工业设备有限公司',
    contact: '陈工 · 项目负责人',
    opportunity: '远景工业 CRM 续约项目',
    summary: '双方完成合同执行复盘，客户认可当前交付节奏。',
    needs: '需要补充售后服务数据看板。',
    customerCommitment: '客户确认下周提供售后数据字段清单。',
    salesCommitment: '销售安排产品顾问参与下一次评审。',
    nextStep: '跟进售后数据字段清单',
    taskOwner: '王敏',
    taskDue: '2026-08-30',
    taskDefinition: '完成字段清单核对并更新项目计划',
    status: '已写入',
    confidence: '高',
    evidence: '腾讯会议转写 00:35:10-00:42:06：客户确认下一阶段数据清单。',
  },
  {
    id: 203,
    source: 'chat',
    sourceLabel: '聊天截图',
    title: '聊天截图 · 待补充客户信息',
    sourceTime: '今天 09:48',
    customer: '',
    contact: '',
    opportunity: '',
    summary: '',
    needs: '',
    customerCommitment: '',
    salesCommitment: '',
    nextStep: '',
    taskOwner: '李明',
    taskDue: '',
    taskDefinition: '',
    status: '解析失败',
    confidence: '待确认',
    evidence: '截图中文字过小，无法稳定识别客户和联系人。',
  },
];

function sourceLabel(source: SourceType): string {
  return sourceMeta[source].label;
}

function statusColor(status: DraftStatus): string {
  if (status === '已写入') return 'success';
  if (status === '解析失败') return 'error';
  if (status === '处理中') return 'processing';
  return 'warning';
}

function makeDraft(source: SourceType, customer = ''): CommunicationDraft {
  const meta = sourceMeta[source];
  return {
    id: Date.now(),
    source,
    sourceLabel: meta.label,
    title: source === 'chat' ? '聊天截图 · 新沟通记录' : `${meta.label} · 新沟通记录`,
    sourceTime: '刚刚',
    customer,
    contact: '',
    opportunity: '',
    summary: 'AI 将根据来源内容生成沟通摘要。',
    needs: '',
    customerCommitment: '',
    salesCommitment: '',
    nextStep: '',
    taskOwner: '李明',
    taskDue: '',
    taskDefinition: '',
    status: '处理中',
    confidence: '待确认',
    evidence: '原始来源已接收，等待解析。',
  };
}

export function CommunicationWorkspace() {
  const [tab, setTab] = useState<WorkspaceTab>('new');
  const [drafts, setDrafts] = useState<CommunicationDraft[]>(demoDrafts);
  const [selectedDraft, setSelectedDraft] = useState<CommunicationDraft>();
  const [source, setSource] = useState<SourceType>('dingtalk');
  const [meeting, setMeeting] = useState('华东新材料 · 采购需求沟通');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [search, setSearch] = useState('');
  const [dingtalkAuthOpen, setDingtalkAuthOpen] = useState(false);
  const [dingtalkAuthState, setDingtalkAuthState] = useState<DingtalkAuthState>('ready');

  const selectedDingtalkMeeting = dingtalkMeetings.find((item) => item.value === meeting) ?? dingtalkMeetings[0];

  const visibleDrafts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return drafts;
    return drafts.filter((item) => `${item.title} ${item.sourceLabel} ${item.customer}`.toLowerCase().includes(keyword));
  }, [drafts, search]);

  const openDraft = (draft: CommunicationDraft) => setSelectedDraft(draft);
  const updateDraft = (updated: CommunicationDraft) => {
    setDrafts((items) => items.map((item) => item.id === updated.id ? updated : item));
    setSelectedDraft(updated);
  };

  const generateDraft = () => {
    if (source === 'chat' && files.length === 0) {
      message.warning('请先上传聊天截图');
      return;
    }
    if (source !== 'chat' && !meeting) {
      message.warning(`请选择${sourceLabel(source)}内容`);
      return;
    }
    if (source === 'dingtalk' && dingtalkAuthState !== 'ready') {
      message.warning('请先完成钉钉 AI 听记授权');
      setDingtalkAuthOpen(true);
      return;
    }
    if (source === 'dingtalk' && selectedDingtalkMeeting.status !== 'ready') {
      message.warning(selectedDingtalkMeeting.status === 'processing' ? '该会议听记仍在处理中，请稍后刷新' : '该会议只有日程，没有可读取的 AI 听记');
      return;
    }
    const next = { ...makeDraft(source), status: '待确认' as const };
    setDrafts((items) => [next, ...items]);
    setSelectedDraft(next);
    message.info('已接收来源，正在生成 AI 草稿');
  };

  return <div className="communication-workspace">
    <div className="communication-heading">
      <div>
        <TypographyBlock title="AI 沟通录入" description="把会议纪要和聊天截图转换为可确认的 CRM 跟进草稿。" />
      </div>
      <Space><Button type="link" onClick={() => setDingtalkAuthOpen(true)}>钉钉授权中心</Button><Tag color="blue">演示数据</Tag></Space>
    </div>
    <Card className="communication-source-card" bordered={false}>
      <div className="communication-stepper"><span className="is-active">1 来源</span><span>2 AI 草稿</span><span>3 CRM 写入</span></div>
      <Segmented block value={source} onChange={(value) => setSource(value as SourceType)} options={Object.entries(sourceMeta).map(([value, meta]) => ({ value, label: meta.label }))} />
      <div className="communication-source-grid">
        {source !== 'chat' ? <div className="communication-source-input">
          <div className="source-kicker">{sourceLabel(source)}来源</div>
          <h3>{source === 'dingtalk' ? (dingtalkAuthState === 'ready' ? '钉钉 AI 听记授权正常' : '钉钉 AI 听记需要处理授权') : '腾讯会议授权正常'}</h3>
          <p>{source === 'dingtalk' ? '仅展示当前用户有权限的 AI 听记；普通会议日程不会自动产生纪要。' : '仅展示当前账号授权范围内的会议纪要或转写。'}</p>
          <Select value={meeting} onChange={setMeeting} options={source === 'dingtalk' ? dingtalkMeetings.map((item) => ({ value: item.value, label: `${item.label} · ${item.statusLabel}`, disabled: item.status !== 'ready' })) : [{ value: '华东新材料 · 采购需求沟通', label: '今天 10:20 · 华东新材料 · 采购需求沟通', disabled: false }, { value: '远景工业 · 合同执行复盘', label: '昨天 16:20 · 远景工业 · 合同执行复盘', disabled: false }]} />
          {source === 'dingtalk' && <div className="communication-source-facts"><span>匹配依据：会议标题 + 开始时间</span><span>内容状态：<b className={selectedDingtalkMeeting.status === 'ready' ? 'is-ready' : 'is-pending'}>{selectedDingtalkMeeting.statusLabel}</b></span>{selectedDingtalkMeeting.taskUuid && <span>来源标识：{selectedDingtalkMeeting.taskUuid}</span>}</div>}
          {source === 'dingtalk' ? <Space><Button className="source-secondary-button" onClick={() => setDingtalkAuthOpen(true)}>授权详情</Button><Button type="link" onClick={() => message.info('会议列表刷新仅作原型演示')}>刷新会议列表</Button></Space> : <Button className="source-secondary-button" onClick={() => message.info(`${sourceLabel(source)}授权配置仅作原型演示`)}>重新授权</Button>}
        </div> : <div className="communication-source-input">
          <div className="source-kicker">聊天截图来源</div>
          <h3>销售主动上传截图</h3>
          <p>支持钉钉或企业微信聊天截图，AI 只处理本次主动提交的图片。</p>
          <Upload accept="image/*" multiple fileList={files} beforeUpload={() => false} onChange={({ fileList }) => setFiles(fileList)} listType="picture-card"><button className="communication-upload-trigger" type="button">上传截图</button></Upload>
        </div>}
        <div className="communication-source-note">
          <div className="source-kicker">写入边界</div>
          <ul><li>AI 只生成草稿，不直接成为 CRM 事实。</li><li>客户、联系人、商机需核对候选对象。</li><li>负责人、阶段、金额等字段不会自动修改。</li></ul>
        </div>
      </div>
      <div className="communication-source-actions"><Button type="primary" onClick={generateDraft}>生成 AI 草稿</Button><span>来源内容将保留，可在确认前查看证据。</span></div>
    </Card>
    <Card className="communication-record-card" bordered={false}>
      <div className="communication-record-header"><Segmented value={tab} onChange={(value) => setTab(value as WorkspaceTab)} options={[{ value: 'new', label: '新建录入' }, { value: 'drafts', label: `我的草稿 (${drafts.filter((item) => item.status === '待确认' || item.status === '处理中').length})` }, { value: 'history', label: '处理记录' }]} /><Input allowClear value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索来源或客户" className="communication-search" /></div>
      {tab === 'new' && <CommunicationOverview drafts={visibleDrafts.slice(0, 3)} onOpen={openDraft} />}
      {tab === 'drafts' && <CommunicationDraftList drafts={visibleDrafts.filter((item) => item.status === '待确认' || item.status === '处理中')} onOpen={openDraft} />}
      {tab === 'history' && <CommunicationDraftList drafts={visibleDrafts.filter((item) => item.status === '已写入' || item.status === '解析失败')} onOpen={openDraft} />}
    </Card>
    <CommunicationDraftDrawer draft={selectedDraft} onClose={() => setSelectedDraft(undefined)} onChange={updateDraft} />
    <DingtalkAuthorizationModal open={dingtalkAuthOpen} state={dingtalkAuthState} onStateChange={setDingtalkAuthState} onClose={() => setDingtalkAuthOpen(false)} />
  </div>;
}

function TypographyBlock({ title, description }: { title: string; description: string }) {
  return <><h1 className="communication-title">{title}</h1><p className="communication-description">{description}</p></>;
}

function CommunicationOverview({ drafts, onOpen }: { drafts: CommunicationDraft[]; onOpen: (draft: CommunicationDraft) => void }) {
  return <div className="communication-overview"><div className="communication-overview-intro"><span className="communication-overview-mark">沟通证据</span><strong>从来源到 CRM 写入，当前状态一目了然</strong><p>先选择来源生成草稿，再由销售确认客户、联系人、商机及下一步行动。</p></div><List dataSource={drafts} renderItem={(draft) => <List.Item actions={[<Button key="open" type="link" onClick={() => onOpen(draft)}>{draft.status === '已写入' ? '查看结果' : '继续确认'}</Button>]}><List.Item.Meta title={<Space><span>{draft.title}</span><Tag color={statusColor(draft.status)}>{draft.status}</Tag></Space>} description={`${draft.sourceLabel} · ${draft.sourceTime} · ${draft.customer || '待匹配客户'}`} /></List.Item>} /></div>;
}

function CommunicationDraftList({ drafts, onOpen }: { drafts: CommunicationDraft[]; onOpen: (draft: CommunicationDraft) => void }) {
  if (!drafts.length) return <Empty className="communication-empty" description="暂无处理记录" />;
  return <List className="communication-draft-list" dataSource={drafts} renderItem={(draft) => <List.Item actions={[<Button key="open" type="link" onClick={() => onOpen(draft)}>查看</Button>]}><List.Item.Meta title={<Space><span>{draft.title}</span><Tag color={statusColor(draft.status)}>{draft.status}</Tag></Space>} description={`${draft.sourceLabel} · ${draft.sourceTime} · ${draft.customer || '客户待确认'}`} /></List.Item>} />;
}

function DingtalkAuthorizationModal({ open, state, onStateChange, onClose }: { open: boolean; state: DingtalkAuthState; onStateChange: (state: DingtalkAuthState) => void; onClose: () => void }) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [memberAuthorized, setMemberAuthorized] = useState(false);
  const stateMeta: Record<DingtalkAuthState, { label: string; color: string; description: string }> = {
    ready: { label: '可读取', color: 'success', description: '应用已获组织授权，当前用户也已完成委托授权。' },
    adminPending: { label: '待管理员授权', color: 'warning', description: '需要企业管理员在钉钉开放平台批准会议听记相关能力。' },
    userPending: { label: '待用户授权', color: 'warning', description: '企业管理员已同意应用接入，请当前销售确认允许 CRM 读取本人可访问的 AI 听记。' },
    expired: { label: '授权已过期', color: 'error', description: '授权凭证已失效，需要重新完成用户授权。' },
    denied: { label: '无权限', color: 'error', description: '当前听记未由本人创建，且未被创建者共享。' },
  };
  const current = stateMeta[state];
  const authAction = () => {
    if (state === 'adminPending') {
      onStateChange('userPending');
      message.info('演示：管理员授权已完成，请当前销售继续完成用户授权');
      return;
    }
    if (state === 'userPending' || state === 'expired') {
      if (state === 'userPending' && !consentChecked) {
        message.warning('请先阅读并同意授权范围');
        return;
      }
      onStateChange('ready');
      setConsentChecked(false);
      setMemberAuthorized(state === 'userPending');
      message.success('个人授权完成，已可读取当前用户有权限的听记');
      return;
    }
    if (state === 'denied') {
      message.info('请由听记创建者在钉钉听记中共享后，再回到这里检查权限');
      return;
    }
    message.success('当前授权有效，可读取当前用户有权限的听记');
  };
  const actionLabel = state === 'adminPending' ? '模拟管理员授权' : state === 'userPending' ? '同意并继续' : state === 'expired' ? '重新授权' : state === 'denied' ? '查看共享指引' : '检查授权';

  return <Modal title={state === 'userPending' ? '钉钉 AI 听记 · 个人授权' : '钉钉 AI 听记授权中心'} open={open} onCancel={onClose} width={680} footer={<Space><Button onClick={onClose}>{state === 'userPending' ? '暂不授权' : '关闭'}</Button><Button type="primary" disabled={state === 'userPending' && !consentChecked} onClick={authAction}>{actionLabel}</Button></Space>}>
    <div className="dingtalk-auth-summary"><Tag color={current.color}>{current.label}</Tag><span>{current.description}</span></div>
    <div className="dingtalk-auth-steps">
      <div className={state === 'adminPending' ? 'is-current' : 'is-done'}><b>1</b><div><strong>企业管理员授权应用</strong><p>批准 CRM 应用访问组织内已开放的会议听记能力。</p></div></div>
      <div className={state === 'userPending' || state === 'expired' ? 'is-current' : state === 'denied' ? '' : 'is-done'}><b>2</b><div><strong>当前用户完成委托授权</strong><p>按当前用户身份读取本人创建或被共享的听记。</p></div></div>
      <div className={state === 'ready' ? 'is-done' : ''}><b>3</b><div><strong>读取会议内容</strong><p>先获取可访问听记列表，再按 taskUuid 获取摘要、关键词、待办或分页转写。</p></div></div>
    </div>
    {state === 'userPending' && <section className="dingtalk-member-consent" aria-label="普通成员个人授权确认">
      <div className="dingtalk-member-app"><div className="dingtalk-member-app-icon">CRM</div><div><strong>智能营销服 CRM</strong><span>申请读取你的钉钉 AI 听记</span></div></div>
      <div className="dingtalk-member-identity"><span>当前授权成员</span><strong>李明 · 销售一部</strong><Tag color="blue">华东新材料科技有限公司</Tag></div>
      <h3>授权后，CRM 可以：</h3>
      <ul><li>读取你创建的 AI 听记</li><li>读取他人明确共享给你的 AI 听记</li><li>获取听记标题、时间、摘要、待办和转写原文</li></ul>
      <Alert type="warning" showIcon message="CRM 不会读取你的普通聊天、日程之外的内容，也不会自动修改客户负责人、商机阶段或金额。" />
      <Checkbox checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)}>我已阅读并同意以上授权范围</Checkbox>
    </section>}
    {state === 'ready' && memberAuthorized && <section className="dingtalk-member-success" aria-label="普通成员授权成功"><div className="dingtalk-member-success-icon">✓</div><div><h3>个人授权已完成</h3><p>当前成员：李明 · 销售一部。CRM 现在可以读取你有权限的 AI 听记。</p><Space wrap><Tag color="success">授权有效</Tag><Tag color="blue">可读取摘要、待办和转写</Tag></Space></div></section>}
    <Descriptions className="dingtalk-auth-scope" size="small" column={1} bordered items={[
      { key: 'range', label: '可读取范围', children: '当前用户创建的听记 + 他人明确共享给当前用户的听记' },
      { key: 'content', label: '内容类型', children: <Space wrap><Tag>基础信息</Tag><Tag>AI 摘要</Tag><Tag>关键词</Tag><Tag>待办</Tag><Tag>转写原文</Tag></Space> },
      { key: 'notIncluded', label: '不自动包含', children: '仅有日程但未生成听记的会议、当前用户无权限的听记、未完成处理的录音内容' },
      { key: 'trace', label: '写入 CRM 前', children: '保留来源链接、taskUuid、来源时间和权限状态；AI 结果必须人工确认后写入' },
    ]} />
    <Alert className="dingtalk-auth-alert" type="info" showIcon message="原型中的授权检查、会议列表和内容读取均为演示数据；正式接入需在钉钉开放平台核对应用类型、管理员授权、用户授权及具体 scope。" />
    <div className="dingtalk-auth-demo"><span>演示异常状态</span><Select aria-label="演示异常状态" value={state} onChange={(next) => { setMemberAuthorized(false); setConsentChecked(false); onStateChange(next as DingtalkAuthState); }} options={[{ value: 'ready', label: '可读取' }, { value: 'adminPending', label: '待管理员授权' }, { value: 'userPending', label: '待用户授权' }, { value: 'expired', label: '授权已过期' }, { value: 'denied', label: '无权限' }]} /></div>
  </Modal>;
}

export function CommunicationEntryPanel({ customer, onFollowUp }: { customer?: Customer; onFollowUp: (type: FollowUpType, content: string) => void }) {
  const [source, setSource] = useState<SourceType>('dingtalk');
  const [meeting, setMeeting] = useState('华东新材料 · 采购需求沟通');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [draft, setDraft] = useState<CommunicationDraft>();
  const [dingtalkAuthOpen, setDingtalkAuthOpen] = useState(false);
  const [dingtalkAuthState, setDingtalkAuthState] = useState<DingtalkAuthState>('ready');
  const selectedMeeting = dingtalkMeetings.find((item) => item.value === meeting) ?? dingtalkMeetings[0];

  const generate = () => {
    if (source === 'chat' && !files.length) { message.warning('请先上传聊天截图'); return; }
    if (source !== 'chat' && !meeting) { message.warning('请选择会议内容'); return; }
    if (source === 'dingtalk' && dingtalkAuthState !== 'ready') { message.warning('请先完成钉钉 AI 听记授权'); setDingtalkAuthOpen(true); return; }
    if (source === 'dingtalk' && selectedMeeting.status !== 'ready') { message.warning(selectedMeeting.status === 'processing' ? '该会议听记仍在处理中，请稍后刷新' : '该会议只有日程，没有可读取的 AI 听记'); return; }
    const next = { ...makeDraft(source, customer?.name ?? ''), status: '待确认' as const };
    next.title = customer ? `${customer.name} · ${sourceLabel(source)}` : next.title;
    setDraft(next);
    message.info('已生成待确认草稿');
  };

  const commit = (updated: CommunicationDraft) => {
    setDraft(updated);
    if (updated.status === '已写入') {
      onFollowUp(updated.source === 'chat' ? '聊天' : '会议', `${updated.summary}\n客户需求：${updated.needs}\n下一步：${updated.nextStep}`);
    }
  };

  return <div className="communication-entry-panel">
    <div className="communication-entry-context"><span>当前客户</span><strong>{customer?.name ?? '待匹配客户'}</strong>{customer && <Tag color="blue">已带入</Tag>}</div>
    <Segmented block value={source} onChange={(value) => setSource(value as SourceType)} options={Object.entries(sourceMeta).map(([value, meta]) => ({ value, label: meta.label }))} />
    {source === 'chat' ? <Upload accept="image/*" multiple fileList={files} beforeUpload={() => false} onChange={({ fileList }) => setFiles(fileList)} listType="picture-card"><button className="communication-upload-trigger" type="button">上传聊天截图</button></Upload> : source === 'dingtalk' ? <><Select value={meeting} onChange={setMeeting} options={dingtalkMeetings.map((item) => ({ value: item.value, label: `${item.label} · ${item.statusLabel}`, disabled: item.status !== 'ready' }))} /><div className="communication-entry-facts"><span>来源：钉钉 AI 听记</span><span>状态：<b className={selectedMeeting.status === 'ready' ? 'is-ready' : 'is-pending'}>{selectedMeeting.statusLabel}</b></span><Button type="link" onClick={() => setDingtalkAuthOpen(true)}>{dingtalkAuthState === 'ready' ? '查看授权' : '处理授权'}</Button></div></> : <Select value={meeting} onChange={setMeeting} options={tencentMeetings} />}
    <Alert className="communication-guard-alert" type="info" showIcon message="AI 只生成草稿，确认后才写入跟进记录。" />
    <Button type="primary" block onClick={generate}>生成 AI 草稿</Button>
    <CommunicationDraftDrawer draft={draft} onClose={() => setDraft(undefined)} onChange={commit} />
    <DingtalkAuthorizationModal open={dingtalkAuthOpen} state={dingtalkAuthState} onStateChange={setDingtalkAuthState} onClose={() => setDingtalkAuthOpen(false)} />
  </div>;
}

function CommunicationDraftDrawer({ draft, onClose, onChange }: { draft?: CommunicationDraft; onClose: () => void; onChange: (draft: CommunicationDraft) => void }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState<CommunicationDraft>();
  const current = local?.id === draft?.id ? local : draft;

  if (!draft || !current) return null;
  const update = (patch: Partial<CommunicationDraft>) => { const next = { ...current, ...patch }; setLocal(next); onChange(next); };
  const confirm = () => {
    if (!current.customer) { message.warning('请先确认客户'); return; }
    if (!current.summary.trim()) { message.warning('请补充沟通摘要'); return; }
    setSaving(true);
    window.setTimeout(() => { setSaving(false); update({ status: '已写入', confidence: '高' }); message.success('跟进记录已写入，下一步任务已生成草稿'); }, 500);
  };

  return <Drawer className="communication-draft-drawer" title={<Space><span>AI 沟通草稿</span><Tag color={statusColor(current.status)}>{current.status}</Tag></Space>} open placement="right" size={window.innerWidth < 900 ? '100%' : 720} onClose={onClose} destroyOnClose footer={<Space style={{ width: '100%', justifyContent: 'flex-end' }}><Button onClick={onClose}>关闭</Button>{current.status !== '已写入' && <><Button onClick={() => { update({ status: '待确认' }); message.success('草稿已保存'); }}>保存草稿</Button><Button danger onClick={() => { update({ status: '解析失败' }); message.info('草稿已驳回'); }}>驳回</Button><Button type="primary" loading={saving} onClick={confirm}>确认并写入 CRM</Button></>}</Space>}>
    <div className="communication-draft-status"><span className="is-done">来源证据</span><span className={current.status !== '处理中' ? 'is-done' : ''}>AI 草稿</span><span className={current.status === '已写入' ? 'is-done' : ''}>CRM 写入</span></div>
    <Descriptions className="communication-draft-meta" size="small" column={2} bordered items={[{ key: 'source', label: '来源', children: current.sourceLabel }, { key: 'time', label: '来源时间', children: current.sourceTime }, { key: 'confidence', label: '匹配置信度', children: <Tag color={current.confidence === '高' ? 'success' : 'warning'}>{current.confidence}</Tag> }, { key: 'evidence', label: '证据', children: <Button type="link" onClick={() => setEvidenceOpen(true)}>查看原文依据</Button> }]} />
    <section className="communication-draft-section"><div className="communication-section-heading"><h3>CRM 对象关联</h3><span>必须核对</span></div><Select aria-label="客户" value={current.customer || undefined} placeholder="请选择客户" onChange={(value) => update({ customer: value })} options={[{ value: '华东新材料科技有限公司', label: '华东新材料科技有限公司' }, { value: '远景工业设备有限公司', label: '远景工业设备有限公司' }, { value: '北辰智能制造有限公司', label: '北辰智能制造有限公司' }]} /><Select aria-label="联系人" value={current.contact || undefined} placeholder="请选择联系人" onChange={(value) => update({ contact: value })} options={[{ value: '周敏 · 采购负责人', label: '周敏 · 采购负责人' }, { value: '陈工 · 项目负责人', label: '陈工 · 项目负责人' }]} /><Select aria-label="商机" value={current.opportunity || undefined} placeholder="请选择商机（可选）" onChange={(value) => update({ opportunity: value })} options={[{ value: '华东新材料数字化采购项目', label: '华东新材料数字化采购项目' }, { value: '远景工业 CRM 续约项目', label: '远景工业 CRM 续约项目' }]} /></section>
    <section className="communication-draft-section"><div className="communication-section-heading"><h3>跟进记录草稿</h3><span>销售可编辑</span></div><label>沟通摘要</label><Input.TextArea value={current.summary} onChange={(event) => update({ summary: event.target.value })} autoSize={{ minRows: 3, maxRows: 6 }} /><label>客户需求</label><Input.TextArea value={current.needs} onChange={(event) => update({ needs: event.target.value })} autoSize={{ minRows: 2, maxRows: 5 }} /><label>客户承诺</label><Input.TextArea value={current.customerCommitment} onChange={(event) => update({ customerCommitment: event.target.value })} autoSize={{ minRows: 2, maxRows: 4 }} /><label>销售承诺</label><Input.TextArea value={current.salesCommitment} onChange={(event) => update({ salesCommitment: event.target.value })} autoSize={{ minRows: 2, maxRows: 4 }} /></section>
    <section className="communication-draft-section"><div className="communication-section-heading"><h3>下一步任务草稿</h3><span>确认后创建</span></div><Input value={current.nextStep} onChange={(event) => update({ nextStep: event.target.value })} placeholder="任务内容" /><Space.Compact block><Select value={current.taskOwner} onChange={(value) => update({ taskOwner: value })} options={['李明', '王敏', '陈晨'].map((value) => ({ value }))} /><Input value={current.taskDue} onChange={(event) => update({ taskDue: event.target.value })} placeholder="截止日期，如 2026-08-28" /></Space.Compact><Input.TextArea value={current.taskDefinition} onChange={(event) => update({ taskDefinition: event.target.value })} autoSize={{ minRows: 2, maxRows: 4 }} placeholder="完成标准" /></section>
    <Alert type="warning" showIcon message="客户负责人、商机阶段、金额等字段不会由 AI 自动修改。" />
    <Modal title="来源证据" open={evidenceOpen} onCancel={() => setEvidenceOpen(false)} footer={<Button onClick={() => setEvidenceOpen(false)}>关闭</Button>}><p className="communication-evidence-text">{current.evidence}</p><p className="communication-evidence-muted">来源：{current.sourceLabel} · {current.sourceTime}。原始内容仅在当前用户有权限时展示。</p></Modal>
  </Drawer>;
}

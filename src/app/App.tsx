import { useEffect, useState } from 'react';
import { Button, ConfigProvider, Empty, Input, Layout, Menu, Space, Typography } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { CustomerWorkspace } from '../features/customers/components/CustomerWorkspace';
import { CommunicationWorkspace } from '../features/communication/CommunicationWorkspace';
import { FieldTrajectoryWorkspace } from '../features/field-trajectory/components/FieldTrajectoryWorkspace';
import { OrdersWorkspace } from '../features/orders/OrdersWorkspace';
import { ReceivablesWorkspace } from '../features/receivables/ReceivablesWorkspace';
import { CloseLegacySystemModal, MigrationWorkspace } from '../features/migration/MigrationWorkspace';
import { crmTheme } from './theme';
import { StatisticsFieldsPrototype } from '../features/statistics-fields/StatisticsFieldsPrototype';
import crmLogoUrl from '../assets/crm-logo.png';
import goalManagementHtml from '../features/goal-management/legacy/GoalManagementEmbedded.html?raw';

const { Header, Sider, Content } = Layout;
const embeddedGoalManagementHtml = goalManagementHtml
  .replace('<body>', '<body class="embedded-goal-management">')
  .replace('</head>', '<style>.embedded-goal-management .topbar{display:none!important}</style></head>');

export function App() {
  const [selectedModule, setSelectedModule] = useState(() => {
    const module = new URLSearchParams(window.location.search).get('module');
    if (module === 'statistics-fields' || window.location.pathname.endsWith('statistics-field-mvp.html')) return 'statistics-fields';
    return module === 'receivable' ? 'receivable' : 'customers';
  });
  const [topLevel, setTopLevel] = useState<'sales' | 'applications'>('sales');
  const [closeLegacyOpen, setCloseLegacyOpen] = useState(false);
  const [closeLegacyEnterprise, setCloseLegacyEnterprise] = useState('星河科技');
  const isFieldTrajectory = topLevel === 'sales' && selectedModule === 'field-trajectory';

  const isStatisticsFields = topLevel === 'sales' && selectedModule === 'statistics-fields';

  const openApplications = () => {
    setTopLevel('applications');
  };

  useEffect(() => {
    const handleLegacyNavigation = (event: MessageEvent) => {
      if (event.data?.type === 'crm:navigate' && event.data.target === 'sales') {
        setTopLevel('sales');
        setSelectedModule('customers');
      }
    };
    window.addEventListener('message', handleLegacyNavigation);
    return () => window.removeEventListener('message', handleLegacyNavigation);
  }, []);

  return <ConfigProvider locale={zhCN} theme={crmTheme}><Layout className={isFieldTrajectory ? 'crm-shell crm-shell-field' : 'crm-shell'}><Header className="crm-header"><div className="crm-brand"><img className="crm-logo" src={crmLogoUrl} alt="智能营销服" /></div><nav className="primary-nav" aria-label="主导航"><b onClick={() => setTopLevel('sales')}>首页</b><b onClick={() => setTopLevel('sales')}>营销</b><b className={topLevel === 'sales' && !isStatisticsFields ? 'current' : ''} onClick={() => { setTopLevel('sales'); if (isStatisticsFields) setSelectedModule('customers'); }}>销售</b><b>流程引擎</b><b>报表引擎</b><b className={topLevel === 'applications' ? 'current' : ''} onClick={openApplications}>应用中心</b></nav><div className="toolbar-spacer" /><Space className="header-tools"><span>营销版</span><span>返回旧版</span><span>客服与帮助</span><Button type="link" className="header-migration-action" onClick={() => { setCloseLegacyEnterprise('星河科技'); setCloseLegacyOpen(true); }}>关闭旧系统</Button><Button type="text" className={isStatisticsFields ? "sf-admin-entry" : undefined} onClick={() => { setTopLevel('sales'); setSelectedModule('statistics-fields'); }}>管理后台</Button></Space></Header>{topLevel === 'applications' ? <Content className="crm-content application-content legacy-goal-content"><iframe className="goal-management-frame" title="目标管理" srcDoc={embeddedGoalManagementHtml} /> </Content> : <Layout><Sider width={156} className="crm-sider"><Input className="sider-search" placeholder="请搜索" /><Menu mode="inline" selectedKeys={[selectedModule]} onClick={({ key }) => setSelectedModule(key)} items={isStatisticsFields ? [{ type: 'group', label: '表单管理', children: [{ key: 'statistics-fields', label: '客户' }, { key: 'admin-contacts', label: '联系人', disabled: true }, { key: 'admin-followup', label: '跟进记录', disabled: true }, { key: 'admin-contract', label: '合同', disabled: true }, { key: 'admin-payment', label: '回款', disabled: true }, { key: 'admin-visit', label: '外勤拜访', disabled: true }] }] : [{ type: 'group', label: '客户管理', children: [{ key: 'customers', label: '客户' }, { key: 'communication', label: 'AI 沟通录入' }, { key: 'contacts', label: '联系人' }, { key: 'follow-ups', label: '跟进记录' }, { key: 'pool', label: '客户公海' }, { key: 'statistics', label: '数据统计' }] }, { type: 'group', label: '外勤拜访', children: [{ key: 'field-trajectory', label: '外勤轨迹' }, { key: 'field-plan', label: '外勤计划' }, { key: 'field-record', label: '外勤记录' }] }, { type: 'group', label: '销售业务', children: [{ key: 'opportunity', label: '商机' }, { key: 'project', label: '项目' }, { key: 'orders', label: '订单' }, { key: 'contract', label: '合同' }, { key: 'receivable', label: '回款' }] }, { type: 'group', label: '系统管理', children: [{ key: 'statistics-fields', label: '表单管理' }, { key: 'migration', label: '企业迁移' }] }]} /></Sider><Content className={isFieldTrajectory ? 'crm-content crm-content-field' : 'crm-content'}>{selectedModule === 'statistics-fields' ? <StatisticsFieldsPrototype /> : selectedModule === 'customers' ? <CustomerWorkspace /> : selectedModule === 'communication' ? <CommunicationWorkspace /> : selectedModule === 'field-trajectory' ? <FieldTrajectoryWorkspace /> : selectedModule === 'orders' ? <OrdersWorkspace /> : selectedModule === 'receivable' ? <ReceivablesWorkspace /> : selectedModule === 'migration' ? <MigrationWorkspace onOpenCloseLegacy={(enterprise) => { setCloseLegacyEnterprise(enterprise?.name ?? '星河科技'); setCloseLegacyOpen(true); }} /> : <div className="crm-surface module-empty"><Empty description="功能演示范围仅含客户模块、沟通录入、订单、回款和外勤轨迹" /><Typography.Text type="secondary">可通过左侧菜单进入可交互的演示模块。</Typography.Text></div>}</Content></Layout>}</Layout><CloseLegacySystemModal open={closeLegacyOpen} enterpriseName={closeLegacyEnterprise} onCancel={() => setCloseLegacyOpen(false)} onSuccess={() => setCloseLegacyOpen(false)} /></ConfigProvider>;
}

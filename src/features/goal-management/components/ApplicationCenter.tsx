import { Button, Card, Empty, Typography } from 'antd';

export function ApplicationCenter({ onOpenGoals }: { onOpenGoals: () => void }) {
  return <div className="application-center">
    <header className="application-heading">
      <div><Typography.Title level={3}>应用中心</Typography.Title><Typography.Text type="secondary">按业务场景使用已启用的企业应用</Typography.Text></div>
    </header>
    <section className="application-section" aria-labelledby="business-applications"><div className="application-section-title"><span id="business-applications">业务应用</span></div><div className="application-grid">
      <Card className="application-card goal-application-card" hoverable onClick={onOpenGoals}>
        <div className="application-card-top"><span className="application-icon goal-icon">目</span><Button type="text" aria-label="打开目标管理" onClick={(event) => { event.stopPropagation(); onOpenGoals(); }}>打开</Button></div>
        <Typography.Title level={5}>目标管理</Typography.Title>
        <Typography.Paragraph type="secondary">配置团队与个人目标，查看周期达成、排名与风险提醒。</Typography.Paragraph>
        <div className="application-card-meta"><span>目标分析</span><span>目标设置</span></div>
      </Card>
    </div></section>
    <section className="application-section application-empty-section"><div className="application-section-title"><span>更多应用</span></div><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无其他已启用应用" /></section>
  </div>;
}

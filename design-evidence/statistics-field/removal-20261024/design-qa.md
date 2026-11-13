# 统计字段弹窗内容精简 QA

日期：2026-10-24

final result: passed

## 需求与证据

按最新红框截图删除关联说明、统计范围整块和效果预览。其余字段顺序、校验、统计方式下拉及保存行为保留。弹窗高度随剩余内容收缩。

- 来源：`design-evidence/statistics-field/removal-20261024/reference.png`。
- 实现：`design-evidence/statistics-field/removal-20261024/implementation-desktop.png`。
- 完整并排：`design-evidence/statistics-field/removal-20261024/comparison-desktop.jpg`。
- 弹窗局部并排：`design-evidence/statistics-field/removal-20261024/comparison-dialog.png`。
- 窄屏：`design-evidence/statistics-field/removal-20261024/implementation-mobile.png`。

来源与实现同为1920×958像素、CSS视口1920×958、截图有效密度1。两者均为合同／最小值／签约时间；来源弹窗已滚动，实现展示全部剩余字段，滚动位置与内容高度差异属于本次删除后的预期结果。完整并排尺寸3840×958；局部并排保持原比例并按弹窗顶部对齐，不把收缩高度作为漂移。

## 五项视觉检查

| 检查面 | 结果 |
| --- | --- |
| 字体 | 沿用系统字体、16px标题、14px正文和12px说明 |
| 间距与布局 | 520px宽、24px左右内边距、32px控件；删除区块无残留占位；弹窗高度从824收缩为656px，保持居中 |
| 色彩与令牌 | 原有#007FFF、白底、浅色边框和6px圆角保留 |
| 图像与图标 | 沿用Logo及图标；关联说明图标随说明一起删除 |
| 文案 | 仅移除红框内文案与控件；日期最小值说明位于红框外并保留 |

已打开完整及局部并排图，首次比较未发现P0/P1/P2问题，无需追加视觉修复。桌面及窄屏下无裁切、横向溢出或按钮遮挡。

## 交互与构建

- 新增弹窗不再显示来源关联说明、统计范围或效果预览。
- 选择合同／最小值／签约时间并保存成功，配置列表显示全部关联数据默认口径。
- 效果验证中客户A=2026-10-06 09:00，客户B=2026-10-12 11:00，无记录客户为空。
- 窄屏390×844：文档宽390，弹窗x=8、y=106、宽374、高632，所有剩余配置和按钮可见。
- `npm run build:offline` 通过，包括TypeScript检查；交付HTML和截图已同步更新。
- 低影响界面删除未新增单测；前次现有测试结果保存在历史报告，不记为本轮重测。

## 范围

仅调整原型界面，未新增生产系统能力。前次报告见 `design-evidence/statistics-field/revision-20261024/design-qa.md`。

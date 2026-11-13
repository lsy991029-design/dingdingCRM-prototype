import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CustomerWorkspace } from './CustomerWorkspace';

afterEach(() => cleanup());

describe('CustomerWorkspace', () => {
  it('filters customers and opens detail from a table row', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace />);
    await user.type(screen.getByPlaceholderText('请输入关键字搜索'), '云岭');
    expect(screen.getByText('云岭科技服务有限公司')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '查看云岭科技服务有限公司' }));
    expect(await screen.findAllByText('写跟进')).toHaveLength(2);
  });

  it('opens and closes the customer list guide drawer', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace />);
    await user.click(screen.getByRole('button', { name: '打开客户列表指南' }));
    expect(await screen.findByText('客户列表指南')).toBeInTheDocument();
    expect(screen.getByText('快速了解客户列表中的查询、视图和列配置能力。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('快速了解客户列表中的查询、视图和列配置能力。')).not.toBeInTheDocument();
  });

  it('keeps the default export confirmation on the primary action', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace />);
    await user.click(screen.getByRole('button', { name: /^导出$/ }));
    expect(await screen.findByText('导出企业客户')).toBeInTheDocument();
    expect(screen.getByText(/确定要导出当前范围内的 \d+ 条企业客户数据吗？/)).toBeInTheDocument();
    const imagesCheckbox = screen.getByRole('checkbox', { name: /同时导出数据中的图片/ });
    expect(imagesCheckbox).not.toBeChecked();
    await user.click(imagesCheckbox);
    await user.click(screen.getByRole('button', { name: '确认导出' }));
    expect(await screen.findByText('已创建包含图片的默认导出任务')).toBeInTheDocument();
  });

  it('shows only custom export in the dropdown menu', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace />);
    await user.click(screen.getByRole('button', { name: '导出选项' }));
    expect(await screen.findByText('自定义导出...')).toBeInTheDocument();
    expect(screen.queryByText('导出（默认）')).not.toBeInTheDocument();
    await user.click(screen.getByText('自定义导出...'));
    expect(await screen.findByText('导出数据')).toBeInTheDocument();
  });

  it('configures related forms and selects export fields without offering field sorting', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace />);
    await user.click(screen.getByRole('button', { name: '导出选项' }));
    await user.click(await screen.findByText('自定义导出...'));
    expect(await screen.findByText('导出数据')).toBeInTheDocument();
    expect(screen.getByText('确定要导出当前范围内的 2000 条企业客户数据吗？')).toBeInTheDocument();
    expect(screen.getByText('每 10,000 条数据将会生成一个 Excel 文档')).toBeInTheDocument();

    const exportScope = screen.getByText('导出范围').closest('section');
    expect(exportScope).not.toBeNull();
    expect(within(exportScope as HTMLElement).queryByText('表单数据为必选基础内容')).not.toBeInTheDocument();
    expect(within(exportScope as HTMLElement).getAllByRole('checkbox').map((checkbox) => checkbox.closest('label')?.textContent?.trim())).toEqual([
      '表单数据', '表单关联显示字段', '表单附件图片', '审批图片/附件', '关联表单',
    ]);

    expect(screen.queryByText('评论附件图片')).not.toBeInTheDocument();
    expect(screen.getByText('审批图片/附件')).toBeInTheDocument();
    expect(screen.getByText('表单关联显示字段')).toBeInTheDocument();
    expect(screen.queryByText('选中表单关联显示，导出文档将无法用于导入更新')).not.toBeInTheDocument();
    expect(screen.queryByText('关联表单数据将导出到独立工作表')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: '表单关联显示字段' }));
    expect(screen.getByText('选中表单关联显示，导出文档将无法用于导入更新')).toBeInTheDocument();
    expect(screen.getByText('选中表单关联显示，导出文档将无法用于导入更新').closest('.ant-alert')).toHaveClass('ant-alert-warning');
    expect(screen.getByText('系统字段')).toBeInTheDocument();
    expect(screen.getByText('基础信息')).toBeInTheDocument();
    expect(screen.getByText('自定义字段')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '全部' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: '折叠表单字段' }));
    expect(screen.queryByRole('group', { name: '可选导出字段' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '展开表单字段' }));
    await user.click(screen.getByRole('checkbox', { name: '关联表单' }));
    expect(await screen.findByText('关联表单类型')).toBeInTheDocument();
    const relatedFormGroup = screen.getByRole('group', { name: '关联表单范围' });
    const relatedFormCheckbox = within(relatedFormGroup).getByRole('checkbox', { name: '关联表单' });
    const relatedFormTypeLabel = within(relatedFormGroup).getByText('关联表单类型');
    expect(relatedFormCheckbox.compareDocumentPosition(relatedFormTypeLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelectorAll('.export-scope-alert.ant-alert-warning')).toHaveLength(1);
    expect(screen.getByText('联系人')).toBeInTheDocument();
    expect(screen.getByText('回款')).toBeInTheDocument();
    expect(screen.getByText('项目')).toBeInTheDocument();

    expect(screen.getByText('表格1')).toBeInTheDocument();
    expect(screen.getByText('关联表单1')).toBeInTheDocument();
    const availableFields = screen.getByRole('group', { name: '可选导出字段' });
    expect(screen.getByText('勾选需要导出的字段')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '已选字段' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /拖动排序/ })).not.toBeInTheDocument();
    expect(within(availableFields).getByRole('checkbox', { name: '数据 ID' })).toBeDisabled();

    await user.click(within(availableFields).getByRole('checkbox', { name: '客户名称' }));
    expect(screen.getByText('12/13 项已选择')).toBeInTheDocument();
    await user.click(within(availableFields).getByRole('checkbox', { name: '客户名称' }));
    expect(screen.getByText('13/13 项已选择')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('搜索字段'), '所属行业');
    expect(within(availableFields).getByRole('checkbox', { name: '所属行业' })).toBeChecked();
    expect(within(availableFields).queryByRole('checkbox', { name: '客户名称' })).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('搜索字段'));
    expect(within(availableFields).getByRole('checkbox', { name: '客户名称' })).toBeChecked();
  });
});

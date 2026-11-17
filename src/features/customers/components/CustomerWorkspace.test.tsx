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

  it('opens custom export directly from the export button', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace />);
    await user.click(screen.getByRole('button', { name: /^导出$/ }));
    expect(await screen.findByText('导出数据')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '展开自定义字段导出' })).toHaveTextContent('自定义字段导出');
    expect(screen.queryByRole('button', { name: '导出选项' })).not.toBeInTheDocument();
  });

  it('does not show an export mode dropdown', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace />);
    expect(screen.queryByRole('button', { name: '导出选项' })).not.toBeInTheDocument();
    expect(screen.queryByText('自定义导出...')).not.toBeInTheDocument();
  });

  it('shows selectable fields and an optional contacts checkbox', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace />);
    await user.click(screen.getByRole('button', { name: /^导出$/ }));
    expect(await screen.findByText('导出数据')).toBeInTheDocument();
    expect(screen.getByText('确定要导出当前范围内的 2000 条企业客户数据吗？')).toBeInTheDocument();
    expect(screen.getByText('每 10,000 条数据将会生成一个 Excel 文档')).toBeInTheDocument();

    expect(screen.queryByText('导出范围')).not.toBeInTheDocument();
    expect(screen.queryByText('表单数据')).not.toBeInTheDocument();
    expect(screen.queryByText('附件/图片')).not.toBeInTheDocument();
    expect(screen.queryByText('图片导出耗时较长，请耐心等待')).not.toBeInTheDocument();
    expect(screen.queryByText('其他')).not.toBeInTheDocument();
    const contactsOption = screen.getByRole('checkbox', { name: '导出客户关联的联系人' });
    expect(contactsOption).not.toBeChecked();
    const modalFooter = contactsOption.closest('.export-modal-footer');
    expect(modalFooter).not.toBeNull();
    expect(within(modalFooter as HTMLElement).getByRole('button', { name: /取\s*消/ })).toBeInTheDocument();
    expect(within(modalFooter as HTMLElement).getByRole('button', { name: '确认导出' })).toBeInTheDocument();
    await user.click(contactsOption);
    expect(contactsOption).toBeChecked();

    expect(screen.queryByText('表单关联显示字段')).not.toBeInTheDocument();
    expect(screen.queryByText('审批图片/附件')).not.toBeInTheDocument();
    expect(screen.queryByText('关联表单类型')).not.toBeInTheDocument();
    expect(screen.queryByText('系统字段')).not.toBeInTheDocument();
    expect(screen.queryByText('基础信息')).not.toBeInTheDocument();
    expect(screen.queryByText('自定义字段')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '展开自定义字段导出' })).toHaveTextContent('自定义字段导出');
    expect(screen.queryByRole('tree', { name: '可选导出字段' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '展开自定义字段导出' }));
    const availableFields = screen.getByRole('tree', { name: '可选导出字段' });
    const allFieldsCheckbox = within(availableFields).getByRole('checkbox', { name: '全部' });
    const idFieldCheckbox = within(availableFields).getByRole('checkbox', { name: '数据 ID' });
    expect(allFieldsCheckbox).toBeChecked();
    expect(idFieldCheckbox).toBeDisabled();
    expect(allFieldsCheckbox.compareDocumentPosition(idFieldCheckbox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(availableFields).getByRole('checkbox', { name: '客户名称' })).toBeChecked();
    await user.click(within(availableFields).getByRole('checkbox', { name: '客户名称' }));
    expect(within(availableFields).getByRole('checkbox', { name: '全部' })).toBePartiallyChecked();
    await user.click(within(availableFields).getByRole('checkbox', { name: '全部' }));
    expect(within(availableFields).getByRole('checkbox', { name: '客户名称' })).toBeChecked();
    await user.click(within(availableFields).getByRole('checkbox', { name: '全部' }));
    expect(within(availableFields).getByRole('checkbox', { name: '客户名称' })).not.toBeChecked();
    expect(within(availableFields).getByRole('checkbox', { name: '数据 ID' })).toBeChecked();
    await user.click(within(availableFields).getByRole('checkbox', { name: '全部' }));
    await user.click(screen.getByRole('button', { name: '收起自定义字段导出' }));
    expect(screen.queryByRole('tree', { name: '可选导出字段' })).not.toBeInTheDocument();
    expect(screen.queryByText('勾选需要导出的字段')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('搜索字段')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /拖动排序/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认导出' }));
    expect(await screen.findByText('正在生成导出文件')).toBeInTheDocument();
  });
});

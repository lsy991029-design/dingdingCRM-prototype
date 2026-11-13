import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ant-design/icons', () => {
  const Icon = () => null;
  return { CloseOutlined: Icon, DeleteOutlined: Icon, EditOutlined: Icon, HistoryOutlined: Icon, PlusOutlined: Icon, SaveOutlined: Icon };
});

import { OrdersWorkspace } from './OrdersWorkspace';

afterEach(() => cleanup());

describe('OrdersWorkspace', () => {
  it('opens the order detail and renders the change timeline', async () => {
    const user = userEvent.setup();
    render(<OrdersWorkspace />);
    await user.click(screen.getByRole('button', { name: /DDQQ202609170002/ }));
    await user.click(screen.getByRole('tab', { name: '订单动态' }));
    await user.click(screen.getByRole('tab', { name: '修改记录' }));
    expect(screen.getAllByText('修改产品明细字段')).toHaveLength(2);
    expect(screen.getByText('数量')).toBeInTheDocument();
  });

  it('records a cell edit after leaving the editable table', async () => {
    const user = userEvent.setup();
    render(<OrdersWorkspace />);
    await user.click(screen.getByRole('button', { name: /DDQQ202609170002/ }));
    const editButtons = screen.getAllByRole('button', { name: '编辑订单' });
    await user.click(editButtons[editButtons.length - 1]);
    const productInputs = screen.getAllByPlaceholderText('请输入');
    await user.clear(productInputs[0]);
    await user.type(productInputs[0], '069');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /取\s*消/ }));
    await user.click(screen.getByRole('tab', { name: '订单动态' }));
    await user.click(screen.getByRole('tab', { name: '修改记录' }));
    expect(screen.getAllByText('修改产品明细字段')).toHaveLength(3);
    expect(screen.getByText('069')).toBeInTheDocument();
  });
});

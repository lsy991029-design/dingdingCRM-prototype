import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationCenter } from './ApplicationCenter';

describe('ApplicationCenter', () => {
  it('opens goal management from its application card', async () => {
    const user = userEvent.setup();
    const onOpenGoals = vi.fn();
    render(<ApplicationCenter onOpenGoals={onOpenGoals} />);

    await user.click(screen.getByText('目标管理'));

    expect(onOpenGoals).toHaveBeenCalledOnce();
  });
});

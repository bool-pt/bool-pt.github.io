import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { InlineInputButton } from './InlineInputButton';

afterEach(cleanup);

const defaultProps = {
  value: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  label: 'Email address',
  placeholder: 'you@example.com',
  buttonText: 'Subscribe',
};

describe('InlineInputButton', () => {
  it('renders input and button with label', () => {
    render(<InlineInputButton {...defaultProps} />);
    expect(screen.getByLabelText('Email address')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeDefined();
  });

  it('calls onChange when typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<InlineInputButton {...defaultProps} onChange={onChange} />);
    await user.type(screen.getByLabelText('Email address'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('calls onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<InlineInputButton {...defaultProps} value="test@example.com" onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does not call onSubmit when value is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<InlineInputButton {...defaultProps} value="" onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit when disabled', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <InlineInputButton {...defaultProps} value="test@example.com" onSubmit={onSubmit} disabled />
    );
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

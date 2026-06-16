import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ModalHost from './ModalHost';

const modals = [{ key: 'demo', title: 'Demo Title', body: 'Demo body text' }];

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('ModalHost', () => {
  it('marks matching links with aria-haspopup on mount', () => {
    document.body.innerHTML = '<a href="modal:demo">open</a>';
    render(<ModalHost modals={modals} closeLabel="Close" />);
    expect(document.querySelector('a[href="modal:demo"]')?.getAttribute('aria-haspopup')).toBe(
      'dialog'
    );
  });

  it('opens the matching modal when an intercepted link is clicked', () => {
    document.body.innerHTML = '<a href="modal:demo">open</a>';
    render(<ModalHost modals={modals} closeLabel="Close" />);

    expect(screen.queryByText('Demo Title')).not.toBeInTheDocument();
    act(() => {
      (document.querySelector('a[href="modal:demo"]') as HTMLElement).click();
    });
    expect(screen.getByText('Demo Title')).toBeInTheDocument();
  });

  it('ignores links whose key has no registered modal', () => {
    document.body.innerHTML = '<a href="modal:missing">open</a>';
    render(<ModalHost modals={modals} closeLabel="Close" />);
    act(() => {
      (document.querySelector('a[href="modal:missing"]') as HTMLElement).click();
    });
    expect(screen.queryByText('Demo Title')).not.toBeInTheDocument();
  });
});

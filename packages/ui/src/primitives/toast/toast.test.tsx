import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';

afterEach(cleanup);

describe('Toast', () => {
  it('renders toast with title and description inside provider', () => {
    render(
      <ToastProvider>
        <Toast open={true}>
          <ToastTitle>Notification</ToastTitle>
          <ToastDescription>Something happened</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText('Notification')).toBeInTheDocument();
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });
});

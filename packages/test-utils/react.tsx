import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return {
    ...render(ui, { wrapper: AllProviders, ...options }),
    user: userEvent.setup(),
  };
}

export { customRender as render, userEvent };
export { screen, within, waitFor, act } from '@testing-library/react';

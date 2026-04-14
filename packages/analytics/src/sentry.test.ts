import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInit = vi.fn();
const mockCaptureException = vi.fn();
const mockSetUser = vi.fn();

vi.mock('@sentry/react', () => ({
  init: mockInit,
  captureException: mockCaptureException,
  setUser: mockSetUser,
}));

// Reset module state between tests (the `initialized` flag)
let initSentry: (dsn: string, options?: Record<string, unknown>) => Promise<void>;
let captureError: (error: unknown, context?: Record<string, unknown>) => void;
let setUser: (id: string, email?: string) => void;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  const mod = await import('./sentry.ts');
  initSentry = mod.initSentry;
  captureError = mod.captureError;
  setUser = mod.setUser;
});

describe('initSentry', () => {
  it('calls Sentry.init with dsn and options', async () => {
    await initSentry('https://key@sentry.io/123');
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://key@sentry.io/123' })
    );
  });

  it('does not initialize twice', async () => {
    await initSentry('https://key@sentry.io/123');
    await initSentry('https://key@sentry.io/123');
    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it('does not initialize with empty dsn', async () => {
    await initSentry('');
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('merges custom options', async () => {
    await initSentry('https://key@sentry.io/123', { tracesSampleRate: 0.5 });
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ tracesSampleRate: 0.5 }));
  });
});

describe('captureError', () => {
  it('calls captureException after initialization', async () => {
    await initSentry('https://key@sentry.io/123');
    captureError(new Error('test'), { page: '/home' });

    // Dynamic import is async — wait for the microtask
    await vi.dynamicImportSettled();
    expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: { page: '/home' },
    });
  });

  it('does nothing before initialization', () => {
    captureError(new Error('test'));
    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});

describe('setUser', () => {
  it('calls Sentry.setUser after initialization', async () => {
    await initSentry('https://key@sentry.io/123');
    setUser('user-1', 'test@example.com');

    await vi.dynamicImportSettled();
    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-1', email: 'test@example.com' });
  });

  it('does nothing before initialization', () => {
    setUser('user-1');
    expect(mockSetUser).not.toHaveBeenCalled();
  });
});

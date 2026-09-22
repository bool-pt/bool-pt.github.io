import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CookieBanner } from './CookieBanner';
import { useConsent } from './hooks';

vi.mock('@bool/i18n', () => ({
  t: vi.fn((key: string) => key),
}));

vi.mock('./consent', () => ({
  getConsent: vi.fn(() => null),
}));

const mockAccept = vi.fn();
const mockReject = vi.fn();
const mockSavePreferences = vi.fn();
const mockReset = vi.fn();

vi.mock('./hooks', () => ({
  useConsent: vi.fn(() => ({
    hasDecided: false,
    consent: null,
    accept: mockAccept,
    reject: mockReject,
    savePreferences: mockSavePreferences,
    reset: mockReset,
  })),
}));

const mockUseConsent = vi.mocked(useConsent);

function setupMock(overrides: Partial<ReturnType<typeof useConsent>> = {}) {
  mockUseConsent.mockReturnValue({
    hasDecided: false,
    consent: null,
    accept: mockAccept,
    reject: mockReject,
    savePreferences: mockSavePreferences,
    reset: mockReset,
    ...overrides,
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('CookieBanner', () => {
  it('returns null when hasDecided is true', () => {
    setupMock({ hasDecided: true });

    const { container } = render(<CookieBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('renders banner with message and buttons when hasDecided is false', () => {
    setupMock();

    render(<CookieBanner />);

    expect(screen.getByRole('region', { name: 'cookie.aria' })).toBeInTheDocument();
    expect(screen.getByText('cookie.message')).toBeInTheDocument();
  });

  it('calls accept when accept button is clicked', async () => {
    const user = userEvent.setup();
    setupMock();

    render(<CookieBanner />);

    await user.click(screen.getByText('cookie.accept'));

    expect(mockAccept).toHaveBeenCalledOnce();
  });

  it('calls reject when reject button is clicked', async () => {
    const user = userEvent.setup();
    setupMock();

    render(<CookieBanner />);

    await user.click(screen.getByText('cookie.reject'));

    expect(mockReject).toHaveBeenCalledOnce();
  });

  it('shows manage preferences view when manage button is clicked', async () => {
    const user = userEvent.setup();
    setupMock();

    render(<CookieBanner />);

    await user.click(screen.getByText('cookie.manage'));

    expect(screen.getByText('cookie.save')).toBeInTheDocument();
    expect(screen.getByText('cookie.back')).toBeInTheDocument();
    expect(screen.getByText('consent.essential.label')).toBeInTheDocument();
    expect(screen.getByText('consent.analytics.label')).toBeInTheDocument();
    expect(screen.getByText('consent.marketing.label')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3); // essential (locked) + analytics + marketing
    const essentialToggle = checkboxes[0];
    expect(essentialToggle).toBeChecked();
    expect(essentialToggle).toBeDisabled();
  });

  it('returns to initial view when back button is clicked', async () => {
    const user = userEvent.setup();
    setupMock();

    render(<CookieBanner />);

    await user.click(screen.getByText('cookie.manage'));
    await user.click(screen.getByText('cookie.back'));

    expect(screen.getByText('cookie.accept')).toBeInTheDocument();
    expect(screen.getByText('cookie.manage')).toBeInTheDocument();
  });

  it('calls savePreferences with toggled values when save is clicked', async () => {
    const user = userEvent.setup();
    setupMock();

    render(<CookieBanner />);

    await user.click(screen.getByText('cookie.manage'));

    const checkboxes = screen.getAllByRole('checkbox', { checked: false });
    await user.click(checkboxes[0]); // toggle analytics on (first non-essential checkbox)

    await user.click(screen.getByText('cookie.save'));

    expect(mockSavePreferences).toHaveBeenCalledWith({
      analytics: true,
      marketing: false,
    });
  });

  it('omits unconfigured tools from the descriptions (no tool named when no env var is set)', async () => {
    const user = userEvent.setup();
    setupMock();

    const { container } = render(<CookieBanner />);
    await user.click(screen.getByText('cookie.manage'));

    // With no PUBLIC_* tracker env vars set (the test default), no category
    // description may name a tool.
    expect(container.textContent).not.toContain('consent.tools.prefix');
    expect(container.textContent).not.toContain('consent.tools.sentry');
    expect(container.textContent).not.toContain('consent.tools.googleAnalytics');
    expect(container.textContent).not.toContain('consent.tools.linkedIn');
  });

  it('names a tool only when its env var is configured', async () => {
    vi.stubEnv('PUBLIC_SENTRY_DSN', 'https://key@sentry.io/1');
    const user = userEvent.setup();
    setupMock();

    const { container } = render(<CookieBanner />);
    await user.click(screen.getByText('cookie.manage'));

    expect(container.textContent).toContain('consent.tools.sentry');
    expect(container.textContent).toContain('consent.tools.prefix');
    // GA is still unconfigured, so it must not appear.
    expect(container.textContent).not.toContain('consent.tools.googleAnalytics');
  });

  it('names the LinkedIn Insight Tag under marketing, not analytics', async () => {
    vi.stubEnv('PUBLIC_LINKEDIN_PARTNER_ID', '10229265');
    vi.stubEnv('PUBLIC_SENTRY_DSN', '');
    const user = userEvent.setup();
    setupMock();

    render(<CookieBanner />);
    await user.click(screen.getByText('cookie.manage'));

    // The tag is ad-conversion tracking: it must be described under the category
    // that actually gates it, so a user rejecting marketing knows what they refused.
    const marketing = screen.getByText('consent.marketing.label').closest('label');
    const analytics = screen.getByText('consent.analytics.label').closest('label');
    expect(marketing?.textContent).toContain('consent.tools.linkedIn');
    expect(analytics?.textContent).not.toContain('consent.tools.linkedIn');
  });

  it('offers a marketing toggle, so the Insight Tag can be refused', async () => {
    const user = userEvent.setup();
    setupMock();

    render(<CookieBanner />);
    await user.click(screen.getByText('cookie.manage'));

    expect(screen.getByText('consent.marketing.label')).toBeInTheDocument();
  });

  it('opens preferences view when bool:open-preferences fires even if hasDecided is true', () => {
    setupMock({ hasDecided: true });

    render(<CookieBanner />);

    // Banner is hidden after consent
    expect(screen.queryByRole('region', { name: 'cookie.aria' })).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('bool:open-preferences'));
    });

    expect(screen.getByRole('region', { name: 'cookie.aria' })).toBeInTheDocument();
    expect(screen.getByText('cookie.save')).toBeInTheDocument();
    expect(screen.getByText('cookie.back')).toBeInTheDocument();
  });

  it('closes preferences panel (not initial view) when back is clicked after footer open', async () => {
    const user = userEvent.setup();
    setupMock({ hasDecided: true });

    render(<CookieBanner />);

    act(() => {
      window.dispatchEvent(new Event('bool:open-preferences'));
    });

    await user.click(screen.getByText('cookie.back'));

    expect(screen.queryByRole('region', { name: 'cookie.aria' })).not.toBeInTheDocument();
  });

  it('closes preferences panel after save when opened from footer', async () => {
    const user = userEvent.setup();
    setupMock({ hasDecided: true });

    render(<CookieBanner />);

    act(() => {
      window.dispatchEvent(new Event('bool:open-preferences'));
    });

    await user.click(screen.getByText('cookie.save'));

    expect(mockSavePreferences).toHaveBeenCalledOnce();
    expect(screen.queryByRole('region', { name: 'cookie.aria' })).not.toBeInTheDocument();
  });
});

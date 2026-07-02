import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import NewsletterForm from './NewsletterForm';

const { captchaReset } = vi.hoisted(() => ({ captchaReset: vi.fn() }));

// Keep the real ApiError export so the form's `err instanceof ApiError` check works.
vi.mock('@bool/api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  submitNewsletter: vi.fn(),
}));

vi.mock('@bool/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../Captcha/Captcha', async () => {
  const { useImperativeHandle } = await import('react');
  const MockCaptcha = ({
    onVerify,
    ref,
  }: {
    onVerify: (t: string) => void;
    ref?: React.Ref<{ reset: () => void; execute: () => Promise<string> }>;
  }) => {
    useImperativeHandle(ref, () => ({ reset: captchaReset, execute: () => Promise.resolve('') }));
    return (
      <button type="button" onClick={() => onVerify('test-token')}>
        Verify Captcha
      </button>
    );
  };
  return { default: MockCaptcha };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const labels = {
  subscribed: 'Subscribed!',
  loading: 'Sending...',
  ctaBar: 'Subscribe',
  ctaCta: 'Join',
  label: 'Email address',
  placeholder: 'your@email.com',
  nameLabel: 'Name',
  namePlaceholder: 'Name',
  nameRequired: 'Please enter your name',
  captchaRequired: 'Please complete the captcha',
  error: 'Something went wrong',
  consentBefore: 'I agree ',
  consentLinkText: 'Privacy Policy',
  consentAfter: '.',
  consentRequired: 'Please agree to continue',
};

describe('NewsletterForm', () => {
  it('renders name input, email input, and submit button', () => {
    render(<NewsletterForm captchaSiteKey="test-key" labels={labels} />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('shows name-needed message when submitting without name', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm captchaSiteKey="test-key" labels={labels} />);

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
  });

  it('shows consent-needed message when submitting without consent', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm captchaSiteKey="test-key" labels={labels} />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(screen.getByText('Please agree to continue')).toBeInTheDocument();
  });

  it('shows captcha-needed message when submitting with consent but without captcha', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm captchaSiteKey="test-key" labels={labels} />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(screen.getByText('Please complete the captcha')).toBeInTheDocument();
  });

  it('submits successfully and shows success text', async () => {
    const { submitNewsletter } = await import('@bool/api');
    vi.mocked(submitNewsletter).mockResolvedValueOnce(undefined as never);

    const user = userEvent.setup();
    render(<NewsletterForm captchaSiteKey="test-key" labels={labels} />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Verify Captcha' }));
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByRole('button', { name: 'Subscribed!' })).toBeInTheDocument();
    expect(vi.mocked(submitNewsletter)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'John Doe', email: 'test@example.com' })
    );
  });

  it('shows error message on API failure and resets the captcha', async () => {
    const { submitNewsletter } = await import('@bool/api');
    vi.mocked(submitNewsletter).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<NewsletterForm captchaSiteKey="test-key" labels={labels} />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Verify Captcha' }));
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(captchaReset).toHaveBeenCalled();
  });

  it('shows the error message even without a captcha site key', async () => {
    const { submitNewsletter } = await import('@bool/api');
    vi.mocked(submitNewsletter).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<NewsletterForm captchaSiteKey="" labels={labels} />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    // Regression: the error used to live inside the captcha block and stayed
    // hidden when no widget was mounted.
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows a distinct invalid-email message instead of the generic error', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm captchaSiteKey="test-key" labels={labels} />);

    // "test@nodot" passes the input's lax native type=email check (so the form
    // actually submits) but fails the stricter Zod schema — the gap where the
    // Zod email message is the one the user sees.
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email address'), 'test@nodot');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('maps a 403 to the captcha-needed message', async () => {
    const { submitNewsletter, ApiError } = await import('@bool/api');
    vi.mocked(submitNewsletter).mockRejectedValueOnce(
      new ApiError(403, { error: 'CAPTCHA validation failed. Please try again.' })
    );

    const user = userEvent.setup();
    render(<NewsletterForm captchaSiteKey="test-key" labels={labels} />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Verify Captcha' }));
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByText('Please complete the captcha')).toBeInTheDocument();
    expect(captchaReset).toHaveBeenCalled();
  });
});

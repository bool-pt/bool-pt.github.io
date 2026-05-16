import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import NewsletterForm from './NewsletterForm';

vi.mock('@bool/api', () => ({
  submitNewsletter: vi.fn(),
}));

vi.mock('@bool/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../Captcha/Captcha', () => ({
  default: ({ onVerify }: { onVerify: (t: string) => void }) => (
    <button type="button" onClick={() => onVerify('test-token')}>
      Verify Captcha
    </button>
  ),
}));

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

  it('shows error message on API failure', async () => {
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
  });
});

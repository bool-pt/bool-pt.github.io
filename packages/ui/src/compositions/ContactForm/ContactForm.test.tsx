import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { trackEvent } from '@bool/analytics';
import { submitContactForm } from '@bool/api';
import ContactForm from './ContactForm';

vi.mock('@bool/api', () => ({
  submitContactForm: vi.fn(() => Promise.resolve()),
}));

vi.mock('@bool/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../Captcha/Captcha', () => ({
  default: ({
    onVerify,
  }: {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    siteKey: string;
    theme?: string;
    ref?: React.Ref<unknown>;
  }) => {
    return <button type="button" data-testid="mock-captcha" onClick={() => onVerify('test-captcha-token')}>Verify</button>;
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const labels = {
  formAria: 'Contact form',
  name: 'Name',
  namePlaceholder: 'Your name',
  firstName: 'First Name',
  firstNamePlaceholder: 'Your first name',
  lastName: 'Last Name',
  lastNamePlaceholder: 'Your last name',
  phone: 'Phone',
  phonePlaceholder: 'Your phone number',
  email: 'Email',
  emailPlaceholder: 'Your email',
  message: 'Message',
  messagePlaceholder: 'Your message',
  submit: 'Send',
  submitting: 'Sending...',
  success: 'Message sent successfully!',
  error: 'Something went wrong. Please try again.',
  captchaRequired: 'Please complete the captcha.',
};

describe('ContactForm', () => {
  it('renders full layout fields', () => {
    render(
      <ContactForm layout="full" captchaSiteKey="test-key" labels={labels} />,
    );

    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('renders simple layout fields', () => {
    render(
      <ContactForm layout="simple" captchaSiteKey="test-key" labels={labels} />,
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Last Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Phone')).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();

    render(
      <ContactForm layout="full" captchaSiteKey="" labels={labels} />,
    );

    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Last name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument();
    });
  });

  it('does not call API when captcha is not verified', async () => {
    const user = userEvent.setup();

    render(
      <ContactForm layout="simple" captchaSiteKey="test-key" labels={labels} />,
    );

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Message'), 'A test message long enough.');

    await user.click(screen.getByRole('button', { name: 'Send' }));

    // API should not be called when captcha token is missing
    expect(submitContactForm).not.toHaveBeenCalled();
  });

  it('submits successfully and shows success message', async () => {
    const user = userEvent.setup();

    render(
      <ContactForm layout="simple" captchaSiteKey="test-key" labels={labels} />,
    );

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Message'), 'This is a test message that is long enough.');

    // Click the mock captcha button to trigger onVerify
    await user.click(screen.getByTestId('mock-captcha'));

    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('Message sent successfully!')).toBeInTheDocument();
    });

    expect(submitContactForm).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      phone: undefined,
      message: 'This is a test message that is long enough.',
      captchaToken: 'test-captcha-token',
    });
    expect(trackEvent).toHaveBeenCalledWith('form_submission', { type: 'contact', layout: 'simple' });
  });

  it('shows error message when API call fails', async () => {
    const user = userEvent.setup();
    vi.mocked(submitContactForm).mockRejectedValueOnce(new Error('API Error'));

    render(
      <ContactForm layout="simple" captchaSiteKey="test-key" labels={labels} />,
    );

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Message'), 'This is a test message that is long enough.');

    await user.click(screen.getByTestId('mock-captcha'));
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('has correct aria-label on form', () => {
    render(
      <ContactForm layout="full" captchaSiteKey="test-key" labels={labels} />,
    );

    expect(screen.getByRole('form', { name: 'Contact form' })).toBeInTheDocument();
  });
});

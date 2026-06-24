import { cleanup, render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitEventSchedule } from '@bool/api';
import EventScheduleModal, { type EventScheduleLabels } from './EventScheduleModal';

vi.mock('@bool/api', () => ({
  submitEventSchedule: vi.fn(() => Promise.resolve()),
}));

vi.mock('@bool/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../../primitives/Icon/Icon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const labels: EventScheduleLabels = {
  eyebrow: 'Meet us there',
  subtitle: 'Fill in your details and we will confirm your slot.',
  close: 'Close',
  formAria: 'Event schedule form',
  fullName: 'Full Name',
  fullNamePlaceholder: 'Your full name',
  phone: 'Phone',
  phonePlaceholder: 'Your phone number',
  email: 'Email',
  emailPlaceholder: 'your@email.com',
  time: 'Preferred time',
  timePlaceholder: 'Select a time',
  timeOptions: ['09:00', '11:00', '14:00', '16:00'],
  message: 'Message',
  messagePlaceholder: 'Any additional notes',
  submit: 'Schedule',
  success: 'Your slot has been requested!',
  required: 'Required',
  emailInvalid: 'Invalid email',
  captchaRequired: 'Please complete the CAPTCHA.',
  error: 'Something went wrong. Please try again.',
};

function openModal(title = 'Test Event') {
  act(() => {
    window.dispatchEvent(new CustomEvent('bool:open-event-schedule', { detail: { title } }));
  });
}

describe('EventScheduleModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    expect(container.innerHTML).toBe('');
  });

  it('opens and displays the event title on bool:open-event-schedule', () => {
    render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    openModal('AI Summit 2025');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('AI Summit 2025')).toBeInTheDocument();
    expect(screen.getByText('Meet us there')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    openModal();

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred time')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
  });

  it('renders time select options', () => {
    render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    openModal();

    const select = screen.getByLabelText('Preferred time');
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('09:00');
    expect(options).toContain('14:00');
  });

  it('shows validation errors when required fields are empty on submit', async () => {
    const user = userEvent.setup();
    render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    openModal();

    await user.click(screen.getByRole('button', { name: 'Schedule' }));

    await waitFor(() => {
      expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
    });
  });

  it('shows invalid email error for malformed email', async () => {
    const user = userEvent.setup();
    render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    openModal();

    await user.type(screen.getByLabelText('Email'), 'notanemail');
    await user.click(screen.getByRole('button', { name: 'Schedule' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  it('shows success view after submitting a valid form', async () => {
    const user = userEvent.setup();
    render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    openModal('OutSystems NextStep 2026');

    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Phone'), '+351 912 345 678');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.selectOptions(screen.getByLabelText('Preferred time'), '11:00');
    await user.type(screen.getByLabelText('Message'), 'Looking forward to it.');

    await user.click(screen.getByRole('button', { name: 'Schedule' }));

    await waitFor(() => {
      expect(screen.getByText('Your slot has been requested!')).toBeInTheDocument();
    });
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(submitEventSchedule).toHaveBeenCalledWith({
      eventName: 'OutSystems NextStep 2026',
      name: 'Jane Doe',
      phone: '+351 912 345 678',
      email: 'jane@example.com',
      timeSuggestion: '11:00',
      message: 'Looking forward to it.',
      turnstileToken: '',
    });
  });

  it('closes when the X button is clicked', async () => {
    const user = userEvent.setup();
    render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    openModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('resets form when reopened after close', async () => {
    const user = userEvent.setup();
    render(<EventScheduleModal labels={labels} captchaSiteKey="" />);
    openModal('First Event');

    await user.type(screen.getByLabelText('Full Name'), 'John');
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    openModal('Second Event');

    expect(screen.getByLabelText('Full Name')).toHaveValue('');
    expect(screen.getByText('Second Event')).toBeInTheDocument();
  });
});

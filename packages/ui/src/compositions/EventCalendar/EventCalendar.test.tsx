import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import EventCalendar from './EventCalendar';

afterEach(cleanup);

const events = [
  {
    date: '2025-03-15',
    tag: 'Conference',
    tagColor: '#ff0000',
    title: 'React Summit — Day 1',
    description: 'Annual React conference',
  },
  {
    date: '2025-03-20',
    tag: 'Workshop',
    title: 'Astro Workshop — Hands-on',
    description: 'Building with Astro',
  },
];

const ariaLabels = { prevMonth: 'Previous month', nextMonth: 'Next month' };

describe('EventCalendar', () => {
  it('renders month/year header and day names', () => {
    render(<EventCalendar events={events} ariaLabels={ariaLabels} />);

    expect(screen.getByText('March 2025')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('renders correct number of day cells for the month', () => {
    render(<EventCalendar events={events} ariaLabels={ariaLabels} />);

    // March 2025 has 31 days
    for (let day = 1; day <= 31; day++) {
      expect(screen.getByLabelText(`March ${day}`)).toBeInTheDocument();
    }
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    render(<EventCalendar events={events} ariaLabels={ariaLabels} />);

    expect(screen.getByText('March 2025')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Next month'));

    expect(screen.getByText('April 2025')).toBeInTheDocument();
    // April has 30 days
    expect(screen.getByLabelText('April 30')).toBeInTheDocument();
    expect(screen.queryByLabelText('April 31')).not.toBeInTheDocument();
  });

  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    render(<EventCalendar events={events} ariaLabels={ariaLabels} />);

    expect(screen.getByText('March 2025')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Previous month'));

    expect(screen.getByText('February 2025')).toBeInTheDocument();
    // February 2025 has 28 days (not a leap year)
    expect(screen.getByLabelText('February 28')).toBeInTheDocument();
    expect(screen.queryByLabelText('February 29')).not.toBeInTheDocument();
  });

  it('wraps from January to previous December (year change)', async () => {
    const user = userEvent.setup();
    const januaryEvent = [
      {
        date: '2025-01-10',
        tag: 'Meetup',
        title: 'New Year Meetup',
        description: 'Kickoff',
      },
    ];

    render(<EventCalendar events={januaryEvent} ariaLabels={ariaLabels} />);

    expect(screen.getByText('January 2025')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Previous month'));

    expect(screen.getByText('December 2024')).toBeInTheDocument();
  });

  it('wraps from December to next January (year change)', async () => {
    const user = userEvent.setup();
    const decemberEvent = [
      {
        date: '2025-12-05',
        tag: 'Party',
        title: 'Holiday Party',
        description: 'End of year',
      },
    ];

    render(<EventCalendar events={decemberEvent} ariaLabels={ariaLabels} />);

    expect(screen.getByText('December 2025')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Next month'));

    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('clicking an event date shows the event preview', async () => {
    const user = userEvent.setup();
    render(<EventCalendar events={events} ariaLabels={ariaLabels} />);

    // The first event is pre-selected, so the preview should already be visible
    expect(screen.getByText(/Event Conference:/)).toBeInTheDocument();
    expect(screen.getByText(/React Summit/)).toBeInTheDocument();

    // Click the second event date
    await user.click(screen.getByLabelText('March 20'));

    expect(screen.getByText(/Event Workshop:/)).toBeInTheDocument();
    expect(screen.getByText(/Astro Workshop/)).toBeInTheDocument();
  });

  it('clicking a non-event date clears the preview', async () => {
    const user = userEvent.setup();
    render(<EventCalendar events={events} ariaLabels={ariaLabels} />);

    // Preview is visible for pre-selected first event
    expect(screen.getByText(/React Summit/)).toBeInTheDocument();

    // Click a date with no event
    await user.click(screen.getByLabelText('March 10'));

    expect(screen.queryByText(/React Summit/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Astro Workshop/)).not.toBeInTheDocument();
  });

  it('uses custom dayNames and monthNames when provided', () => {
    const customDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const customMonths = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    render(
      <EventCalendar
        events={events}
        ariaLabels={ariaLabels}
        dayNames={customDays}
        monthNames={customMonths}
      />
    );

    expect(screen.getByText('Março 2025')).toBeInTheDocument();
    expect(screen.getByText('Seg')).toBeInTheDocument();
    expect(screen.getByText('Dom')).toBeInTheDocument();
    // Aria labels also use custom month names
    expect(screen.getByLabelText('Março 15')).toBeInTheDocument();
  });
});

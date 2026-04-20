import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import styles from './EventCalendar.module.css';

interface CalendarEvent {
  date: string;
  tag?: string;
  tagColor?: string;
  title: string;
  description: string;
}

interface Props {
  events?: CalendarEvent[];
  ariaLabels?: { prevMonth: string; nextMonth: string };
  dayNames?: string[];
  monthNames?: string[];
  eventPrefix?: string;
  locale?: string;
}

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export default function EventCalendar({
  events = [],
  ariaLabels,
  dayNames,
  monthNames,
  eventPrefix,
  locale = 'en-GB',
}: Props) {
  const DAYS = dayNames ?? DEFAULT_DAYS;
  const MONTHS = monthNames ?? DEFAULT_MONTHS;
  const EVENT_PREFIX = eventPrefix ?? 'Event';
  const today = new Date();
  const firstEvent = events.length > 0 ? new Date(events[0].date) : today;
  const [currentMonth, setCurrentMonth] = useState(firstEvent.getMonth());
  const [currentYear, setCurrentYear] = useState(firstEvent.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(
    events.length > 0 ? new Date(events[0].date).getDate() : null
  );

  const eventDates = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const e of events) {
      const d = new Date(e.date);
      map.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, e.tagColor);
    }
    return map;
  }, [events]);

  const selectedEvent = useMemo(() => {
    if (selectedDate === null) return null;
    return (
      events.find((e) => {
        const d = new Date(e.date);
        return (
          d.getFullYear() === currentYear &&
          d.getMonth() === currentMonth &&
          d.getDate() === selectedDate
        );
      }) ?? null
    );
  }, [selectedDate, currentMonth, currentYear, events]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const isEventDay = (day: number) => eventDates.has(`${currentYear}-${currentMonth}-${day}`);
  const getEventColor = (day: number) => eventDates.get(`${currentYear}-${currentMonth}-${day}`);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          onClick={prevMonth}
          className={styles.navBtn}
          aria-label={ariaLabels?.prevMonth}
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <span className={styles.monthLabel}>
          {MONTHS[currentMonth]} {currentYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className={styles.navBtn}
          aria-label={ariaLabels?.nextMonth}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div className={styles.dayNames}>
        {DAYS.map((d) => (
          <span key={d} className={styles.dayName}>
            {d}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((day, i) => {
          const eventColor = day !== null ? getEventColor(day) : undefined;
          return (
            <button
              key={i}
              type="button"
              className={[
                styles.cell,
                day === null ? styles.cellEmpty : '',
                day !== null && isToday(day) ? styles.cellToday : '',
                day !== null && isEventDay(day) ? styles.cellEvent : '',
                day !== null && day === selectedDate ? styles.cellSelected : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={eventColor ? { backgroundColor: eventColor } : undefined}
              onClick={() => day !== null && setSelectedDate(day)}
              disabled={day === null}
              aria-label={day !== null ? `${MONTHS[currentMonth]} ${day}` : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedEvent && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <span
              className={styles.previewTag}
              style={
                selectedEvent.tagColor ? { backgroundColor: selectedEvent.tagColor } : undefined
              }
            >
              {selectedEvent.tag}
            </span>
            <span className={styles.previewDate}>
              {new Date(selectedEvent.date).toLocaleDateString(locale, {
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className={styles.previewTitle}>
            {EVENT_PREFIX} {selectedEvent.tag}: {selectedEvent.title.split('—')[0]?.trim()}
          </p>
        </div>
      )}
    </div>
  );
}

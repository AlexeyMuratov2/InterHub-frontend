import { useEffect, useMemo, useRef, useState } from 'react';
import { timeToMinutes } from '../../lib/timeUtils';
import type { ScheduleEvent } from '../../lib/schedule';
import './mobile-schedule-grid.css';

const SWIPE_THRESHOLD_PX = 48;

/** ISO day 1 = Monday … 7 = Sunday from yyyy-MM-dd */
function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00').getDay();
  return d === 0 ? 7 : d;
}

function addDaysIso(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export interface MobileScheduleGridProps {
  events: ScheduleEvent[];
  weekStart: string;
  anchorDate: string;
  weekRangeText: string;
  getDayLabel: (dayOfWeek: number) => string;
  formatTime?: (time: string) => string;
  getLessonTypeLabel?: (lessonType: string | null) => string;
  getCancelledLabel?: () => string;
  onEventClick?: (event: ScheduleEvent) => void;
  formatDayDate?: (isoDate: string) => string;
  /** Shown when the selected day has no lessons (week may still have lessons). */
  dayEmptyLabel?: string;
}

const defaultFormatTime = (s: string): string => (s ? (s.length >= 5 ? s.slice(0, 5) : s) : '');

export function MobileScheduleGrid({
  events,
  weekStart,
  anchorDate,
  weekRangeText,
  getDayLabel,
  formatTime = defaultFormatTime,
  getLessonTypeLabel,
  getCancelledLabel,
  onEventClick,
  formatDayDate,
  dayEmptyLabel = 'No lessons this day',
}: MobileScheduleGridProps) {
  const [selectedDay, setSelectedDay] = useState(() => getDayOfWeek(anchorDate));
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setSelectedDay(getDayOfWeek(anchorDate));
  }, [anchorDate, weekStart]);

  const dateForSelectedDay = useMemo(
    () => addDaysIso(weekStart, selectedDay - 1),
    [weekStart, selectedDay]
  );

  const dayEvents = useMemo(() => {
    const list = events.filter((e) => e.date === dateForSelectedDay);
    list.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    return list;
  }, [events, dateForSelectedDay]);

  const prevDay = () => setSelectedDay((d) => (d <= 1 ? 7 : d - 1));
  const nextDay = () => setSelectedDay((d) => (d >= 7 ? 1 : d + 1));

  return (
    <div
      className="mobile-schedule-grid"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start == null) return;
        const end = e.changedTouches[0]?.clientX;
        if (end == null) return;
        const dx = end - start;
        if (dx > SWIPE_THRESHOLD_PX) prevDay();
        else if (dx < -SWIPE_THRESHOLD_PX) nextDay();
      }}
    >
      <div className="mobile-schedule-grid__week-nav">
        <span className="mobile-schedule-grid__week-label">{weekRangeText}</span>
      </div>

      <div className="mobile-schedule-grid__day-tabs" role="tablist" aria-label="Week days">
        {([1, 2, 3, 4, 5, 6, 7] as const).map((d) => {
          const dateStr = addDaysIso(weekStart, d - 1);
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={selectedDay === d}
              className={
                'mobile-schedule-grid__day-tab' +
                (selectedDay === d ? ' mobile-schedule-grid__day-tab--active' : '')
              }
              onClick={() => setSelectedDay(d)}
            >
              <span>{getDayLabel(d)}</span>
              {formatDayDate && (
                <span className="mobile-schedule-grid__day-date">{formatDayDate(dateStr)}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mobile-schedule-grid__day-nav">
        <button type="button" onClick={prevDay}>
          ‹
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
          {getDayLabel(selectedDay)}
          {formatDayDate ? ` · ${formatDayDate(dateForSelectedDay)}` : null}
        </span>
        <button type="button" onClick={nextDay}>
          ›
        </button>
      </div>

      <div className="mobile-schedule-grid__list">
        {dayEvents.length === 0 ? (
          <div className="mobile-schedule-grid__empty">{dayEmptyLabel}</div>
        ) : (
          dayEvents.map((event) => {
            const chipLabel =
              getLessonTypeLabel != null
                ? getLessonTypeLabel(event.lessonType ?? null)
                : event.lessonType ?? '—';
            const cancelledLabel = getCancelledLabel?.() ?? 'Cancelled';
            const isCancelled = event.status === 'CANCELLED';
            const isDone = event.status === 'DONE';
            return (
              <button
                key={event.id}
                type="button"
                className={
                  'mobile-schedule-grid__card' +
                  (isCancelled ? ' mobile-schedule-grid__card--cancelled' : '') +
                  (isDone ? ' mobile-schedule-grid__card--done' : '')
                }
                onClick={() => onEventClick?.(event)}
                disabled={!onEventClick}
              >
                <div className="mobile-schedule-grid__card-top">
                  {chipLabel ? <span className="mobile-schedule-grid__chip">{chipLabel}</span> : null}
                  {isCancelled ? (
                    <span className="mobile-schedule-grid__chip">{cancelledLabel}</span>
                  ) : null}
                  <span className="mobile-schedule-grid__time">
                    {formatTime(event.startTime)}–{formatTime(event.endTime)}
                  </span>
                </div>
                <span className="mobile-schedule-grid__title">{event.title}</span>
                {event.subtitleLines?.length
                  ? event.subtitleLines.map((line, i) => (
                      <span key={i} className="mobile-schedule-grid__sub">
                        {line}
                      </span>
                    ))
                  : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

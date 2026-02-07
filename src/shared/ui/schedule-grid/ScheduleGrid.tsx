/**
 * Недельная сетка расписания (Пн–Вс, ось времени). «Глупый» компонент: принимает нормализованные события.
 */
import { useMemo } from 'react';
import { timeToMinutes, buildAxisRange, buildTimeTicks } from '../../lib/timeUtils';
import type { ScheduleEvent } from './types';
import '../schedule-grid.css';

/** ISO day of week from yyyy-MM-dd (1 = Monday, 7 = Sunday) */
function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00').getDay(); // 0=Sun .. 6=Sat
  return d === 0 ? 7 : d;
}

export interface ScheduleGridProps {
  /** События недели (дата в формате yyyy-MM-dd, время HH:mm:ss) */
  events: ScheduleEvent[];
  /** Подпись дня недели: getDayLabel(1) => "Mon" / "Пн" */
  getDayLabel: (dayOfWeek: number) => string;
  /** Форматирование времени для оси и карточек (например "09:00" из "09:00:00") */
  formatTime?: (time: string) => string;
  /** Подпись типа занятия для чипа: LECTURE/PRACTICE/LAB/SEMINAR или null (ручной) */
  getLessonTypeLabel?: (lessonType: string | null) => string;
  /** Подпись для бейджа "Отменено" при status === CANCELLED */
  getCancelledLabel?: () => string;
  /** Клик по карточке урока (event содержит meta: LessonForScheduleDto при маппинге из mapLessonsForScheduleToEvents) */
  onEventClick?: (event: ScheduleEvent) => void;
  /** Минимальное время оси в минутах от полуночи при отсутствии событий (по умолчанию 8*60) */
  defaultAxisMin?: number;
  /** Максимальное время оси в минутах при отсутствии событий (по умолчанию 20*60) */
  defaultAxisMax?: number;
  /** Высота контейнера сетки (например "400px" или "60vh") */
  height?: string;
}

const defaultFormatTime = (s: string): string => (s ? (s.length >= 5 ? s.slice(0, 5) : s) : '');

export function ScheduleGrid({
  events,
  getDayLabel,
  formatTime = defaultFormatTime,
  getLessonTypeLabel,
  getCancelledLabel,
  onEventClick,
  defaultAxisMin = 8 * 60,
  defaultAxisMax = 20 * 60, // 08:00–20:00 when no events
  height = '480px',
}: ScheduleGridProps) {
  const { axisMin, axisMax, totalMinutes, ticks, eventsByDayWithLanes } = useMemo(() => {
    const slots = events.map((e) => ({
      start: timeToMinutes(e.startTime),
      end: timeToMinutes(e.endTime),
    }));
    const range = slots.length > 0
      ? buildAxisRange(slots, 30)
      : { axisMin: defaultAxisMin, axisMax: defaultAxisMax };
    const total = range.axisMax - range.axisMin;
    const ticks = buildTimeTicks(range.axisMin, range.axisMax, total);

    // По дням 1..7: события с назначенным lane (чтобы не накладываться)
    const byDay = new Map<number, ScheduleEvent[]>();
    for (let d = 1; d <= 7; d++) byDay.set(d, []);
    for (const e of events) {
      const day = getDayOfWeek(e.date);
      const list = byDay.get(day) ?? [];
      list.push(e);
      byDay.set(day, list);
    }

    // Для каждого дня назначаем lane: сортируем по start, жадно кладём в первый свободный lane
    const eventsByDayWithLanes: { day: number; event: ScheduleEvent; lane: number; totalLanes: number }[] = [];
    for (let day = 1; day <= 7; day++) {
      const list = byDay.get(day) ?? [];
      const sorted = [...list].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );
      type Slot = { end: number };
      const lanes: Slot[] = [];
      const dayItems: { event: ScheduleEvent; lane: number }[] = [];
      for (const event of sorted) {
        const start = timeToMinutes(event.startTime);
        const end = timeToMinutes(event.endTime);
        let laneIndex = 0;
        for (; laneIndex < lanes.length; laneIndex++) {
          if (lanes[laneIndex].end <= start) break;
        }
        if (laneIndex === lanes.length) lanes.push({ end });
        else lanes[laneIndex].end = end;
        dayItems.push({ event, lane: laneIndex });
      }
      const totalLanes = lanes.length;
      for (const { event, lane } of dayItems) {
        eventsByDayWithLanes.push({ day, event, lane, totalLanes: totalLanes || 1 });
      }
    }

    return {
      axisMin: range.axisMin,
      axisMax: range.axisMax,
      totalMinutes: total,
      ticks,
      eventsByDayWithLanes,
    };
  }, [events, defaultAxisMin, defaultAxisMax]);

  return (
    <div className="schedule-grid" style={{ height }}>
      <div className="schedule-grid__header">
        <div className="schedule-grid__time-header" aria-hidden="true">
          {' '}
        </div>
        {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
          <div key={day} className="schedule-grid__day-header" data-weekend={day >= 6 ? 'true' : undefined}>
            {getDayLabel(day)}
          </div>
        ))}
      </div>
      <div className="schedule-grid__body">
        <div
          className="schedule-grid__grid"
          style={{
            minHeight: '100%',
            gridTemplateRows: `auto 1fr`,
          }}
        >
          <div className="schedule-grid__time-col" style={{ gridRow: '1' }}>
            <div className="schedule-grid__time-axis" style={{ height: 0 }} />
          </div>
          {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
            <div key={day} className="schedule-grid__day-col" style={{ gridRow: '1' }} />
          ))}

          <div
            className="schedule-grid__time-col"
            style={{
              gridRow: '2',
              position: 'relative',
              height: `${totalMinutes}px`,
              minHeight: `${totalMinutes}px`,
            }}
          >
            <div className="schedule-grid__time-axis" style={{ height: '100%' }}>
              {ticks.map((mins) => (
                <div
                  key={mins}
                  className="schedule-grid__time-label"
                  style={{
                    top: `${((mins - axisMin) / totalMinutes) * 100}%`,
                  }}
                >
                  {String(Math.floor(mins / 60)).padStart(2, '0')}:
                  {String(mins % 60).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>

          {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
            <div
              key={day}
              className="schedule-grid__day-col"
              data-weekend={day >= 6 ? 'true' : undefined}
              style={{
                gridRow: '2',
                position: 'relative',
                height: `${totalMinutes}px`,
                minHeight: `${totalMinutes}px`,
              }}
            >
              <div className="schedule-grid__grid-lines" aria-hidden="true">
                {ticks.map((mins) => (
                  <div
                    key={mins}
                    className="schedule-grid__grid-line"
                    style={{
                      top: `${((mins - axisMin) / totalMinutes) * 100}%`,
                    }}
                  />
                ))}
              </div>
              <div className="schedule-grid__slots">
                {eventsByDayWithLanes
                  .filter((x) => x.day === day)
                  .map(({ event, lane, totalLanes }) => {
                    const startM = timeToMinutes(event.startTime);
                    const endM = timeToMinutes(event.endTime);
                    const topPct = ((startM - axisMin) / totalMinutes) * 100;
                    const heightPct = ((endM - startM) / totalMinutes) * 100;
                    const laneCount = Math.max(1, totalLanes);
                    const widthPct = 100 / laneCount;
                    const leftPct = lane * widthPct;
                    const isOverlap = totalLanes > 1;
                    const isCancelled = event.status === 'CANCELLED';
                    const isDone = event.status === 'DONE';
                    const chipLabel =
                      getLessonTypeLabel != null
                        ? getLessonTypeLabel(event.lessonType ?? null)
                        : event.lessonType ?? '—';
                    const cancelledLabel = getCancelledLabel?.() ?? 'Cancelled';
                    return (
                      <div
                        key={event.id}
                        role={onEventClick ? 'button' : undefined}
                        tabIndex={onEventClick ? 0 : undefined}
                        className={`schedule-grid__slot ${isOverlap ? 'schedule-grid__slot--overlap' : ''} ${isCancelled ? 'schedule-grid__slot--cancelled' : ''} ${isDone ? 'schedule-grid__slot--done' : ''} ${onEventClick ? 'schedule-grid__slot--clickable' : ''}`}
                        style={{
                          top: `${topPct}%`,
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                          boxSizing: 'border-box',
                        }}
                        title={event.title}
                        onClick={onEventClick ? () => onEventClick(event) : undefined}
                        onKeyDown={
                          onEventClick
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onEventClick(event);
                                }
                              }
                            : undefined
                        }
                      >
                        <div className="schedule-grid__slot-inner">
                          <div className="schedule-grid__slot-chip-wrap">
                            {chipLabel && (
                              <span className="schedule-grid__slot-chip">{chipLabel}</span>
                            )}
                            {isCancelled && (
                              <span className="schedule-grid__slot-badge schedule-grid__slot-chip">
                                {cancelledLabel}
                              </span>
                            )}
                          </div>
                          <span className="schedule-grid__slot-time">
                            {formatTime(event.startTime)}–{formatTime(event.endTime)}
                          </span>
                          <span className="schedule-grid__slot-title">{event.title}</span>
                          {event.subtitleLines?.length
                            ? event.subtitleLines.slice(0, 2).map((line, i) => (
                                <span key={i} className="schedule-grid__slot-subtitle">
                                  {line}
                                </span>
                              ))
                            : null}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

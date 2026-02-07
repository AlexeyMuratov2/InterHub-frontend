/**
 * ScheduleGrid — сетка недели (Пн–Вс) с осью времени и слотами поверх.
 *
 * Layout bug fix (slots overlapping):
 * - Root cause 1 (horizontal): .schedule-grid__slot had left/right/margin in CSS while TS set inline left/width,
 *   leading to over-constrained positioning and lane overflow. Fix: slot position/size only via inline
 *   left/width with calc() and --slot-gap; no left/right/margin in CSS.
 * - Root cause 2 (vertical): height used Math.max(minSlotHeightPx, proportionalHeight), so short slots
 *   could grow past their duration and overlap the next slot. Fix: height is strictly proportional to
 *   duration, clamped to [0, bodyHeightPx - top]; minSlotHeightPx is not used for height (visual spacing
 *   via box-shadow only).
 * - Identical days: axis and layout are computed once from the first day that has slots and reused for
 *   all days when slot counts match, so all 7 days share the same top/height/leftPct/widthPct.
 */
import type { ReactNode } from 'react';
import {
  timeToMinutes,
  durationMinutes,
  minutesToTime,
  buildAxisRange,
  buildTimeTicks,
  getTimeSegments,
} from '../lib/timeUtils';
import './schedule-grid.css';

export interface ScheduleGridSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ScheduleGridProps {
  slots: ScheduleGridSlot[];
  dayLabels: [string, string, string, string, string, string, string];
  rowHeightPx?: number;
  minSlotHeightPx?: number;
  maxHeight?: number;
  timeColumnLabel?: string;
  timeColumnWidth?: number;
  renderSlotContent?: (slot: ScheduleGridSlot, durationMinutes: number) => ReactNode;
  onSlotClick?: (id: string) => void;
  onDeleteSlot?: (id: string) => void;
  className?: string;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7] as const;
const PADDING_MINUTES = 30;
const DEFAULT_MAX_HEIGHT = 600;
const DEFAULT_ROW_HEIGHT_PX = 48;
const SLOT_GAP_PX = 6;

type SlotWithTime = { id: string; start: number; end: number; duration: number };

function parseSlot(slot: ScheduleGridSlot): SlotWithTime & { slot: ScheduleGridSlot } {
  const start = timeToMinutes(slot.startTime);
  const end = timeToMinutes(slot.endTime);
  const duration = durationMinutes(start, end);
  return { id: slot.id, start, end, duration, slot };
}

/** Пересечение [start, end) — без касания границ (end === other.start не считается) */
function intervalsOverlap(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Группирует слоты дня в "overlap groups" (connected components по пересечению) */
function groupOverlaps(slots: SlotWithTime[]): SlotWithTime[][] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => a.start - b.start || a.end - b.end);
  const groups: SlotWithTime[][] = [];
  let current: SlotWithTime[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    const overlapsCurrent = current.some((c) => intervalsOverlap(c, s));
    if (overlapsCurrent) {
      current.push(s);
    } else {
      groups.push(current);
      current = [s];
    }
  }
  groups.push(current);
  return groups;
}

/** Назначает lane и totalLanes внутри одной группы пересекающихся слотов */
function assignLanesInGroup(group: SlotWithTime[]): Map<string, { lane: number; totalLanes: number }> {
  const result = new Map<string, number>();
  const lanes: { end: number }[] = [];
  const sorted = [...group].sort((a, b) => a.start - b.start || a.end - b.end);

  for (const slot of sorted) {
    let lane = 0;
    while (lane < lanes.length && lanes[lane].end > slot.start) lane++;
    if (lane === lanes.length) lanes.push({ end: slot.end });
    else lanes[lane].end = slot.end;
    result.set(slot.id, lane);
  }
  const totalLanes = lanes.length;
  const out = new Map<string, { lane: number; totalLanes: number }>();
  result.forEach((lane, id) => out.set(id, { lane, totalLanes }));
  return out;
}

function buildAxisRangeFromSlots(slots: ScheduleGridSlot[]): { axisMin: number; axisMax: number; totalMinutes: number } {
  const parsed = slots.map((s) => ({ start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime) }));
  const { axisMin, axisMax } = buildAxisRange(parsed, PADDING_MINUTES);
  const totalMinutes = Math.max(1, axisMax - axisMin);
  return { axisMin, axisMax, totalMinutes };
}

function buildTimeTicksAndSegments(
  axisMin: number,
  axisMax: number,
  totalMinutes: number
): { ticks: number[]; segments: { start: number; end: number; duration: number }[] } {
  const ticks = buildTimeTicks(axisMin, axisMax, totalMinutes);
  const segments = getTimeSegments(ticks);
  return { ticks, segments };
}

/** Единое округление минут → px для совпадения оси времени и слотов */
function minutesToPxRounded(minutes: number, totalMinutes: number, bodyHeightPx: number): number {
  return Math.floor((minutes / totalMinutes) * bodyHeightPx);
}

function layoutSlots(
  daySlots: (SlotWithTime & { slot: ScheduleGridSlot })[],
  axisMin: number,
  bodyHeightPx: number,
  toPx: (minutes: number) => number
): Array<{ slot: ScheduleGridSlot; top: number; height: number; leftPct: number; widthPct: number; isOverlap: boolean }> {
  const byId = new Map(daySlots.map((s) => [s.id, s]));
  const groups = groupOverlaps(daySlots);
  const result: Array<{ slot: ScheduleGridSlot; top: number; height: number; leftPct: number; widthPct: number; isOverlap: boolean }> = [];

  for (const group of groups) {
    const laneMap = assignLanesInGroup(group);

    for (const item of group) {
      const slot = byId.get(item.id)!.slot;
      const startOffset = item.start - axisMin;
      const top = Math.max(0, Math.min(bodyHeightPx, toPx(startOffset)));
      const endPx = toPx(startOffset + item.duration);
      const maxHeight = Math.max(0, bodyHeightPx - top);
      const height = Math.max(0, Math.min(maxHeight, endPx - top));
      const { lane, totalLanes: tl } = laneMap.get(item.id) ?? { lane: 0, totalLanes: 1 };
      const leftPct = (lane / tl) * 100;
      const widthPct = 100 / tl;
      const isOverlap = tl > 1;
      result.push({ slot, top, height, leftPct, widthPct, isOverlap });
    }
  }
  return result;
}

function formatTimeRange(startTime: string, endTime: string): string {
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  return `${minutesToTime(s)}–${minutesToTime(e)}`;
}

export function ScheduleGrid({
  slots,
  dayLabels,
  rowHeightPx = DEFAULT_ROW_HEIGHT_PX,
  minSlotHeightPx = 0, // 0 = строго по длительности; >0 — минимум, но не больше границы следующего слота
  maxHeight = DEFAULT_MAX_HEIGHT,
  timeColumnLabel = 'Time',
  timeColumnWidth = 92,
  renderSlotContent,
  onSlotClick,
  onDeleteSlot,
  className = '',
}: ScheduleGridProps) {
  const slotsByDay = new Map<number, (SlotWithTime & { slot: ScheduleGridSlot })[]>();
  for (const slot of slots) {
    const parsed = parseSlot(slot);
    if (!slotsByDay.has(slot.dayOfWeek)) slotsByDay.set(slot.dayOfWeek, []);
    slotsByDay.get(slot.dayOfWeek)!.push(parsed);
  }
  // Единый порядок слотов по времени (для оптимизации "одинаковые дни")
  const sortSlots = (a: SlotWithTime & { slot: ScheduleGridSlot }, b: SlotWithTime & { slot: ScheduleGridSlot }) =>
    a.start - b.start || a.end - b.end || a.slot.id.localeCompare(b.slot.id);
  slotsByDay.forEach((daySlots) => daySlots.sort(sortSlots));

  const { axisMin, axisMax, totalMinutes } = buildAxisRangeFromSlots(slots);
  let bodyHeightPx = (totalMinutes / 60) * rowHeightPx;

  const minDurationMinutes =
    slots.length > 0
      ? Math.min(...slots.map((s) => durationMinutes(timeToMinutes(s.startTime), timeToMinutes(s.endTime))))
      : 60;
  if (slots.length > 0 && minSlotHeightPx > 0 && minDurationMinutes > 0) {
    const minSlotHeightNeeded = (minDurationMinutes / totalMinutes) * bodyHeightPx;
    if (minSlotHeightNeeded < minSlotHeightPx) {
      bodyHeightPx = Math.max(bodyHeightPx, (minSlotHeightPx * totalMinutes) / minDurationMinutes);
    }
  }

  const { segments } = buildTimeTicksAndSegments(axisMin, axisMax, totalMinutes);

  const hasSlots = slots.length > 0;
  const minutesToPxRoundedForLayout = (minutes: number) =>
    minutesToPxRounded(minutes, totalMinutes, bodyHeightPx);

  // Разметка один раз по первому дню со слотами — переиспользуем для всех дней при одинаковом числе слотов
  const firstDayWithSlots = DAY_ORDER.find((d) => (slotsByDay.get(d)?.length ?? 0) > 0);
  const templateDaySlots = firstDayWithSlots ? slotsByDay.get(firstDayWithSlots)! : [];
  const templateLayout =
    templateDaySlots.length > 0
      ? layoutSlots(templateDaySlots, axisMin, bodyHeightPx, minutesToPxRoundedForLayout)
      : [];

  return (
    <div
      className={`schedule-grid ${className}`.trim()}
      style={{
        maxHeight,
        ['--schedule-grid-time-col-width' as string]: `${timeColumnWidth}px`,
        ['--slot-gap' as string]: `${SLOT_GAP_PX}px`,
      }}
    >
      <div className="schedule-grid__header">
        <div className="schedule-grid__time-header">{hasSlots ? timeColumnLabel : ''}</div>
        {DAY_ORDER.map((d) => (
          <div key={d} className="schedule-grid__day-header">
            {dayLabels[d - 1]}
          </div>
        ))}
      </div>

      <div className="schedule-grid__body">
        <div
          className="schedule-grid__grid"
          style={{
            height: hasSlots ? bodyHeightPx : 120,
            gridTemplateRows: hasSlots ? `${bodyHeightPx}px` : '1fr',
          }}
        >
          <div className="schedule-grid__time-col">
            {hasSlots ? (
              segments.map((seg, i) => (
                <div
                  key={i}
                  className="schedule-grid__tick"
                  style={{ height: minutesToPxRoundedForLayout(seg.duration) }}
                >
                  {minutesToTime(seg.start)}
                </div>
              ))
            ) : (
              <div className="schedule-grid__tick schedule-grid__tick--empty" />
            )}
          </div>

          {DAY_ORDER.map((dayNum) => (
            <div key={dayNum} className="schedule-grid__day-col">
              {hasSlots && (
                <div className="schedule-grid__grid-lines">
                  {segments.map((seg, i) => (
                    <div
                      key={i}
                      className="schedule-grid__grid-line"
                      style={{
                        top: minutesToPxRoundedForLayout(seg.start - axisMin),
                        height: minutesToPxRoundedForLayout(seg.duration),
                      }}
                    />
                  ))}
                </div>
              )}
              {hasSlots && slotsByDay.get(dayNum) && (() => {
                const daySlots = slotsByDay.get(dayNum)!;
                const layout =
                  daySlots.length === templateLayout.length
                    ? daySlots.map((_, i) => ({ ...templateLayout[i], slot: daySlots[i].slot }))
                    : layoutSlots(daySlots, axisMin, bodyHeightPx, minutesToPxRoundedForLayout);
                return (
                <div className="schedule-grid__slots" style={{ height: bodyHeightPx }}>
                  {layout.map(({ slot, top, height, leftPct, widthPct, isOverlap }) => {
                    const parsed = parseSlot(slot);
                    const duration = parsed.duration;
                    return (
                      <div
                        key={slot.id}
                        role={onSlotClick ? 'button' : undefined}
                        tabIndex={onSlotClick ? 0 : undefined}
                        className={`schedule-grid__slot ${isOverlap ? 'schedule-grid__slot--overlap' : ''}`}
                        style={{
                          top,
                          height,
                          left: `calc(${leftPct}% + var(--slot-gap, 6px) / 2)`,
                          width: `calc(${widthPct}% - var(--slot-gap, 6px))`,
                        }}
                        onClick={onSlotClick ? () => onSlotClick(slot.id) : undefined}
                        onKeyDown={
                          onSlotClick
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onSlotClick(slot.id);
                                }
                              }
                            : undefined
                        }
                        title={formatTimeRange(slot.startTime, slot.endTime)}
                      >
                        <div className="schedule-grid__slot-inner">
                          {renderSlotContent ? (
                            renderSlotContent(slot, duration)
                          ) : (
                            <>
                              <span className="schedule-grid__slot-time">
                                {formatTimeRange(slot.startTime, slot.endTime)}
                              </span>
                              <span className="schedule-grid__slot-duration">
                                {duration >= 60 ? `${Math.floor(duration / 60)}h` : `${duration}m`}
                              </span>
                            </>
                          )}
                          {onDeleteSlot && (
                            <button
                              type="button"
                              className="schedule-grid__slot-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSlot(slot.id);
                              }}
                              aria-label="Delete slot"
                              title="Delete slot"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

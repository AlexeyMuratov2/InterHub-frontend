/** Парсит время "HH:mm" или "HH:mm:ss" в минуты от полуночи (0..24*60-1) */
export function timeToMinutes(s: string): number {
  const parts = s.trim().split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  const sec = parseInt(parts[2] ?? '0', 10);
  return h * 60 + m + Math.floor(sec / 60);
}

/** Минуты от полуночи в строку "HH:mm" */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = Math.floor(totalMinutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Длительность в минутах между startMinutes и endMinutes */
export function durationMinutes(startMinutes: number, endMinutes: number): number {
  return Math.max(0, endMinutes - startMinutes);
}

/** Границы времени из слотов (все уникальные start/end, отсортированы) — для динамической шкалы времени */
export function getTimeBoundaries(
  slots: { start: number; end: number }[]
): number[] {
  const set = new Set<number>();
  for (const s of slots) {
    set.add(s.start);
    set.add(s.end);
  }
  return Array.from(set).sort((a, b) => a - b);
}

/** Сегменты между последовательными границами (для строк таблицы с переменной высотой) */
export function getTimeSegments(boundaries: number[]): { start: number; end: number; duration: number }[] {
  const segments: { start: number; end: number; duration: number }[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    segments.push({ start, end, duration: end - start });
  }
  return segments;
}

const MINUTES_PER_DAY = 24 * 60;

/** Строит axisMin/axisMax по всем слотам недели + паддинг (мин), с ограничением 00:00..24:00 */
export function buildAxisRange(
  slots: { start: number; end: number }[],
  paddingMinutes: number = 30
): { axisMin: number; axisMax: number } {
  if (slots.length === 0) {
    return { axisMin: 8 * 60, axisMax: 18 * 60 };
  }
  let min = Math.min(...slots.map((s) => s.start));
  let max = Math.max(...slots.map((s) => s.end));
  min = Math.max(0, min - paddingMinutes);
  max = Math.min(MINUTES_PER_DAY, max + paddingMinutes);
  if (max <= min) max = min + 60;
  return { axisMin: min, axisMax: max };
}

/** Тики времени с шагом 20/30/60 мин в зависимости от длины оси (выше плотность — мельче шаг) */
export function buildTimeTicks(
  axisMin: number,
  axisMax: number,
  totalMinutes: number
): number[] {
  const ticks: number[] = [];
  const step =
    totalMinutes <= 120 ? 20 : totalMinutes <= 360 ? 30 : 60;
  const start = Math.floor(axisMin / step) * step;
  for (let t = start; t <= axisMax; t += step) {
    if (t >= axisMin) ticks.push(t);
  }
  if (ticks.length === 0 || ticks[ticks.length - 1] < axisMax) {
    ticks.push(axisMax);
  }
  return ticks;
}

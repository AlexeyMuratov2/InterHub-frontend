/** Возвращает понедельник ISO-недели для даты (yyyy-MM-dd) */
export function getIsoWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d.toISOString().slice(0, 10);
}

/** Возвращает воскресенье ISO-недели для даты (yyyy-MM-dd) */
export function getIsoWeekEnd(dateStr: string): string {
  const start = getIsoWeekStart(dateStr);
  const d = new Date(start + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

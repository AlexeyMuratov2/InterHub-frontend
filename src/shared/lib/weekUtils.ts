const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDateString(dateStr: string): boolean {
  if (!ISO_DATE_REGEX.test(dateStr)) return false;
  const d = new Date(dateStr + 'T12:00:00');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

/** Возвращает понедельник ISO-недели для даты (yyyy-MM-dd). При невалидной строке возвращает понедельник текущей недели. */
export function getIsoWeekStart(dateStr: string): string {
  const normalized = isValidIsoDateString(dateStr) ? dateStr : new Date().toISOString().slice(0, 10);
  const d = new Date(normalized + 'T12:00:00');
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

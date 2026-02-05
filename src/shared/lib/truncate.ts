/**
 * Обрезает строку до max символов с добавлением '…'.
 * Для null/пустой строки возвращает '—'.
 */
export function truncate(str: string | null, max: number): string {
  if (!str) return '—';
  return str.length <= max ? str : str.slice(0, max) + '…';
}

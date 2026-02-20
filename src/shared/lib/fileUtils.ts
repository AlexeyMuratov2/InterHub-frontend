/**
 * Форматирует размер файла в человекочитаемый вид (B, KB, MB).
 * Общая утилита для отображения размера файла в любом модуле.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

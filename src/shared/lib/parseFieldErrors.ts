/** Парсит details из ErrorResponse (VALIDATION_FAILED) в объект поле → сообщение для форм */
export function parseFieldErrors(
  details: Record<string, string> | string[] | undefined
): Record<string, string> {
  if (!details) return {};
  if (Array.isArray(details)) return {};
  return details as Record<string, string>;
}

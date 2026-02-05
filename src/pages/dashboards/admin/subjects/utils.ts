/** Парсит details из ErrorResponse в объект поле → сообщение для форм */
export function parseFieldErrors(
  details: Record<string, string> | string[] | undefined
): Record<string, string> {
  if (!details) return {};
  if (Array.isArray(details)) return {};
  return details as Record<string, string>;
}

export {
  getAssessmentTypeDisplayName,
  KNOWN_ASSESSMENT_TYPE_CODES,
  type KnownAssessmentTypeCode,
} from '../../../../shared/lib';

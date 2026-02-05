/** Коды стандартных типов контроля из БД — для них показываем перевод, а не код напрямую */
export const KNOWN_ASSESSMENT_TYPE_CODES = [
  'EXAM',
  'PASS',
  'DIFF_PASS',
  'COURSE_WORK',
  'COURSE_PROJECT',
  'MIDTERM',
  'TEST',
] as const;

export type KnownAssessmentTypeCode = (typeof KNOWN_ASSESSMENT_TYPE_CODES)[number];

function isKnownAssessmentTypeCode(code: string): code is KnownAssessmentTypeCode {
  return KNOWN_ASSESSMENT_TYPE_CODES.includes(code as KnownAssessmentTypeCode);
}

/**
 * Возвращает отображаемое название типа контроля:
 * для стандартных кодов (EXAM, PASS, …) — перевод по ключу assessmentTypeCode_<code>,
 * иначе — chineseName ?? englishName ?? code.
 */
export function getAssessmentTypeDisplayName(
  code: string,
  t: (key: string) => string,
  fallback?: { chineseName?: string | null; englishName?: string | null }
): string {
  if (isKnownAssessmentTypeCode(code)) {
    const key = `assessmentTypeCode_${code}`;
    const translated = t(key);
    return translated !== key ? translated : code;
  }
  if (fallback?.chineseName?.trim()) return fallback.chineseName.trim();
  if (fallback?.englishName?.trim()) return fallback.englishName.trim();
  return code;
}

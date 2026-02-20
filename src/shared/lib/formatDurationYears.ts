/**
 * Форматирует продолжительность в годах с правильным склонением
 * @param years - количество лет
 * @param t - функция локализации
 * @param locale - текущая локаль (опционально, для определения языка)
 */
export function formatDurationYears(
  years: number,
  t: (key: string) => string,
  locale?: string
): string {
  const yearsStr = String(years);
  const currentLocale = locale || 'ru';
  
  let unit: string;
  
  if (currentLocale.startsWith('ru')) {
    // Русское склонение - всегда проверяем склонение для русского языка
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      unit = 'лет';
    } else if (lastDigit === 1) {
      unit = 'год';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      unit = 'года';
    } else {
      unit = 'лет';
    }
  } else if (currentLocale.startsWith('zh')) {
    unit = '年';
  } else {
    // Английский и другие языки - пытаемся получить из локализации или используем дефолт
    const unitKey = 'curriculumDurationYearsUnit';
    unit = t(unitKey);
    if (!unit || unit === unitKey) {
      unit = years === 1 ? 'year' : 'years';
    }
  }
  
  return `${yearsStr} ${unit}`;
}

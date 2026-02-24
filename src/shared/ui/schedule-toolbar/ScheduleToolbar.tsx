/**
 * Общий тулбар для страниц расписания (неделя): выбор даты, диапазон недели, кнопки «Сегодня» / «Назад» / «Вперёд».
 * Переиспользуется на страницах расписания преподавателя и студента.
 * Обработчики onToday/onPrev/onNext задаются родителем (в т.ч. для синхронизации с sessionStorage).
 */
export interface ScheduleToolbarProps {
  anchorDate: string;
  onAnchorDateChange: (date: string) => void;
  weekRangeText: string;
  dateFormatAriaLabel: string;
  todayLabel: string;
  prevLabel: string;
  nextLabel: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ScheduleToolbar({
  anchorDate,
  onAnchorDateChange,
  weekRangeText,
  dateFormatAriaLabel,
  todayLabel,
  prevLabel,
  nextLabel,
  onToday,
  onPrev,
  onNext,
}: ScheduleToolbarProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') return;
    const d = new Date(v + 'T12:00:00');
    const normalized = d.toISOString().slice(0, 10);
    if (!Number.isNaN(d.getTime()) && normalized === v) {
      onAnchorDateChange(v);
    }
  };

  return (
    <div className="schedule-tab-toolbar">
      <input
        type="date"
        value={anchorDate}
        onChange={handleDateChange}
        aria-label={dateFormatAriaLabel}
      />
      <span className="schedule-tab-week-range">{weekRangeText}</span>
      <div className="schedule-tab-toolbar-buttons">
        <button type="button" className="btn-schedule-primary" onClick={onToday}>
          {todayLabel}
        </button>
        <button type="button" className="btn-schedule-secondary" onClick={onPrev} aria-label={prevLabel}>
          ‹ {prevLabel}
        </button>
        <button type="button" className="btn-schedule-secondary" onClick={onNext} aria-label={nextLabel}>
          {nextLabel} ›
        </button>
      </div>
    </div>
  );
}

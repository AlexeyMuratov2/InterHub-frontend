/**
 * Сетка таймслотов по дням недели: карточки по дням (Пн–Вс), внутри — слоты с временем.
 * Переиспользуется на странице настроек таймслотов и при выборе таймслота в офферинге.
 */

export interface TimeslotItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface TimeslotsByDayGridProps {
  /** Список таймслотов (будут сгруппированы по дню недели) */
  slots: TimeslotItem[];
  /** Подпись дня: getDayLabel(1) => "Понедельник" */
  getDayLabel: (dayOfWeek: number) => string;
  /** Текст, когда в дне нет слотов */
  emptyMessage: string;
  /** Клик по слоту (выбор или открытие детали) */
  onSlotClick: (slot: TimeslotItem) => void;
  /** Опционально: id выбранного слота для подсветки (режим выбора) */
  selectedId?: string | null;
  /** Форматирование времени для отображения, по умолчанию "HH:mm" */
  formatTime?: (time: string) => string;
  /** Aria-label для кнопки слота (доступность) */
  ariaLabelForSlot?: string;
}

const defaultFormatTime = (s: string): string => (s ? (s.length > 5 ? s.slice(0, 5) : s) : '');

export function TimeslotsByDayGrid({
  slots,
  getDayLabel,
  emptyMessage,
  onSlotClick,
  selectedId = null,
  formatTime = defaultFormatTime,
  ariaLabelForSlot,
}: TimeslotsByDayGridProps) {
  const slotsByDay = (() => {
    const map = new Map<number, TimeslotItem[]>();
    for (let d = 1; d <= 7; d++) {
      map.set(d, []);
    }
    for (const s of slots) {
      const list = map.get(s.dayOfWeek) ?? [];
      list.push(s);
      map.set(s.dayOfWeek, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));
    }
    return map;
  })();

  return (
    <div className="timeslots-by-day">
      {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => {
        const daySlots = slotsByDay.get(day) ?? [];
        const dayLabel = getDayLabel(day);
        return (
          <div key={day} className="timeslots-day-card">
            <h3 className="timeslots-day-title">{dayLabel}</h3>
            {daySlots.length === 0 ? (
              <p className="timeslots-day-empty">{emptyMessage}</p>
            ) : (
              <ul className="timeslots-day-list" role="list">
                {daySlots.map((slot) => (
                  <li key={slot.id}>
                    <button
                      type="button"
                      className={`timeslots-slot-button${selectedId === slot.id ? ' timeslots-slot-button--selected' : ''}`}
                      onClick={() => onSlotClick(slot)}
                      aria-label={ariaLabelForSlot ?? undefined}
                    >
                      <span className="timeslots-slot-time">
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

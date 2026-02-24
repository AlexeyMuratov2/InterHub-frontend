import type { SemesterDto } from '../../api';

export type SemesterFilterSelectProps = {
  /** Текст метки (например "Семестр") */
  label: string;
  /** Placeholder для пустой опции */
  placeholder: string;
  /** Текст для опции семестра, если нет name: например "Семестр {{number}}" */
  semesterOptionLabel?: (semester: SemesterDto) => string;
  /** Выбранный номер семестра или null */
  value: number | null;
  /** Обработчик смены (value пустая строка = null) */
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Список семестров для опций */
  options: SemesterDto[];
  /** id для select (для связи label) */
  id?: string;
  /** aria-label для select */
  ariaLabel?: string;
  /** Дополнительный класс для обёртки */
  className?: string;
};

/**
 * Общий селект фильтра по семестру для страниц предметов (преподаватель / студент).
 */
export function SemesterFilterSelect({
  label,
  placeholder,
  semesterOptionLabel,
  value,
  onChange,
  options,
  id = 'subjects-semester-filter',
  ariaLabel,
  className,
}: SemesterFilterSelectProps) {
  const optionLabel = (s: SemesterDto) =>
    semesterOptionLabel ? semesterOptionLabel(s) : (s.name ?? `№ ${s.number}`);

  return (
    <div className={className ?? 'subjects-semester-row'}>
      <label htmlFor={id}>{label}:</label>
      <select
        id={id}
        className="semester-filter-select"
        value={value == null ? '' : String(value)}
        onChange={onChange}
        aria-label={ariaLabel ?? placeholder}
      >
        <option value="">{placeholder}</option>
        {options.map((s) => (
          <option key={s.id} value={s.number}>
            {optionLabel(s)}
          </option>
        ))}
      </select>
    </div>
  );
}

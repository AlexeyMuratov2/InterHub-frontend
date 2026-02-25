/**
 * Reusable filters bar for absence requests: status select + date range.
 * Used on teacher and student absence requests pages with same visual style.
 */
import { useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface AbsenceRequestsFiltersBarProps {
  /** Current status filter value (e.g. '' | 'SUBMITTED') */
  statusValue: string;
  onStatusChange: (value: string) => void;
  /** Status options: [{ value: 'SUBMITTED', labelKey: 'absenceRequestsStatusPending' }, ...] */
  statusOptions: Array<{ value: string; labelKey: string }>;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  /** Optional: show subject select (teacher) */
  showSubjectSelect?: boolean;
  subjectValue?: string;
  onSubjectChange?: (value: string) => void;
  subjectOptions?: Array<{ value: string; label: string }>;
  subjectLabelKey?: string;
  /** Optional: show group select (teacher) */
  showGroupSelect?: boolean;
  groupValue?: string;
  onGroupChange?: (value: string) => void;
  groupOptions?: Array<{ value: string; label: string }>;
  groupLabelKey?: string;
  t: (key: string) => string;
}

export function AbsenceRequestsFiltersBar({
  statusValue,
  onStatusChange,
  statusOptions,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  showSubjectSelect = false,
  subjectValue = '',
  onSubjectChange,
  subjectOptions = [],
  subjectLabelKey = 'absenceRequestsFilterAllSubjects',
  showGroupSelect = false,
  groupValue = '',
  onGroupChange,
  groupOptions = [],
  groupLabelKey = 'absenceRequestsFilterAllGroups',
  t,
}: AbsenceRequestsFiltersBarProps) {
  const dateFromInputRef = useRef<HTMLInputElement>(null);
  const dateToInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absence-requests-filters-card">
      <div className="absence-requests-filters-inner">
        {showSubjectSelect && (
          <div className="absence-requests-filter-field absence-requests-filter-field--select">
            <select
              className="absence-requests-select"
              value={subjectValue}
              onChange={(e) => onSubjectChange?.(e.target.value)}
              aria-label={t(subjectLabelKey)}
            >
              <option value="">{t(subjectLabelKey)}</option>
              {subjectOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absence-requests-select-icon" aria-hidden />
          </div>
        )}
        {showGroupSelect && (
          <div className="absence-requests-filter-field absence-requests-filter-field--select">
            <select
              className="absence-requests-select"
              value={groupValue}
              onChange={(e) => onGroupChange?.(e.target.value)}
              aria-label={t(groupLabelKey)}
            >
              <option value="">{t(groupLabelKey)}</option>
              {groupOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absence-requests-select-icon" aria-hidden />
          </div>
        )}
        <div className="absence-requests-filter-field absence-requests-filter-field--select">
          <select
            className="absence-requests-select"
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label={t('absenceRequestsStatus')}
          >
            <option value="">{t('absenceRequestsFilterAllStatus')}</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
          <ChevronDown className="absence-requests-select-icon" aria-hidden />
        </div>
        <div className="absence-requests-filter-field absence-requests-filter-field--date">
          <input
            ref={dateFromInputRef}
            type="date"
            className="absence-requests-date-input"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            aria-label={t('absenceRequestsDateFrom')}
            id="absence-requests-date-from"
          />
          <button
            type="button"
            className="absence-requests-date-trigger"
            onClick={() => dateFromInputRef.current?.showPicker?.() ?? dateFromInputRef.current?.click()}
            aria-label={t('absenceRequestsDateFrom')}
            title={t('absenceRequestsDateFrom')}
          >
            <Calendar className="absence-requests-date-icon" aria-hidden />
          </button>
        </div>
        <div className="absence-requests-filter-field absence-requests-filter-field--date">
          <input
            ref={dateToInputRef}
            type="date"
            className="absence-requests-date-input"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            aria-label={t('absenceRequestsDateTo')}
            id="absence-requests-date-to"
          />
          <button
            type="button"
            className="absence-requests-date-trigger"
            onClick={() => dateToInputRef.current?.showPicker?.() ?? dateToInputRef.current?.click()}
            aria-label={t('absenceRequestsDateTo')}
            title={t('absenceRequestsDateTo')}
          >
            <Calendar className="absence-requests-date-icon" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

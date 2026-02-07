import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchGroups } from '../../../../entities/group';
import type { StudentGroupDto } from '../../../../entities/group';
import { fetchAcademicYears, fetchSemestersByYear } from '../../../../entities/academic';
import type { AcademicYearDto, SemesterDto } from '../../../../entities/academic';
import { useTranslation } from '../../../../shared/i18n';

export interface GroupSemesterPickerProps {
  /** Preselected group id (e.g. from query) */
  initialGroupId?: string | null;
  groupId: string | null;
  onGroupIdChange: (id: string | null) => void;
  semesterId: string | null;
  onSemesterIdChange: (id: string | null) => void;
  /** Вызывается при смене выбранного семестра (для отображения названия/номера и фильтра предметов по semesterNo) */
  onSemesterChange?: (semester: SemesterDto | null) => void;
  courseFilter: number | '';
  onCourseFilterChange: (value: number | '') => void;
  disabled?: boolean;
}

export function GroupSemesterPicker({
  initialGroupId,
  groupId,
  onGroupIdChange,
  semesterId,
  onSemesterIdChange,
  onSemesterChange,
  courseFilter,
  onCourseFilterChange,
  disabled,
}: GroupSemesterPickerProps) {
  const { t } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;
  const [groups, setGroups] = useState<StudentGroupDto[]>([]);
  const [years, setYears] = useState<AcademicYearDto[]>([]);
  const [semesters, setSemesters] = useState<SemesterDto[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [errorGroups, setErrorGroups] = useState<string | null>(null);
  const [errorSemesters, setErrorSemesters] = useState<string | null>(null);

  useEffect(() => {
    setLoadingGroups(true);
    setErrorGroups(null);
    fetchGroups().then(({ data, error }) => {
      setLoadingGroups(false);
      if (error) setErrorGroups(error.message ?? tRef.current('implementationErrorLoadGroups'));
      else if (data) setGroups(data);
    });
  }, []);

  useEffect(() => {
    setLoadingSemesters(true);
    setErrorSemesters(null);
    fetchAcademicYears().then(({ data: yearsData }) => {
      if (yearsData) setYears(yearsData);
      setLoadingSemesters(false);
    });
  }, []);

  const currentYearId = useMemo(() => years.find((y) => y.isCurrent)?.id ?? years[0]?.id, [years]);

  useEffect(() => {
    if (!currentYearId) {
      setSemesters([]);
      return;
    }
    setLoadingSemesters(true);
    fetchSemestersByYear(currentYearId).then(({ data, error }) => {
      setLoadingSemesters(false);
      if (error) setErrorSemesters(error.message ?? tRef.current('implementationErrorLoadSemesters'));
      else if (data) setSemesters(data);
    });
  }, [currentYearId]);

  useEffect(() => {
    if (initialGroupId && groups.some((g) => g.id === initialGroupId)) {
      onGroupIdChange(initialGroupId);
    }
  }, [initialGroupId, groups, onGroupIdChange]);

  useEffect(() => {
    if (semesters.length > 0 && !semesterId) {
      const current = semesters.find((s) => s.isCurrent);
      const chosen = current ?? semesters[0];
      onSemesterIdChange(chosen.id);
      onSemesterChange?.(chosen);
    }
  }, [semesters, semesterId, onSemesterIdChange, onSemesterChange]);

  useEffect(() => {
    if (semesters.length > 0 && semesterId) {
      const found = semesters.find((s) => s.id === semesterId);
      onSemesterChange?.(found ?? null);
    } else {
      onSemesterChange?.(null);
    }
  }, [semesters, semesterId, onSemesterChange]);

  return (
    <div className="department-page-toolbar curriculum-subjects-toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
      <div className="toolbar-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div className="department-page-search-wrap" style={{ minWidth: 200 }}>
          <label htmlFor="impl-group-select" className="sr-only">
            {t('implementationSelectGroup')}
          </label>
          <select
            id="impl-group-select"
            className="department-page-search"
            value={groupId ?? ''}
            onChange={(e) => onGroupIdChange(e.target.value || null)}
            disabled={disabled || loadingGroups}
            aria-label={t('implementationSelectGroup')}
          >
            <option value="">{t('implementationSelectGroupPlaceholder')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name || g.code}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 220 }}>
          <label htmlFor="impl-semester-select" className="sr-only">
            {t('implementationSelectSemester')}
          </label>
          <select
            id="impl-semester-select"
            className="semester-filter-select"
            value={semesterId ?? ''}
            onChange={(e) => {
              const id = e.target.value || null;
              onSemesterIdChange(id);
              const sem = id ? semesters.find((s) => s.id === id) ?? null : null;
              onSemesterChange?.(sem);
            }}
            disabled={disabled || loadingSemesters}
            aria-label={t('implementationSelectSemester')}
          >
            <option value="">{t('implementationSelectSemesterPlaceholder')}</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || `Семестр ${s.number}`}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label htmlFor="impl-course-filter" className="sr-only">
            {t('implementationFilterCourse')}
          </label>
          <select
            id="impl-course-filter"
            className="semester-filter-select"
            value={courseFilter === '' ? '' : String(courseFilter)}
            onChange={(e) => onCourseFilterChange(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={disabled}
            aria-label={t('implementationFilterCourse')}
          >
            <option value="">{t('implementationFilterCoursePlaceholder')}</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      {errorGroups && (
        <span className="form-error" style={{ fontSize: '0.875rem' }}>
          {errorGroups}
        </span>
      )}
      {errorSemesters && (
        <span className="form-error" style={{ fontSize: '0.875rem' }}>
          {errorSemesters}
        </span>
      )}
    </div>
  );
}

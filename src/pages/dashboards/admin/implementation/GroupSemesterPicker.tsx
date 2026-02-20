import { useState, useEffect, useRef } from 'react';
import { fetchGroups } from '../../../../entities/group';
import type { StudentGroupDto } from '../../../../entities/group';
import { useTranslation } from '../../../../shared/i18n';

export type SemesterNo = 1 | 2;

export interface GroupSemesterPickerProps {
  /** Preselected group id (e.g. from query) */
  initialGroupId?: string | null;
  groupId: string | null;
  onGroupIdChange: (id: string | null) => void;
  /** Номер курса (1–6) или пустая строка */
  courseFilter: number | '';
  onCourseFilterChange: (value: number | '') => void;
  /** Номер семестра в году: 1 или 2 */
  semesterNo: SemesterNo;
  onSemesterNoChange: (value: SemesterNo) => void;
  disabled?: boolean;
}

export function GroupSemesterPicker({
  initialGroupId,
  groupId,
  onGroupIdChange,
  courseFilter,
  onCourseFilterChange,
  semesterNo,
  onSemesterNoChange,
  disabled,
}: GroupSemesterPickerProps) {
  const { t } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;
  const [groups, setGroups] = useState<StudentGroupDto[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [errorGroups, setErrorGroups] = useState<string | null>(null);

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
    if (initialGroupId && groups.some((g) => g.id === initialGroupId)) {
      onGroupIdChange(initialGroupId);
    }
  }, [initialGroupId, groups, onGroupIdChange]);

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
        <div style={{ minWidth: 140 }}>
          <label htmlFor="impl-semester-no-select" className="sr-only">
            {t('implementationSelectSemester')}
          </label>
          <select
            id="impl-semester-no-select"
            className="semester-filter-select"
            value={semesterNo}
            onChange={(e) => onSemesterNoChange(Number(e.target.value) as SemesterNo)}
            disabled={disabled}
            aria-label={t('implementationSelectSemester')}
          >
            <option value={1}>{t('implementationSemesterNoOption', { number: 1 })}</option>
            <option value={2}>{t('implementationSemesterNoOption', { number: 2 })}</option>
          </select>
        </div>
      </div>
      {errorGroups && (
        <span className="form-error" style={{ fontSize: '0.875rem' }}>
          {errorGroups}
        </span>
      )}
    </div>
  );
}

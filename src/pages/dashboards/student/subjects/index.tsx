import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, UserRound } from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import type { Locale } from '../../../../shared/i18n';
import { getStudentSubjects } from '../../../../shared/api';
import type { StudentSubjectListItemDto } from '../../../../shared/api';
import { Alert, SubjectCard, SemesterFilterSelect } from '../../../../shared/ui';
import { useSemesterFilter } from '../../../../shared/hooks/useSemesterFilter';
import { getSubjectDisplayNameFromListItem } from '../../../../shared/lib';

export function StudentSubjectsPage() {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [subjects, setSubjects] = useState<StudentSubjectListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async (semesterNo: number | null) => {
    setLoading(true);
    setError(null);
    const res = await getStudentSubjects(
      semesterNo != null ? { semesterNo } : undefined
    );
    if (res.error) {
      setError(res.error.message ?? tRef.current('studentSubjectsErrorLoad'));
      setSubjects([]);
    } else {
      setSubjects(res.data?.items ?? []);
    }
    setLoading(false);
  }, []);

  const {
    semesterOptions,
    selectedSemesterNumber,
    handleSemesterChange,
    loading: filterLoading,
  } = useSemesterFilter();

  useEffect(() => {
    if (filterLoading) return;
    loadSubjects(selectedSemesterNumber);
  }, [filterLoading, selectedSemesterNumber, loadSubjects]);

  return (
    <section className="entity-view-card student-subjects-page">
      <div className="student-subjects-page-header">
        <h2 className="entity-view-card-title student-subjects-page-title">
          {t('studentSubjectsTitle')}
        </h2>
        <p className="entity-view-card-subtitle student-subjects-page-subtitle">
          {t('studentSubjectsSubtitle')}
        </p>
        <SemesterFilterSelect
          id="student-subjects-semester"
          label={t('teacherSubjectSemesterLabel')}
          placeholder={t('teacherSubjectsSemesterPlaceholder')}
          semesterOptionLabel={(s) =>
            s.name ?? `${t('academicSemesterNumber')} ${s.number}`
          }
          value={selectedSemesterNumber}
          onChange={handleSemesterChange}
          options={semesterOptions}
          ariaLabel={t('teacherSubjectsSemesterPlaceholder')}
          className="student-subjects-semester-row"
        />
      </div>

      {error && (
        <div className="student-subjects-page-alert">
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        </div>
      )}

      {loading ? (
        <p className="student-subjects-page-loading">{t('loading')}</p>
      ) : subjects.length === 0 ? (
        <div className="student-subjects-page-empty">{t('studentSubjectsEmpty')}</div>
      ) : (
        <div className="subject-card-grid">
          {subjects.map((item) => (
            <SubjectCard
              key={item.offeringId}
              title={getSubjectDisplayNameFromListItem(item, locale)}
              subjectCode={item.subjectCode}
              departmentLabel={t('teacherSubjectDepartment')}
              departmentName={item.departmentName}
              departmentIcon={<BookOpen />}
              secondaryLabel={t('studentSubjectTeacher')}
              secondaryValue={item.teacherDisplayName ?? '—'}
              secondaryIcon={<UserRound />}
            />
          ))}
        </div>
      )}
    </section>
  );
}

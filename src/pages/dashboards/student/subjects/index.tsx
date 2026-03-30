import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Calendar, GraduationCap, UserRound } from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import { getStudentSubjects } from '../../../../shared/api';
import type { StudentSubjectListItemDto } from '../../../../shared/api';
import {
  Alert,
  SubjectCard,
  SemesterFilterSelect,
  PageHero,
  SectionCard,
} from '../../../../shared/ui';
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
    <div className="entity-view-page department-form-page ed-page">
      <PageHero
        icon={<GraduationCap size={28} />}
        title={t('studentSubjectsTitle')}
        subtitle={t('studentSubjectsSubtitle')}
      />

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        </div>
      )}

      <SectionCard
        icon={<Calendar size={18} />}
        title={t('teacherSubjectSemesterLabel')}
      >
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
        />
      </SectionCard>

      <SectionCard
        icon={<BookOpen size={18} />}
        title={t('studentSubjectsTitle')}
      >
        {loading ? (
          <p className="ed-empty" style={{ margin: 0, color: '#6b7280' }}>
            {t('loading')}
          </p>
        ) : subjects.length === 0 ? (
          <p className="ed-empty">{t('studentSubjectsEmpty')}</p>
        ) : (
          <div className="subject-card-grid">
            {subjects.map((item) => (
              <SubjectCard
                key={item.offeringId}
                to={`/dashboards/student/subjects/${item.offeringId}`}
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
      </SectionCard>
    </div>
  );
}

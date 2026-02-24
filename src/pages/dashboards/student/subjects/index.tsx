import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import type { Locale } from '../../../../shared/i18n';
import { getStudentSubjects } from '../../../../shared/api';
import type { StudentSubjectListItemDto } from '../../../../shared/api';
import { Alert, SubjectCard } from '../../../../shared/ui';
import { getSubjectDisplayNameFromListItem } from '../../../../shared/lib';

export function StudentSubjectsPage() {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [subjects, setSubjects] = useState<StudentSubjectListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getStudentSubjects();
    if (res.error) {
      setError(res.error.message ?? tRef.current('studentSubjectsErrorLoad'));
      setSubjects([]);
    } else {
      setSubjects(res.data?.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  return (
    <section className="entity-view-card" style={{ marginTop: '1rem' }}>
      <h2 className="entity-view-card-title">{t('studentSubjectsTitle')}</h2>
      <p className="entity-view-card-subtitle">{t('studentSubjectsSubtitle')}</p>

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          {t('loading')}
        </p>
      ) : subjects.length === 0 ? (
        <div className="curriculum-subjects-empty" style={{ padding: '2rem 0' }}>
          {t('studentSubjectsEmpty')}
        </div>
      ) : (
        <div className="subject-card-grid">
          {subjects.map((item) => (
            <SubjectCard
              key={item.offeringId}
              title={getSubjectDisplayNameFromListItem(item, locale)}
              subjectCode={item.subjectCode}
              departmentLabel={t('teacherSubjectDepartment')}
              departmentName={item.departmentName}
              secondaryLabel={t('studentSubjectTeacher')}
              secondaryValue={item.teacherDisplayName ?? '—'}
            />
          ))}
        </div>
      )}
    </section>
  );
}

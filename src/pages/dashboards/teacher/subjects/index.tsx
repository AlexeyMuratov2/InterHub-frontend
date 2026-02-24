import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import type { Locale } from '../../../../shared/i18n';
import { getTeacherMySubjects } from '../../../../shared/api';
import type { TeacherSubjectListItemDto, GroupInfoDto } from '../../../../shared/api';
import { Alert, SubjectCard, SemesterFilterSelect } from '../../../../shared/ui';
import { useSemesterFilter } from '../../../../shared/hooks/useSemesterFilter';
import { getSubjectDisplayNameFromListItem } from '../../../../shared/lib';

function formatGroupDisplay(g: GroupInfoDto): string {
  const parts = [g.code, g.name].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : g.id;
}

function groupDisplayList(groups: TeacherSubjectListItemDto['groups']): string {
  if (!groups?.length) return '—';
  return groups.map(formatGroupDisplay).join(', ');
}

export function SubjectsPage() {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [subjects, setSubjects] = useState<TeacherSubjectListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async (semesterNo: number | null) => {
    setLoading(true);
    setError(null);
    const res = await getTeacherMySubjects(
      semesterNo != null ? { semesterNo } : undefined
    );
    if (res.error) {
      setError(res.error.message ?? tRef.current('teacherSubjectsErrorLoad'));
      setSubjects([]);
    } else {
      setSubjects(res.data ?? []);
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

  const filteredSubjects = subjects;

  return (
    <section className="entity-view-card" style={{ marginTop: '1rem' }}>
      <h2 className="entity-view-card-title">{t('teacherSubjectsTitle')}</h2>
      <p className="entity-view-card-subtitle">{t('teacherSubjectsSubtitle')}</p>

      <div className="teacher-subjects-page-header">
        <SemesterFilterSelect
          id="teacher-subjects-semester"
          label={t('teacherSubjectSemesterLabel')}
          placeholder={t('teacherSubjectsSemesterPlaceholder')}
          semesterOptionLabel={(s) =>
            s.name ?? `${t('academicSemesterNumber')} ${s.number}`
          }
          value={selectedSemesterNumber}
          onChange={handleSemesterChange}
          options={semesterOptions}
          ariaLabel={t('teacherSubjectsSemesterPlaceholder')}
          className="teacher-subjects-semester-row"
        />
      </div>

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
      ) : filteredSubjects.length === 0 ? (
        <div className="curriculum-subjects-empty" style={{ padding: '2rem 0' }}>
          {t('teacherSubjectsEmpty')}
        </div>
      ) : (
        <div className="subject-card-grid">
          {filteredSubjects.map((item) => (
            <SubjectCard
              key={item.curriculumSubjectId}
              title={getSubjectDisplayNameFromListItem(item, locale)}
              subjectCode={item.subjectCode}
              departmentLabel={t('teacherSubjectDepartment')}
              departmentName={item.departmentName}
              departmentIcon={<BookOpen />}
              secondaryLabel={t('teacherSubjectGroups')}
              secondaryValue={groupDisplayList(item.groups)}
              secondaryIcon={<Users />}
              to={`/dashboards/teacher/subjects/${item.curriculumSubjectId}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

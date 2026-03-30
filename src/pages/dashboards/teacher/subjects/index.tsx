import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Calendar, GraduationCap, Users } from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import { getTeacherMySubjects } from '../../../../shared/api';
import type { TeacherSubjectListItemDto, GroupInfoDto } from '../../../../shared/api';
import {
  Alert,
  SubjectCard,
  SemesterFilterSelect,
  PageHero,
  SectionCard,
} from '../../../../shared/ui';
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

  return (
    <div className="entity-view-page department-form-page ed-page">
      <PageHero
        icon={<GraduationCap size={28} />}
        title={t('teacherSubjectsTitle')}
        subtitle={t('teacherSubjectsSubtitle')}
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
        />
      </SectionCard>

      <SectionCard
        icon={<BookOpen size={18} />}
        title={t('teacherSubjectsTitle')}
      >
        {loading ? (
          <p className="ed-empty" style={{ margin: 0, color: '#6b7280' }}>
            {t('loading')}
          </p>
        ) : subjects.length === 0 ? (
          <p className="ed-empty">{t('teacherSubjectsEmpty')}</p>
        ) : (
          <div className="subject-card-grid">
            {subjects.map((item) => (
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
      </SectionCard>
    </div>
  );
}

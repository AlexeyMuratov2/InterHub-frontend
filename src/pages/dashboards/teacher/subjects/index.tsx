import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import type { Locale } from '../../../../shared/i18n';
import {
  getCurrentSemester,
  getAcademicYears,
  getSemestersByYear,
  getTeacherMySubjects,
} from '../../../../shared/api';
import type {
  SemesterDto,
  TeacherSubjectListItemDto,
  GroupInfoDto,
} from '../../../../shared/api';
import { Alert } from '../../../../shared/ui';

function subjectDisplayNameByLocale(
  item: TeacherSubjectListItemDto,
  locale: Locale
): string {
  if (locale === 'zh-Hans') {
    return (
      item.subjectChineseName ||
      item.subjectEnglishName ||
      item.subjectCode ||
      '—'
    );
  }
  return (
    item.subjectEnglishName ||
    item.subjectChineseName ||
    item.subjectCode ||
    '—'
  );
}

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

  const [currentSemester, setCurrentSemester] = useState<SemesterDto | null>(null);
  const [semesters, setSemesters] = useState<SemesterDto[]>([]);
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<TeacherSubjectListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSemestersForPicker = useCallback(async () => {
    const yearsRes = await getAcademicYears();
    if (yearsRes.error || !yearsRes.data?.length) return;
    const year = yearsRes.data.find((y) => y.isCurrent) ?? yearsRes.data[0];
    const semRes = await getSemestersByYear(year.id);
    if (semRes.error) return;
    setSemesters(semRes.data ?? []);
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const currentRes = await getCurrentSemester();
      if (cancelled) return;
      await loadSemestersForPicker();
      if (cancelled) return;

      if (currentRes.data) {
        setCurrentSemester(currentRes.data);
        setSelectedSemesterNumber(currentRes.data.number);
      } else {
        setCurrentSemester(null);
        setSelectedSemesterNumber(null);
      }

      const semesterNo = currentRes.data?.number ?? null;
      const subjectsRes = await getTeacherMySubjects(
        semesterNo != null ? { semesterNo } : undefined
      );
      if (cancelled) return;
      if (subjectsRes.error) {
        setError(subjectsRes.error.message ?? tRef.current('teacherSubjectsErrorLoad'));
        setSubjects([]);
      } else {
        setSubjects(subjectsRes.data ?? []);
      }
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [loadSemestersForPicker]);

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      setSelectedSemesterNumber(null);
      loadSubjects(null);
    } else {
      const num = parseInt(value, 10);
      if (!Number.isNaN(num)) {
        setSelectedSemesterNumber(num);
        loadSubjects(num);
      }
    }
  };

  const filteredSubjects = subjects;

  const semesterOptions =
    semesters.length > 0
      ? currentSemester && !semesters.some((s) => s.id === currentSemester.id)
        ? [currentSemester, ...semesters]
        : semesters
      : currentSemester
        ? [currentSemester]
        : [];

  return (
    <section className="entity-view-card" style={{ marginTop: '1rem' }}>
      <h2 className="entity-view-card-title">{t('teacherSubjectsTitle')}</h2>
      <p className="entity-view-card-subtitle">{t('teacherSubjectsSubtitle')}</p>

      <div className="teacher-subjects-page-header">
        <div className="teacher-subjects-semester-row">
          <label htmlFor="teacher-subjects-semester">
            {t('teacherSubjectSemesterLabel')}:
          </label>
          <select
            id="teacher-subjects-semester"
            className="semester-filter-select"
            value={
              selectedSemesterNumber == null ? '' : String(selectedSemesterNumber)
            }
            onChange={handleSemesterChange}
            aria-label={t('teacherSubjectsSemesterPlaceholder')}
          >
            <option value="">{t('teacherSubjectsSemesterPlaceholder')}</option>
            {semesterOptions.map((s) => (
              <option key={s.id} value={s.number}>
                {s.name ?? `${t('academicSemesterNumber')} ${s.number}`}
              </option>
            ))}
          </select>
        </div>
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
        <div className="teacher-subjects-grid">
          {filteredSubjects.map((item) => (
            <div key={item.curriculumSubjectId} className="teacher-subject-card">
              <h3 className="teacher-subject-card-title">
                {subjectDisplayNameByLocale(item, locale)}
              </h3>
              <p className="teacher-subject-card-code">{item.subjectCode}</p>
              {item.departmentName && (
                <div className="teacher-subject-card-row">
                  <span className="teacher-subject-card-label">
                    {t('teacherSubjectDepartment')}:
                  </span>
                  <span className="teacher-subject-card-value">
                    {item.departmentName}
                  </span>
                </div>
              )}
              <div className="teacher-subject-card-row">
                <span className="teacher-subject-card-label">
                  {t('teacherSubjectGroups')}:
                </span>
                <span className="teacher-subject-card-value">
                  {groupDisplayList(item.groups)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

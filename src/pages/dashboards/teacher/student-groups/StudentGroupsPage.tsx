import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import { getTeacherStudentGroups } from '../../../../shared/api';
import type {
  TeacherStudentGroupItemDto,
  AcademicYearDto,
  SemesterDto,
  TeacherStudentGroupSubjectDto,
} from '../../../../shared/api';
import { Alert } from '../../../../shared/ui';

function groupDisplayName(item: TeacherStudentGroupItemDto): string {
  const g = item.group;
  const parts = [g.code, g.name].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : g.id;
}

function curatorDisplayName(item: TeacherStudentGroupItemDto): string {
  const c = item.curatorUser;
  if (!c) return '—';
  const parts = [c.firstName, c.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ').trim() : (c.email ?? '—');
}

function subjectDisplayName(subj: TeacherStudentGroupSubjectDto, locale: string): string {
  if (locale === 'zh-Hans' && subj.chineseName) return subj.chineseName;
  return subj.englishName || subj.chineseName || subj.code || subj.id;
}

export function StudentGroupsPage() {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [academicYears, setAcademicYears] = useState<AcademicYearDto[]>([]);
  const [semesters, setSemesters] = useState<SemesterDto[]>([]);
  const [subjects, setSubjects] = useState<TeacherStudentGroupSubjectDto[]>([]);
  const [groups, setGroups] = useState<TeacherStudentGroupItemDto[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getTeacherStudentGroups();
    if (res.error) {
      setError(res.error.message ?? tRef.current('teacherStudentGroupsErrorLoad'));
      setAcademicYears([]);
      setSemesters([]);
      setSubjects([]);
      setGroups([]);
    } else {
      setAcademicYears(res.data?.academicYears ?? []);
      setSemesters(res.data?.semesters ?? []);
      setSubjects(res.data?.subjects ?? []);
      setGroups(res.data?.groups ?? []);
      setSelectedYearId((prev) => {
        if (!res.data?.academicYears?.length) return null;
        return res.data.academicYears.some((y) => y.id === prev) ? prev : null;
      });
      setSelectedSemesterId((prev) => {
        if (!res.data?.semesters?.length) return null;
        return res.data.semesters.some((s) => s.id === prev) ? prev : null;
      });
      setSelectedSubjectId((prev) => {
        if (!res.data?.subjects?.length) return null;
        return res.data.subjects.some((s) => s.id === prev) ? prev : null;
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const semestersForDropdown = useMemo(() => {
    if (!selectedYearId) return semesters;
    return semesters.filter((s) => s.academicYearId === selectedYearId);
  }, [semesters, selectedYearId]);

  const filteredGroups = useMemo(() => {
    return groups.filter((item) => {
      if (selectedYearId && !item.semesters?.some((s) => s.academicYearId === selectedYearId)) return false;
      if (selectedSemesterId && !item.semesters?.some((s) => s.id === selectedSemesterId)) return false;
      if (selectedSubjectId && !item.subjectIds?.includes(selectedSubjectId)) return false;
      return true;
    });
  }, [groups, selectedYearId, selectedSemesterId, selectedSubjectId]);

  const hasActiveFilters = selectedYearId || selectedSemesterId || selectedSubjectId;

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedYearId(value === '' ? null : value);
    if (value === '') {
      setSelectedSemesterId(null);
    } else {
      setSelectedSemesterId((prev) => {
        if (!prev) return null;
        const sem = semesters.find((s) => s.id === prev);
        return sem && sem.academicYearId === value ? prev : null;
      });
    }
  };

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSemesterId(e.target.value === '' ? null : e.target.value);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubjectId(e.target.value === '' ? null : e.target.value);
  };

  return (
    <section className="entity-view-card teacher-student-groups-page" style={{ marginTop: '1rem' }}>
      <h2 className="entity-view-card-title">{t('teacherStudentGroupsTitle')}</h2>
      <p className="entity-view-card-subtitle">{t('teacherStudentGroupsSubtitle')}</p>

      {!loading && !error && (academicYears.length > 0 || semesters.length > 0 || subjects.length > 0 || groups.length > 0) && (
        <div className="teacher-student-groups-page-header teacher-student-groups-filters">
          <div className="teacher-subjects-semester-row">
            <label htmlFor="teacher-student-groups-year">{t('teacherStudentGroupsYearLabel')}:</label>
            <select
              id="teacher-student-groups-year"
              className="semester-filter-select"
              value={selectedYearId ?? ''}
              onChange={handleYearChange}
              aria-label={t('teacherStudentGroupsYearPlaceholder')}
            >
              <option value="">{t('teacherStudentGroupsYearAll')}</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
          </div>
          <div className="teacher-subjects-semester-row">
            <label htmlFor="teacher-student-groups-semester">{t('teacherStudentGroupsSemesterLabel')}:</label>
            <select
              id="teacher-student-groups-semester"
              className="semester-filter-select"
              value={selectedSemesterId ?? ''}
              onChange={handleSemesterChange}
              aria-label={t('teacherStudentGroupsSemesterPlaceholder')}
            >
              <option value="">{t('teacherStudentGroupsSemesterAll')}</option>
              {semestersForDropdown.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? `${t('academicSemesterNumber')} ${s.number}`}
                </option>
              ))}
            </select>
          </div>
          <div className="teacher-subjects-semester-row">
            <label htmlFor="teacher-student-groups-subject">{t('teacherStudentGroupsSubjectLabel')}:</label>
            <select
              id="teacher-student-groups-subject"
              className="semester-filter-select"
              value={selectedSubjectId ?? ''}
              onChange={handleSubjectChange}
              aria-label={t('teacherStudentGroupsSubjectPlaceholder')}
            >
              <option value="">{t('teacherStudentGroupsSubjectAll')}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{subjectDisplayName(s, locale)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('loading')}</p>
      ) : filteredGroups.length === 0 ? (
        <div className="teacher-student-groups-empty" style={{ padding: '2rem 0' }}>
          {hasActiveFilters ? t('teacherStudentGroupsEmptyForFilters') : t('teacherStudentGroupsEmpty')}
        </div>
      ) : (
        <div className="teacher-student-groups-grid">
          {filteredGroups.map((item) => (
            <article
              key={item.group.id}
              className="teacher-student-group-card"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div className="teacher-student-group-card-header">
                <h3 className="teacher-student-group-card-title">
                  {groupDisplayName(item)}
                </h3>
                {item.studentCount != null && (
                  <span className="teacher-student-group-card-count" aria-label={t('teacherStudentGroupsStudentsCount')}>
                    {item.studentCount}
                  </span>
                )}
              </div>
              <div className="teacher-student-group-card-row">
                <span className="teacher-student-group-card-label">{t('teacherStudentGroupsProgram')}:</span>
                <span className="teacher-student-group-card-value">
                  {item.program.name ?? item.program.code ?? '—'}
                </span>
              </div>
              <div className="teacher-student-group-card-row">
                <span className="teacher-student-group-card-label">{t('teacherStudentGroupsCurriculum')}:</span>
                <span className="teacher-student-group-card-value">
                  {item.curriculum.version ?? '—'}
                </span>
              </div>
              <div className="teacher-student-group-card-row">
                <span className="teacher-student-group-card-label">{t('teacherStudentGroupsCurator')}:</span>
                <span className="teacher-student-group-card-value">
                  {curatorDisplayName(item)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}


import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchCurriculumSubjects,
  deleteCurriculumSubject,
  type CurriculumSubjectDto,
} from '../../../../entities/curriculum-subject';
import { fetchCurriculumById, type CurriculumDto } from '../../../../entities/curriculum';
import { fetchProgramById, type ProgramDto } from '../../../../entities/program';
import { fetchSubjects, fetchAssessmentTypes, type SubjectDto, type AssessmentTypeDto } from '../../../../entities/subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getAssessmentTypeDisplayName, formatDurationYears } from '../../../../shared/lib';
import { PageMessage, Alert, ConfirmModal } from '../../../../shared/ui';

type CurriculumSubjectWithDetails = CurriculumSubjectDto & {
  subjectCode: string;
  subjectChineseName: string;
  subjectEnglishName: string | null;
  assessmentTypeCode: string;
  assessmentTypeName: string;
};

export function CurriculumSubjectsPage() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [curriculum, setCurriculum] = useState<CurriculumDto | null>(null);
  const [program, setProgram] = useState<ProgramDto | null>(null);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentTypeDto[]>([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState<CurriculumSubjectWithDetails[]>([]);

  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<number | ''>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!curriculumId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchCurriculumById(curriculumId),
      fetchCurriculumSubjects(curriculumId),
      fetchSubjects(),
      fetchAssessmentTypes(),
    ]).then(async ([curriculumRes, csRes, subjectsRes, atRes]) => {
      if (cancelled) return;

      if (curriculumRes.error) {
        setLoading(false);
        if (curriculumRes.error.status === 404) {
          setNotFound(true);
        } else {
          setError(curriculumRes.error.message ?? t('curriculumSubjectErrorLoad'));
        }
        return;
      }

      const curr = curriculumRes.data;
      if (!curr) {
        setLoading(false);
        setNotFound(true);
        return;
      }
      setCurriculum(curr);

      // Загружаем программу
      const progRes = await fetchProgramById(curr.programId);
      if (!cancelled && progRes.data) {
        setProgram(progRes.data);
      }

      const subjectsList = subjectsRes.data ?? [];
      const atList = atRes.data ?? [];
      setSubjects(subjectsList);
      setAssessmentTypes(atList);

      // Обогащаем curriculum subjects данными о предметах и типах контроля
      const csList = csRes.data ?? [];
      const enriched: CurriculumSubjectWithDetails[] = csList.map((cs) => {
        const subject = subjectsList.find((s) => s.id === cs.subjectId);
        const at = atList.find((a) => a.id === cs.assessmentTypeId);
        return {
          ...cs,
          subjectCode: subject?.code ?? '—',
          subjectChineseName: subject?.chineseName ?? '—',
          subjectEnglishName: subject?.englishName ?? null,
          assessmentTypeCode: at?.code ?? '—',
          assessmentTypeName: at ? getAssessmentTypeDisplayName(at.code, t, { chineseName: at.chineseName, englishName: at.englishName }) : '—',
        };
      });

      setCurriculumSubjects(enriched);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t from useTranslation is not stable; load only when curriculumId changes
  }, [curriculumId]);

  // Фильтрация
  const filtered = useMemo(() => {
    let result = curriculumSubjects;

    if (semesterFilter !== '') {
      result = result.filter((cs) => cs.semesterNo === semesterFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (cs) =>
          cs.subjectCode.toLowerCase().includes(q) ||
          cs.subjectChineseName.toLowerCase().includes(q) ||
          (cs.subjectEnglishName ?? '').toLowerCase().includes(q)
      );
    }

    // Сортируем по курсу, семестру, затем по названию
    return result.sort((a, b) => {
      const courseA = a.courseYear ?? 0;
      const courseB = b.courseYear ?? 0;
      if (courseA !== courseB) return courseA - courseB;
      if (a.semesterNo !== b.semesterNo) return a.semesterNo - b.semesterNo;
      return a.subjectChineseName.localeCompare(b.subjectChineseName);
    });
  }, [curriculumSubjects, search, semesterFilter]);

  // Семестр может быть только 1 или 2 — варианты для фильтра
  const semesterFilterOptions = useMemo(() => [1, 2] as const, []);

  // Группировка по курсу и семестру: заголовок "N курс M семестр"
  const groupedByCourseAndSemester = useMemo(() => {
    const groups: Record<string, CurriculumSubjectWithDetails[]> = {};
    filtered.forEach((cs) => {
      const courseYear = cs.courseYear ?? '';
      const key = `${courseYear}-${cs.semesterNo}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(cs);
    });
    return groups;
  }, [filtered]);

  // Ключи групп, отсортированные по курсу и семестру
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedByCourseAndSemester).sort((a, b) => {
      const [courseA, semA] = a.split('-').map((x) => (x === '' ? 0 : Number(x)));
      const [courseB, semB] = b.split('-').map((x) => (x === '' ? 0 : Number(x)));
      if (courseA !== courseB) return courseA - courseB;
      return semA - semB;
    });
  }, [groupedByCourseAndSemester]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setError(null);
    const { error: err } = await deleteCurriculumSubject(id);
    setDeleting(false);
    if (err) {
      setError(
        err.status === 403
          ? t('programErrorForbidden')
          : err.status === 404
            ? t('curriculumSubjectNotFoundOrDeleted')
            : err.message ?? t('curriculumSubjectErrorDelete')
      );
      return;
    }
    setCurriculumSubjects((prev) => prev.filter((cs) => cs.id !== id));
    setDeleteId(null);
    setSuccess(t('curriculumSubjectSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
  };

  // Подсчёт статистики
  const stats = useMemo(() => {
    const totalCredits = curriculumSubjects.reduce((sum, cs) => {
      const c = parseFloat(cs.credits) || 0;
      return sum + c;
    }, 0);
    const totalHours = curriculumSubjects.reduce((sum, cs) => sum + (cs.hoursTotal ?? 0), 0);
    return { totalSubjects: curriculumSubjects.length, totalCredits, totalHours };
  }, [curriculumSubjects]);

  if (loading) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('curriculumNotFoundOrDeleted')}
        backTo="/dashboards/admin/programs"
        backLabel={tCommon('back')}
      />
    );
  }

  return (
    <div className="curriculum-subjects-page department-page">
      {/* Шапка с информацией о curriculum */}
      <div className="curriculum-subjects-header">
        <div className="curriculum-subjects-breadcrumb">
          <Link to="/dashboards/admin/programs">{t('menuProgramsAndCurricula')}</Link>
          <span className="breadcrumb-separator">/</span>
          {program && (
            <>
              <Link to={`/dashboards/admin/programs/${program.id}`}>{program.name}</Link>
              <span className="breadcrumb-separator">/</span>
            </>
          )}
          <span className="breadcrumb-current">{t('curriculumSubjectsSectionTitle')}</span>
        </div>

        <h1 className="department-page-title">
          {t('curriculumSubjectsPageTitle', { version: curriculum?.version ?? '' })}
        </h1>
        <p className="department-page-subtitle">
          {program?.name} • {curriculum?.durationYears ? formatDurationYears(curriculum.durationYears, t, locale) : '...'} • {t(`curriculumStatus${curriculum?.status}`)}
        </p>
      </div>

      {/* Статистика */}
      <div className="curriculum-subjects-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.totalSubjects}</div>
          <div className="stat-label">{t('curriculumSubjectsTotalSubjects')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalCredits.toFixed(1)}</div>
          <div className="stat-label">{t('curriculumSubjectsTotalCredits')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalHours}</div>
          <div className="stat-label">{t('curriculumSubjectsTotalHours')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sortedGroupKeys.length}</div>
          <div className="stat-label">{t('curriculumSubjectsTotalSemesters')}</div>
        </div>
      </div>

      {!canEdit && (
        <Alert variant="info" role="status">
          {t('viewOnlyNotice')}
        </Alert>
      )}
      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" role="status">
          {success}
        </Alert>
      )}

      {/* Панель инструментов */}
      <div className="department-page-toolbar curriculum-subjects-toolbar">
        <div className="toolbar-filters">
          <div className="department-page-search-wrap">
            <input
              type="search"
              className="department-page-search"
              placeholder={t('curriculumSubjectSearchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('curriculumSubjectSearchPlaceholder')}
            />
          </div>
          <select
            className="semester-filter-select"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value === '' ? '' : Number(e.target.value))}
            aria-label={t('curriculumSubjectFilterBySemester')}
          >
            <option value="">{t('curriculumSubjectAllSemesters')}</option>
            {semesterFilterOptions.map((sem) => (
              <option key={sem} value={sem}>
                {t('curriculumSubjectSemesterN', { n: sem })}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-actions">
          {canEdit && (
            <Link
              to={`/dashboards/admin/programs/curricula/${curriculumId}/subjects/new`}
              className="department-page-create"
            >
              <span>+</span>
              {t('curriculumSubjectAdd')}
            </Link>
          )}
          <Link to={`/dashboards/admin/programs/${curriculum?.programId}`} className="btn-secondary">
            {t('curriculumBackToProgram')}
          </Link>
        </div>
      </div>

      {/* Список предметов сгруппированный по семестрам */}
      {curriculumSubjects.length === 0 ? (
        <div className="department-empty curriculum-subjects-empty">
          <div className="empty-icon">📚</div>
          <h3>{t('curriculumSubjectNoSubjects')}</h3>
          <p>{t('curriculumSubjectNoSubjectsHint')}</p>
          {canEdit && (
            <Link
              to={`/dashboards/admin/programs/curricula/${curriculumId}/subjects/new`}
              className="department-page-create"
            >
              <span>+</span>
              {t('curriculumSubjectAddFirst')}
            </Link>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="department-empty">
          <p>{t('noResults')}</p>
        </div>
      ) : (
        <div className="curriculum-subjects-list">
          {sortedGroupKeys.map((key) => {
            const items = groupedByCourseAndSemester[key];
            const [coursePart, semesterPart] = key.split('-');
            const courseYear = coursePart === '' ? null : Number(coursePart);
            const semesterNo = Number(semesterPart);
            return (
              <section key={key} className="semester-section">
                <h2 className="semester-title">
                  <span className="semester-badge">{t('curriculumSubjectCourseSemester', { course: courseYear ?? '—', semester: semesterNo })}</span>
                  <span className="semester-count">({items.length} {t('curriculumSubjectSubjectsCount')})</span>
                </h2>
                <div className="department-table-wrap">
                  <table className="department-table curriculum-subjects-table">
                    <thead>
                      <tr>
                        <th>{t('code')}</th>
                        <th>{t('name')}</th>
                        <th>{t('curriculumSubjectCredits')}</th>
                        <th>{t('curriculumSubjectHoursTotal')}</th>
                        <th>{t('curriculumSubjectHoursLecture')}</th>
                        <th>{t('curriculumSubjectHoursPractice')}</th>
                        <th>{t('curriculumSubjectAssessmentType')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((cs) => (
                        <tr
                          key={cs.id}
                          className="department-table-row-clickable"
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/dashboards/admin/programs/curriculum-subjects/${cs.id}/edit`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/dashboards/admin/programs/curriculum-subjects/${cs.id}/edit`);
                            }
                          }}
                        >
                          <td className="code-cell">
                            <span className="subject-code">{cs.subjectCode}</span>
                          </td>
                          <td className="name-cell">
                            <div className="subject-name-primary">{cs.subjectChineseName}</div>
                            {cs.subjectEnglishName && (
                              <div className="subject-name-secondary">{cs.subjectEnglishName}</div>
                            )}
                          </td>
                          <td className="numeric-cell">
                            <span className="credits-badge">{cs.credits || '—'}</span>
                          </td>
                          <td className="numeric-cell">{cs.hoursTotal ?? '—'}</td>
                          <td className="numeric-cell">{cs.hoursLecture ?? '—'}</td>
                          <td className="numeric-cell">{cs.hoursPractice ?? '—'}</td>
                          <td>
                            <span className="assessment-type-badge">{cs.assessmentTypeName}</span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="department-table-actions">
                              <button
                                type="button"
                                className="department-table-btn"
                                onClick={() => navigate(`/dashboards/admin/subjects/${cs.subjectId}`)}
                                title={t('curriculumSubjectViewSubject')}
                                aria-label={t('curriculumSubjectViewSubject')}
                              >
                                👁
                              </button>
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    className="department-table-btn"
                                    onClick={() => navigate(`/dashboards/admin/programs/curriculum-subjects/${cs.id}/edit`)}
                                    title={t('editTitle')}
                                    aria-label={t('editTitle')}
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    className="department-table-btn department-table-btn--danger"
                                    onClick={() => setDeleteId(cs.id)}
                                    title={t('deleteTitle')}
                                    aria-label={t('deleteTitle')}
                                  >
                                    🗑
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title={t('curriculumSubjectDeleteConfirmTitle')}
        message={t('curriculumSubjectDeleteConfirmText')}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={deleting ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deleting}
      />
    </div>
  );
}

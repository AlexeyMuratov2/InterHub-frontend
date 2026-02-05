import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchSubjectById, fetchAssessmentTypes, type AssessmentTypeDto } from '../../../../entities/subject';
import { fetchDepartments } from '../../../../entities/department';
import { fetchPrograms, type ProgramDto } from '../../../../entities/program';
import { fetchCurriculaByProgramId, type CurriculumDto } from '../../../../entities/curriculum';
import { fetchCurriculumSubjects, type CurriculumSubjectDto } from '../../../../entities/curriculum-subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getAssessmentTypeDisplayName } from './utils';

type SubjectUsage = {
  curriculumId: string;
  curriculumVersion: string;
  programId: string;
  programName: string;
  programCode: string;
  semesterNo: number;
  credits: string;
  assessmentTypeName: string;
};

export function SubjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<{
    code: string;
    chineseName: string;
    englishName: string | null;
    description: string | null;
    departmentId: string | null;
    departmentName: string | null;
    createdAt: string;
    updatedAt: string;
  } | null>(null);

  // Данные об использовании в учебных планах
  const [usages, setUsages] = useState<SubjectUsage[]>([]);
  const [usagesLoading, setUsagesLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchSubjectById(id), fetchDepartments()]).then(
      ([subjectRes, departmentsRes]) => {
        if (cancelled) return;
        setLoading(false);
        if (subjectRes.error) {
          if (subjectRes.error.status === 404) setNotFound(true);
          else setError(subjectRes.error.message ?? t('subjectErrorLoad'));
          return;
        }
        const subject = subjectRes.data;
        if (!subject) {
          setNotFound(true);
          return;
        }
        const departmentName =
          subject.departmentId && departmentsRes.data
            ? departmentsRes.data.find((d) => d.id === subject.departmentId)?.name ?? null
            : null;
        setData({
          code: subject.code,
          chineseName: subject.chineseName,
          englishName: subject.englishName,
          description: subject.description,
          departmentId: subject.departmentId,
          departmentName,
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt,
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Загрузка использования предмета в учебных планах
  useEffect(() => {
    if (!id || !data) return;
    let cancelled = false;
    setUsagesLoading(true);

    // Загружаем все программы, учебные планы и их предметы
    Promise.all([fetchPrograms(), fetchAssessmentTypes()]).then(async ([programsRes, atRes]) => {
      if (cancelled) return;
      
      const programs = programsRes.data ?? [];
      const assessmentTypes = atRes.data ?? [];
      const usagesList: SubjectUsage[] = [];

      // Для каждой программы загружаем curricula и их предметы
      for (const program of programs) {
        const curriculaRes = await fetchCurriculaByProgramId(program.id);
        if (cancelled) return;
        const curricula = curriculaRes.data ?? [];

        for (const curriculum of curricula) {
          const csRes = await fetchCurriculumSubjects(curriculum.id);
          if (cancelled) return;
          const subjects = csRes.data ?? [];

          // Ищем наш предмет
          const found = subjects.filter((cs) => cs.subjectId === id);
          for (const cs of found) {
            const at = assessmentTypes.find((a) => a.id === cs.assessmentTypeId);
            usagesList.push({
              curriculumId: curriculum.id,
              curriculumVersion: curriculum.version,
              programId: program.id,
              programName: program.name,
              programCode: program.code,
              semesterNo: cs.semesterNo,
              credits: cs.credits,
              assessmentTypeName: at ? getAssessmentTypeDisplayName(at.code, t, { chineseName: at.chineseName, englishName: at.englishName }) : '—',
            });
          }
        }
      }

      if (!cancelled) {
        setUsages(usagesList);
        setUsagesLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is not stable; load usages only when id or data changes
  }, [id, data]);

  if (loading) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="entity-view-card">
          <p style={{ margin: 0, color: '#6b7280' }}>{t('loadingList')}</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="department-alert department-alert--error">{t('subjectNotFound')}</div>
        <Link to="/dashboards/admin/subjects" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="department-alert department-alert--error">
          {error ?? t('dataNotLoaded')}
        </div>
        <Link to="/dashboards/admin/subjects" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="entity-view-page department-form-page">
      {!canEdit && (
        <div className="department-alert department-alert--info" role="status">
          {t('viewOnlyNotice')}
        </div>
      )}
      <header className="entity-view-header">
        <h1 className="entity-view-title">
          {t('subjectViewPageTitle', { name: data.chineseName })}
        </h1>
        <div className="entity-view-actions department-form-actions">
          {canEdit && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/dashboards/admin/subjects/${id}/edit`)}
            >
              {t('editTitle')}
            </button>
          )}
          <Link to="/dashboards/admin/subjects" className="btn-secondary">
            {t('backToList')}
          </Link>
        </div>
      </header>
      <div className="entity-view-card">
        <dl className="entity-view-dl">
          <dt>{t('code')}</dt>
          <dd>{data.code}</dd>
          <dt>{t('subjectChineseName')}</dt>
          <dd>{data.chineseName}</dd>
          <dt>{t('subjectEnglishName')}</dt>
          <dd>{data.englishName ?? tCommon('noData')}</dd>
          <dt>{t('description')}</dt>
          <dd>{data.description ?? tCommon('noData')}</dd>
          <dt>{t('programDepartment')}</dt>
          <dd>{data.departmentName ?? tCommon('noData')}</dd>
          <dt>{t('createdAt')}</dt>
          <dd>{formatDateTime(data.createdAt, locale)}</dd>
          <dt>{t('programUpdatedAt')}</dt>
          <dd>{formatDateTime(data.updatedAt, locale)}</dd>
        </dl>
      </div>

      {/* Секция использования в учебных планах */}
      <section className="entity-view-card subject-usages-section">
        <h2 className="entity-view-card-title">{t('subjectUsagesTitle')}</h2>
        <p className="entity-view-card-subtitle">{t('subjectUsagesSubtitle')}</p>
        
        {usagesLoading ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : usages.length === 0 ? (
          <div className="department-empty subject-usages-empty">
            <div className="empty-icon">📋</div>
            <p>{t('subjectNotInAnyCurriculum')}</p>
            <p className="hint">{t('subjectNotInAnyCurriculumHint')}</p>
          </div>
        ) : (
          <div className="department-table-wrap">
            <table className="department-table subject-usages-table">
              <thead>
                <tr>
                  <th>{t('curriculumProgram')}</th>
                  <th>{t('curriculumVersion')}</th>
                  <th>{t('curriculumSubjectSemester')}</th>
                  <th>{t('curriculumSubjectCredits')}</th>
                  <th>{t('curriculumSubjectAssessmentType')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {usages.map((usage, idx) => (
                  <tr
                    key={`${usage.curriculumId}-${usage.semesterNo}-${idx}`}
                    className="department-table-row-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/dashboards/admin/programs/curricula/${usage.curriculumId}/subjects`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/dashboards/admin/programs/curricula/${usage.curriculumId}/subjects`);
                      }
                    }}
                  >
                    <td>
                      <Link
                        to={`/dashboards/admin/programs/${usage.programId}`}
                        className="usage-program-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {usage.programName} ({usage.programCode})
                      </Link>
                    </td>
                    <td>{usage.curriculumVersion}</td>
                    <td>
                      <span className="semester-badge">{usage.semesterNo}</span>
                    </td>
                    <td>
                      <span className="credits-badge">{usage.credits || '—'}</span>
                    </td>
                    <td>
                      <span className="assessment-type-badge">{usage.assessmentTypeName}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="department-table-actions">
                        <button
                          type="button"
                          className="department-table-btn department-table-btn--primary"
                          onClick={() => navigate(`/dashboards/admin/programs/curricula/${usage.curriculumId}/subjects`)}
                          title={t('curriculumSubjectsViewTitle')}
                          aria-label={t('curriculumSubjectsViewTitle')}
                        >
                          📚
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canEdit && usages.length > 0 && (
          <div className="subject-usages-actions">
            <Link to="/dashboards/admin/programs" className="btn-secondary">
              {t('subjectGoToPrograms')}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

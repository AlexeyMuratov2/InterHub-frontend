import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchSubjectById, fetchAssessmentTypes } from '../../../../entities/subject';
import { fetchDepartments } from '../../../../entities/department';
import { fetchPrograms } from '../../../../entities/program';
import { fetchCurriculaByProgramId } from '../../../../entities/curriculum';
import { fetchCurriculumSubjects } from '../../../../entities/curriculum-subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getAssessmentTypeDisplayName } from '../../../../shared/lib';
import { EntityViewLayout } from '../../../../widgets/entity-view-layout';

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

  useEffect(() => {
    if (!id || !data) return;
    let cancelled = false;
    setUsagesLoading(true);

    Promise.all([fetchPrograms(), fetchAssessmentTypes()]).then(async ([programsRes, atRes]) => {
      if (cancelled) return;

      const programs = programsRes.data ?? [];
      const assessmentTypes = atRes.data ?? [];
      const usagesList: SubjectUsage[] = [];

      for (const program of programs) {
        const curriculaRes = await fetchCurriculaByProgramId(program.id);
        if (cancelled) return;
        const curricula = curriculaRes.data ?? [];

        for (const curriculum of curricula) {
          const csRes = await fetchCurriculumSubjects(curriculum.id);
          if (cancelled) return;
          const subjects = csRes.data ?? [];

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
    // t из useTranslation нестабилен по ссылке — не включаем в deps, иначе бесконечные запросы
  }, [id, data]);

  return (
    <EntityViewLayout
      loading={loading}
      notFound={notFound}
      error={error}
      notFoundMessage={t('subjectNotFound')}
      errorMessage={error ?? t('dataNotLoaded')}
      backTo="/dashboards/admin/subjects"
      backLabel={tCommon('back')}
      viewOnly={!canEdit}
      viewOnlyMessage={t('viewOnlyNotice')}
      title={data ? t('subjectViewPageTitle', { name: data.chineseName }) : ''}
      onEditClick={canEdit && id ? () => navigate(`/dashboards/admin/subjects/${id}/edit`) : undefined}
      editLabel={t('editTitle')}
      loadingMessage={t('loadingList')}
    >
      {data && (
        <>
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
        </>
      )}
    </EntityViewLayout>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProgramById } from '../../../entities/program';
import { fetchDepartments } from '../../../entities/department';
import { fetchCurriculaByProgramId, deleteCurriculum, type CurriculumDto } from '../../../entities/curriculum';
import { useCanEditInAdmin } from '../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../shared/i18n';

export function ProgramViewPage() {
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
    name: string;
    description: string | null;
    degreeLevel: string | null;
    departmentId: string | null;
    departmentName: string | null;
    createdAt: string;
    updatedAt: string;
  } | null>(null);
  const [curricula, setCurricula] = useState<CurriculumDto[]>([]);
  const [curriculaLoading, setCurriculaLoading] = useState(false);
  const [curriculaError, setCurriculaError] = useState<string | null>(null);
  const [deleteCurriculumId, setDeleteCurriculumId] = useState<string | null>(null);
  const [deletingCurriculum, setDeletingCurriculum] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchProgramById(id), fetchDepartments()]).then(
      ([programRes, departmentsRes]) => {
        if (cancelled) return;
        setLoading(false);
        if (programRes.error) {
          if (programRes.error.status === 404) setNotFound(true);
          else
            setError(
              programRes.error.status === 403
                ? t('programErrorForbidden')
                : programRes.error.message ?? t('programErrorLoad')
            );
          return;
        }
        const program = programRes.data;
        if (!program) {
          setNotFound(true);
          return;
        }
        const deptName =
          program.departmentId && departmentsRes.data
            ? departmentsRes.data.find((d) => d.id === program.departmentId)?.name ?? null
            : null;
        setData({
          code: program.code,
          name: program.name,
          description: program.description,
          degreeLevel: program.degreeLevel,
          departmentId: program.departmentId,
          departmentName: deptName ?? null,
          createdAt: program.createdAt,
          updatedAt: program.updatedAt,
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setCurriculaLoading(true);
    setCurriculaError(null);
    fetchCurriculaByProgramId(id).then(({ data: list, error: err }) => {
      if (cancelled) return;
      setCurriculaLoading(false);
      if (err) {
        setCurriculaError(
          err.status === 403 ? t('programErrorForbidden') : err.message ?? t('curriculumErrorLoadList')
        );
        setCurricula([]);
        return;
      }
      setCurricula(list ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDeleteCurriculum = async (curriculumId: string) => {
    setDeletingCurriculum(true);
    setCurriculaError(null);
    const { error: err } = await deleteCurriculum(curriculumId);
    setDeletingCurriculum(false);
    if (err) {
      const msg =
        err.status === 403
          ? t('programErrorForbidden')
          : err.status === 404
            ? t('curriculumNotFoundOrDeleted')
            : err.message ?? t('curriculumErrorDelete', { status: String(err.status ?? 'unknown') });
      setCurriculaError(msg);
      return;
    }
    setCurricula((prev) => prev.filter((c) => c.id !== curriculumId));
    setDeleteCurriculumId(null);
  };

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
        <div className="department-alert department-alert--error">{t('programNotFoundOrDeleted')}</div>
        <Link to="/dashboards/admin/programs" className="btn-secondary">
          {t('programBackToList')}
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
        <Link to="/dashboards/admin/programs" className="btn-secondary">
          {t('programBackToList')}
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
        <h1 className="entity-view-title">{t('programViewPageTitle', { name: data.name })}</h1>
        <div className="entity-view-actions department-form-actions">
          {canEdit && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/dashboards/admin/programs/${id}/edit`)}
            >
              {t('editTitle')}
            </button>
          )}
          <Link to="/dashboards/admin/programs" className="btn-secondary">
            {t('programBackToList')}
          </Link>
        </div>
      </header>
      <div className="entity-view-card">
        <dl className="entity-view-dl entity-view-dl--two-cols">
          <dt>{t('code')}</dt>
          <dd>{data.code}</dd>
          <dt>{t('name')}</dt>
          <dd>{data.name}</dd>
          <dt>{t('description')}</dt>
          <dd>{data.description ?? tCommon('noData')}</dd>
          <dt>{t('programDegreeLevel')}</dt>
          <dd>{data.degreeLevel ?? tCommon('noData')}</dd>
          <dt>{t('programDepartment')}</dt>
          <dd>{data.departmentName ?? tCommon('noData')}</dd>
          <dt>{t('createdAt')}</dt>
          <dd>{formatDateTime(data.createdAt, locale)}</dd>
          <dt>{t('programUpdatedAt')}</dt>
          <dd>{formatDateTime(data.updatedAt, locale)}</dd>
        </dl>
      </div>

      <section className="entity-view-card">
        <h2 className="entity-view-card-title">{t('curriculumSectionTitle')}</h2>
        {curriculaError && (
          <div className="department-alert department-alert--error" role="alert">
            {curriculaError}
          </div>
        )}
        {canEdit && (
          <div className="department-page-toolbar" style={{ marginBottom: '0.75rem' }}>
            <Link
              to={`/dashboards/admin/programs/${id}/curricula/new`}
              className="department-page-create"
            >
              <span>+</span>
              {t('curriculumAdd')}
            </Link>
          </div>
        )}
        {curriculaLoading ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : curricula.length === 0 ? (
          <div className="department-empty">
            <p>{t('curriculumNoCurricula')}</p>
            {canEdit && (
              <Link
                to={`/dashboards/admin/programs/${id}/curricula/new`}
                className="department-page-create"
              >
                {t('curriculumAdd')}
              </Link>
            )}
          </div>
        ) : (
          <div className="department-table-wrap">
          <table className="department-table">
            <thead>
              <tr>
                <th>{t('curriculumVersion')}</th>
                <th>{t('curriculumStartYear')}</th>
                <th>{t('curriculumEndYear')}</th>
                <th>{t('curriculumIsActive')}</th>
                <th>{t('curriculumStatus')}</th>
                <th>{t('curriculumNotes')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {curricula.map((c) => (
                <tr
                  key={c.id}
                  className="department-table-row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboards/admin/programs/curricula/${c.id}/subjects`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboards/admin/programs/curricula/${c.id}/subjects`);
                    }
                  }}
                  aria-label={t('curriculumSubjectsViewTitle')}
                >
                  <td>{c.version}</td>
                  <td>{c.startYear}</td>
                  <td>{c.endYear ?? '—'}</td>
                  <td>{c.isActive ? t('curriculumActiveYes') : t('curriculumActiveNo')}</td>
                  <td>{c.status}</td>
                  <td title={c.notes ?? undefined}>
                    {c.notes && c.notes.length > 40 ? c.notes.slice(0, 40) + '…' : c.notes ?? '—'}
                  </td>
                  <td>{formatDateTime(c.createdAt, locale)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="department-table-actions">
                      <button
                        type="button"
                        className="department-table-btn department-table-btn--primary"
                        onClick={() => navigate(`/dashboards/admin/programs/curricula/${c.id}/subjects`)}
                        title={t('curriculumSubjectsViewTitle')}
                        aria-label={t('curriculumSubjectsViewTitle')}
                      >
                        📚
                      </button>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="department-table-btn"
                            onClick={() => navigate(`/dashboards/admin/programs/curricula/${c.id}/edit`)}
                            title={t('editTitle')}
                            aria-label={t('editTitle')}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="department-table-btn department-table-btn--danger"
                            onClick={() => setDeleteCurriculumId(c.id)}
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
        )}
      </section>

      {deleteCurriculumId && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeleteCurriculumId(null)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('curriculumDeleteConfirmTitle')}</h3>
            <p>{t('curriculumDeleteConfirmText')}</p>
            <div className="department-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteCurriculumId(null)}
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className="btn-delete"
                disabled={deletingCurriculum}
                onClick={() => handleDeleteCurriculum(deleteCurriculumId)}
              >
                {deletingCurriculum ? tCommon('submitting') : tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

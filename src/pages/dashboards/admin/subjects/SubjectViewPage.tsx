import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchSubjectById } from '../../../../entities/subject';
import { fetchDepartments } from '../../../../entities/department';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';

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
    </div>
  );
}

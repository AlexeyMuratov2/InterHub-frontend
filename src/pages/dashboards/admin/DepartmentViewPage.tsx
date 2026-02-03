import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchDepartmentById } from '../../../entities/department';
import { useCanEditInAdmin } from '../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../shared/i18n';

export function DepartmentViewPage() {
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
    createdAt: string;
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
    fetchDepartmentById(id).then(({ data: res, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404) setNotFound(true);
        else setError(err.message ?? t('errorLoadDepartment'));
        return;
      }
      if (res) {
        setData({
          code: res.code,
          name: res.name,
          description: res.description,
          createdAt: res.createdAt,
        });
      } else {
        setNotFound(true);
      }
    });
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
        <div className="department-alert department-alert--error">{t('departmentNotFound')}</div>
        <Link to="/dashboards/admin/departments" className="btn-secondary">
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
        <Link to="/dashboards/admin/departments" className="btn-secondary">
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
        <h1 className="entity-view-title">{t('viewPageTitle', { name: data.name })}</h1>
        <div className="entity-view-actions department-form-actions">
          {canEdit && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/dashboards/admin/departments/${id}/edit`)}
            >
              {t('editTitle')}
            </button>
          )}
          <Link to="/dashboards/admin/departments" className="btn-secondary">
            {t('backToList')}
          </Link>
        </div>
      </header>
      <div className="entity-view-card">
        <dl className="entity-view-dl">
          <dt>{t('code')}</dt>
          <dd>{data.code}</dd>
          <dt>{t('name')}</dt>
          <dd>{data.name}</dd>
          <dt>{t('description')}</dt>
          <dd>{data.description ?? tCommon('noData')}</dd>
          <dt>{t('createdAt')}</dt>
          <dd>{formatDateTime(data.createdAt, locale)}</dd>
        </dl>
      </div>
    </div>
  );
}

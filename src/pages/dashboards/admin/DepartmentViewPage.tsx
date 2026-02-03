import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchDepartmentById } from '../../../entities/department';
import { useTranslation } from '../../../shared/i18n';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function DepartmentViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
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
      <div className="department-form-page">
        <p>{t('loadingList')}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="department-form-page">
        <div className="department-alert department-alert--error">{t('departmentNotFound')}</div>
        <Link to="/dashboards/admin/departments" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="department-form-page">
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
    <div className="department-form-page">
      <h1 className="department-form-title">{t('viewPageTitle', { name: data.name })}</h1>
      <dl style={{ marginBottom: '1.5rem' }}>
        <dt style={{ fontWeight: 600, marginTop: '0.75rem', color: '#4a5568' }}>{t('code')}</dt>
        <dd style={{ margin: '0.25rem 0 0 0' }}>{data.code}</dd>
        <dt style={{ fontWeight: 600, marginTop: '0.75rem', color: '#4a5568' }}>{t('name')}</dt>
        <dd style={{ margin: '0.25rem 0 0 0' }}>{data.name}</dd>
        <dt style={{ fontWeight: 600, marginTop: '0.75rem', color: '#4a5568' }}>{t('description')}</dt>
        <dd style={{ margin: '0.25rem 0 0 0' }}>{data.description ?? tCommon('noData')}</dd>
        <dt style={{ fontWeight: 600, marginTop: '0.75rem', color: '#4a5568' }}>{t('createdAt')}</dt>
        <dd style={{ margin: '0.25rem 0 0 0' }}>{formatDate(data.createdAt)}</dd>
      </dl>
      <div className="department-form-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate(`/dashboards/admin/departments/${id}/edit`)}
        >
          {t('editTitle')}
        </button>
        <Link to="/dashboards/admin/departments" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    </div>
  );
}

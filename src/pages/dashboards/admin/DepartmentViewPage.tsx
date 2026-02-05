import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDepartmentById } from '../../../entities/department';
import { useCanEditInAdmin } from '../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../shared/i18n';
import { EntityViewLayout } from '../../../widgets/entity-view-layout';

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

  return (
    <EntityViewLayout
      loading={loading}
      notFound={notFound}
      error={error}
      notFoundMessage={t('departmentNotFound')}
      errorMessage={error ?? t('dataNotLoaded')}
      backTo="/dashboards/admin/departments"
      backLabel={t('backToList')}
      viewOnly={!canEdit}
      viewOnlyMessage={t('viewOnlyNotice')}
      title={data ? t('viewPageTitle', { name: data.name }) : ''}
      onEditClick={canEdit && id ? () => navigate(`/dashboards/admin/departments/${id}/edit`) : undefined}
      editLabel={t('editTitle')}
    >
      {data && (
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
      )}
    </EntityViewLayout>
  );
}

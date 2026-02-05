import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchDepartments,
  deleteDepartment,
  type DepartmentDto,
} from '../../../entities/department';
import { useCanEditInAdmin } from '../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDate } from '../../../shared/i18n';
import { EntityListLayout } from '../../../widgets/entity-list-layout';
import { ConfirmModal } from '../../../shared/ui';

function truncate(str: string | null, max: number): string {
  if (!str) return '—';
  return str.length <= max ? str : str.slice(0, max) + '…';
}

export function DepartmentListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const [actionUnavailableNotice, setActionUnavailableNotice] = useState(
    (location.state as { actionUnavailable?: boolean })?.actionUnavailable ?? false
  );
  const [list, setList] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);


  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchDepartments();
    setLoading(false);
    if (err) {
      setError(err.message ?? t('errorLoadList'));
      setList([]);
      return;
    }
    setList(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q)
    );
  }, [list, search]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setError(null);
    const { error: err } = await deleteDepartment(id);
    setDeleting(false);
    if (err) {
      setError(err.message ?? t('errorDelete', { status: String(err.status ?? 'unknown') }));
      return;
    }
    setList((prev) => prev.filter((d) => d.id !== id));
    setDeleteId(null);
    setSuccess(t('successDeleted'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const openDeleteModal = (id: string) => setDeleteId(id);
  const closeDeleteModal = () => setDeleteId(null);

  const { t: tCommon } = useTranslation('common');

  useEffect(() => {
    if (actionUnavailableNotice) {
      const id = setTimeout(() => setActionUnavailableNotice(false), 5000);
      return () => clearTimeout(id);
    }
  }, [actionUnavailableNotice]);

  return (
    <EntityListLayout
      title={t('departmentManagement')}
      subtitle={t('departmentSubtitle')}
      viewOnly={!canEdit}
      viewOnlyMessage={t('viewOnlyNotice')}
      actionUnavailable={actionUnavailableNotice}
      actionUnavailableMessage={t('actionUnavailableForRole')}
      error={error}
      success={success}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('searchDepartments')}
      searchAriaLabel={t('searchDepartments')}
      createTo="/dashboards/admin/departments/new"
      createLabel={t('createDepartment')}
      showCreate={canEdit}
    >
      <div className="department-table-wrap">
        {loading ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="department-empty">
            <p>{list.length === 0 ? t('noDepartments') : t('noResults')}</p>
            {list.length === 0 && canEdit && (
              <Link to="/dashboards/admin/departments/new" className="department-page-create">
                {t('addDepartment')}
              </Link>
            )}
          </div>
        ) : (
          <table className="department-table">
            <thead>
              <tr>
                <th>{t('code')}</th>
                <th>{t('name')}</th>
                <th>{t('description')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="department-table-row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboards/admin/departments/${d.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboards/admin/departments/${d.id}`);
                    }
                  }}
                  aria-label={t('viewTitle')}
                >
                  <td>{d.code}</td>
                  <td>{d.name}</td>
                  <td title={d.description ?? undefined}>{truncate(d.description, 60)}</td>
                  <td>{formatDate(d.createdAt, locale)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="department-table-actions">
                      <button
                        type="button"
                        className="department-table-btn"
                        onClick={() => navigate(`/dashboards/admin/departments/${d.id}`)}
                        title={t('viewTitle')}
                        aria-label={t('viewTitle')}
                      >
                        👁
                      </button>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="department-table-btn"
                            onClick={() => navigate(`/dashboards/admin/departments/${d.id}/edit`)}
                            title={t('editTitle')}
                            aria-label={t('editTitle')}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="department-table-btn department-table-btn--danger"
                            onClick={() => openDeleteModal(d.id)}
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
        )}
      </div>

      <ConfirmModal
        open={deleteId != null}
        title={t('deleteConfirmTitle')}
        message={t('deleteConfirmText')}
        onCancel={closeDeleteModal}
        onConfirm={() => deleteId != null && handleDelete(deleteId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={deleting ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deleting}
      />
    </EntityListLayout>
  );
}

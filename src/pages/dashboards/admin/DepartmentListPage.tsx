import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchDepartments,
  deleteDepartment,
  type DepartmentDto,
} from '../../../entities/department';
import { useTranslation } from '../../../shared/i18n';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function truncate(str: string | null, max: number): string {
  if (!str) return '—';
  return str.length <= max ? str : str.slice(0, max) + '…';
}

export function DepartmentListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
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

  return (
    <div className="department-page">
      <h1 className="department-page-title">{t('departmentManagement')}</h1>
      <p className="department-page-subtitle">{t('departmentSubtitle')}</p>

      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="department-alert department-alert--success" role="status">
          {success}
        </div>
      )}

      <div className="department-page-toolbar">
        <div className="department-page-search-wrap">
          <input
            type="search"
            className="department-page-search"
            placeholder={t('searchDepartments')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('searchDepartments')}
          />
        </div>
        <Link to="/dashboards/admin/departments/new" className="department-page-create">
          <span>+</span>
          {t('createDepartment')}
        </Link>
      </div>

      <div className="department-table-wrap">
        {loading ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="department-empty">
            <p>{list.length === 0 ? t('noDepartments') : t('noResults')}</p>
            {list.length === 0 && (
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
                <tr key={d.id}>
                  <td>{d.code}</td>
                  <td>{d.name}</td>
                  <td title={d.description ?? undefined}>{truncate(d.description, 60)}</td>
                  <td>{formatDate(d.createdAt)}</td>
                  <td>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteId && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeleteId(null)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('deleteConfirmTitle')}</h3>
            <p>{t('deleteConfirmText')}</p>
            <div className="department-modal-actions">
              <button type="button" className="btn-cancel" onClick={closeDeleteModal}>
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className="btn-delete"
                disabled={deleting}
                onClick={() => handleDelete(deleteId)}
              >
                {deleting ? tCommon('submitting') : tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

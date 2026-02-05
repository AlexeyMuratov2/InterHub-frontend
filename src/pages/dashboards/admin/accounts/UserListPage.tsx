import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsers, type AccountUserDto } from '../../../../shared/api';
import { useCanManageAccounts } from '../../../../app/hooks/useCanManageAccounts';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getRoleLabelKey, getDisplayName } from './utils';

function truncate(str: string, max: number): string {
  if (!str) return '—';
  return str.length <= max ? str : str.slice(0, max) + '…';
}

export function UserListPage() {
  const navigate = useNavigate();
  const canManage = useCanManageAccounts();
  const { t, locale } = useTranslation('dashboard');
  const [list, setList] = useState<AccountUserDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const errorLabelRef = useRef(t('accountErrorLoadList'));
  errorLabelRef.current = t('accountErrorLoadList');

  // Первая страница: один запрос при появлении canManage (без cursor)
  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listUsers({ limit: 30 })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        setLoading(false);
        if (err) {
          setError(err.message ?? errorLabelRef.current);
          setList([]);
          setNextCursor(null);
          return;
        }
        setList(data?.items ?? []);
        setNextCursor(data?.nextCursor ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError(errorLabelRef.current);
          setList([]);
          setNextCursor(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [canManage]);

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    listUsers({ cursor: nextCursor, limit: 30 })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message ?? t('accountErrorLoadList'));
          return;
        }
        setList((prev) => [...prev, ...(data?.items ?? [])]);
        setNextCursor(data?.nextCursor ?? null);
      })
      .finally(() => setLoadingMore(false));
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (u) =>
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.firstName ?? '').toLowerCase().includes(q) ||
        (u.lastName ?? '').toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <div className="department-page invitation-page account-page">
      <h1 className="department-page-title">{t('accountManagement')}</h1>
      <p className="department-page-subtitle">{t('accountSubtitle')}</p>

      {!canManage && (
        <div className="department-alert department-alert--info" role="status">
          {t('accountViewOnlyHint')}
        </div>
      )}
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}

      {canManage && (
        <>
          <div className="department-page-toolbar">
            <div className="department-page-search-wrap">
              <input
                type="search"
                className="department-page-search"
                placeholder={t('accountSearch')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t('accountSearch')}
              />
            </div>
          </div>

          <div className="department-table-wrap">
            {loading ? (
              <div className="department-empty">
                <p>{t('loadingList')}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="department-empty">
                <p>
                  {list.length === 0 ? t('accountNoUsers') : t('noResults')}
                </p>
              </div>
            ) : (
              <table className="department-table">
                <thead>
                  <tr>
                    <th>{t('invitationEmail')}</th>
                    <th>{t('invitationRoles')}</th>
                    <th>{t('name')}</th>
                    <th>{t('accountStatus')}</th>
                    <th>{t('invitationCreatedAt')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="department-table-row-clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/dashboards/admin/accounts/${item.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/dashboards/admin/accounts/${item.id}`);
                        }
                      }}
                      aria-label={t('viewTitle')}
                    >
                      <td>{item.email ?? '—'}</td>
                      <td>
                        {(item.roles ?? []).length === 0
                          ? '—'
                          : (item.roles ?? [])
                              .map((r) => t(getRoleLabelKey(r)))
                              .join(', ')}
                      </td>
                      <td
                        title={getDisplayName(
                          item.firstName,
                          item.lastName,
                          item.email
                        )}
                      >
                        {truncate(
                          getDisplayName(
                            item.firstName,
                            item.lastName,
                            item.email
                          ),
                          30
                        )}
                      </td>
                      <td>
                        <span
                          className={`invitation-status-badge invitation-status-badge--${(
                            item.status ?? 'PENDING'
                          ).toLowerCase()}`}
                        >
                          {t(
                            `accountStatus${(item.status ?? 'PENDING').charAt(0) + (item.status ?? 'PENDING').slice(1).toLowerCase()}`
                          )}
                        </span>
                      </td>
                      <td>{formatDateTime(item.createdAt, locale)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="department-table-actions">
                          <button
                            type="button"
                            className="department-table-btn"
                            onClick={() =>
                              navigate(`/dashboards/admin/accounts/${item.id}`)
                            }
                            title={t('viewTitle')}
                            aria-label={t('viewTitle')}
                          >
                            👁
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && nextCursor != null && (
            <div className="department-page-load-more">
              <button
                type="button"
                className="department-page-load-more-btn"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {loadingMore ? t('loadingList') : t('accountLoadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

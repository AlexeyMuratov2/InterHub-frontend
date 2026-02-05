import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listInvitations,
  resendInvitation,
  cancelInvitation,
  type InvitationDto,
  type InvitationStatus,
} from '../../../../shared/api';
import { useCanManageInvitations } from '../../../../app/hooks/useCanManageInvitations';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getDisplayName, truncate } from '../../../../shared/lib';
import { EntityListLayout } from '../../../../widgets/entity-list-layout';
import { ConfirmModal } from '../../../../shared/ui';
import {
  CANCELLABLE,
  getInvitationStatusLabelKey,
  getRoleLabelKey,
  RESENDABLE,
  STATUS_ORDER,
} from './utils';

export function InvitationListPage() {
  const navigate = useNavigate();
  const canManage = useCanManageInvitations();
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [list, setList] = useState<InvitationDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'ALL'>('ALL');
  const [resendId, setResendId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await listInvitations();
    setLoading(false);
    if (err) {
      setError(err.message ?? t('invitationErrorLoadList'));
      setList([]);
      setNextCursor(null);
      return;
    }
    setList(data?.items ?? []);
    setNextCursor(data?.nextCursor ?? null);
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    setError(null);
    const { data, error: err } = await listInvitations({ cursor: nextCursor });
    setLoadingMore(false);
    if (err) {
      if (err.code === 'INVITATION_NOT_FOUND') {
        setNextCursor(null);
        load();
        return;
      }
      setError(err.message ?? t('invitationErrorLoadList'));
      return;
    }
    setList((prev) => [...prev, ...(data?.items ?? [])]);
    setNextCursor(data?.nextCursor ?? null);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let items = list;
    if (statusFilter !== 'ALL') {
      items = items.filter((i) => i.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          (i.email ?? '').toLowerCase().includes(q) ||
          (i.firstName ?? '').toLowerCase().includes(q) ||
          (i.lastName ?? '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [list, statusFilter, search]);

  const handleResend = async (id: string) => {
    setResending(true);
    setError(null);
    const { error: err } = await resendInvitation(id);
    setResending(false);
    if (err) {
      setError(err.message ?? t('invitationErrorResend', { message: String(err.status ?? '') }));
      setResendId(null);
      return;
    }
    setResendId(null);
    setSuccess(t('invitationSuccessResent'));
    setTimeout(() => setSuccess(null), 3000);
    load();
  };

  const handleCancel = async (id: string) => {
    setCancelling(true);
    setError(null);
    const { error: err } = await cancelInvitation(id);
    setCancelling(false);
    if (err) {
      setError(err.message ?? t('invitationErrorCancel', { message: String(err.status ?? '') }));
      setCancelId(null);
      return;
    }
    setCancelId(null);
    setSuccess(t('invitationSuccessCancelled'));
    setTimeout(() => setSuccess(null), 3000);
    setList((prev) => prev.filter((i) => i.id !== id));
  };

  const canResend = (item: InvitationDto) => canManage && RESENDABLE.includes(item.status);
  const canCancelItem = (item: InvitationDto) => canManage && CANCELLABLE.includes(item.status);

  return (
    <EntityListLayout
      title={t('invitationManagement')}
      subtitle={t('invitationSubtitle')}
      viewOnly={!canManage}
      viewOnlyMessage={t('invitationViewOnlyHint')}
      error={error}
      success={success}
      showToolbar={false}
      searchValue=""
      onSearchChange={() => {}}
      searchPlaceholder=""
      showCreate={false}
    >
      <div className="department-page-toolbar">
        <div className="department-page-search-wrap">
          <input
            type="search"
            className="department-page-search"
            placeholder={t('invitationSearch')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('invitationSearch')}
          />
          <select
            className="invitation-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvitationStatus | 'ALL')}
            aria-label={t('invitationStatus')}
          >
            <option value="ALL">{t('invitationFilterAll')}</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {t(getInvitationStatusLabelKey(s))}
              </option>
            ))}
          </select>
        </div>
        {canManage ? (
          <Link to="/dashboards/admin/invitations/new" className="department-page-create">
            <span>+</span>
            {t('invitationCreate')}
          </Link>
        ) : (
          <span className="invitation-no-permission" title={t('invitationNoPermissionCreate')}>
            {t('invitationCreate')} — {t('invitationNoPermissionCreate')}
          </span>
        )}
      </div>

      <div className="department-table-wrap">
        {loading ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="department-empty">
            <p>{list.length === 0 ? t('invitationNoInvitations') : t('noResults')}</p>
            {list.length === 0 && canManage && (
              <Link to="/dashboards/admin/invitations/new" className="department-page-create">
                {t('invitationAdd')}
              </Link>
            )}
          </div>
        ) : (
          <table className="department-table">
            <thead>
              <tr>
                <th>{t('invitationEmail')}</th>
                <th>{t('invitationRoles')}</th>
                <th>{t('name')}</th>
                <th>{t('invitationStatus')}</th>
                <th>{t('invitationExpiresAt')}</th>
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
                  onClick={() => navigate(`/dashboards/admin/invitations/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboards/admin/invitations/${item.id}`);
                    }
                  }}
                  aria-label={t('viewTitle')}
                >
                  <td>{item.email ?? '—'}</td>
                  <td>
                    {(item.roles ?? []).length === 0
                      ? '—'
                      : (item.roles ?? []).map((r) => t(getRoleLabelKey(r))).join(', ')}
                  </td>
                  <td title={getDisplayName(item.firstName, item.lastName, item.email ?? '') || undefined} onClick={(e) => e.stopPropagation()}>
                    {item.userId ? (
                      <Link
                        to={`/dashboards/admin/accounts/${item.userId}`}
                        className="invitation-user-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {truncate(getDisplayName(item.firstName, item.lastName, item.email ?? ''), 30)}
                      </Link>
                    ) : (
                      truncate(getDisplayName(item.firstName, item.lastName, item.email ?? ''), 30)
                    )}
                  </td>
                  <td>
                    <span className={`invitation-status-badge invitation-status-badge--${item.status.toLowerCase()}`}>
                      {t(getInvitationStatusLabelKey(item.status))}
                    </span>
                  </td>
                  <td>{formatDateTime(item.expiresAt, locale)}</td>
                  <td>{formatDateTime(item.createdAt, locale)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="department-table-actions">
                      <button
                        type="button"
                        className="department-table-btn"
                        onClick={() => navigate(`/dashboards/admin/invitations/${item.id}`)}
                        title={t('viewTitle')}
                        aria-label={t('viewTitle')}
                      >
                        👁
                      </button>
                      {canResend(item) ? (
                        <button
                          type="button"
                          className="department-table-btn"
                          onClick={() => setResendId(item.id)}
                          title={t('invitationResend')}
                          aria-label={t('invitationResend')}
                        >
                          ↻
                        </button>
                      ) : RESENDABLE.includes(item.status) && !canManage ? (
                        <span className="invitation-action-disabled" title={t('invitationNoPermissionResend')}>
                          ↻
                        </span>
                      ) : null}
                      {canCancelItem(item) ? (
                        <button
                          type="button"
                          className="department-table-btn department-table-btn--danger"
                          onClick={() => setCancelId(item.id)}
                          title={t('invitationCancel')}
                          aria-label={t('invitationCancel')}
                        >
                          🗑
                        </button>
                      ) : CANCELLABLE.includes(item.status) && !canManage ? (
                        <span className="invitation-action-disabled" title={t('invitationNoPermissionCancel')}>
                          🗑
                        </span>
                      ) : null}
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
            {loadingMore ? t('loadingList') : t('invitationLoadMore')}
          </button>
        </div>
      )}

      <ConfirmModal
        open={resendId != null}
        title={t('invitationResendConfirmTitle')}
        message={t('invitationResendConfirmText')}
        onCancel={() => setResendId(null)}
        onConfirm={() => resendId != null && handleResend(resendId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={resending ? tCommon('submitting') : t('invitationResend')}
        confirmDisabled={resending}
      />

      <ConfirmModal
        open={cancelId != null}
        title={t('invitationCancelConfirmTitle')}
        message={t('invitationCancelConfirmText')}
        onCancel={() => setCancelId(null)}
        onConfirm={() => cancelId != null && handleCancel(cancelId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={cancelling ? tCommon('submitting') : t('invitationCancel')}
        confirmDisabled={cancelling}
        confirmVariant="danger"
      />
    </EntityListLayout>
  );
}

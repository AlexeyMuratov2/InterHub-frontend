import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listInvitations,
  resendInvitation,
  cancelInvitation,
  type InvitationDto,
} from '../../../../shared/api';
import { INVITATION_STATUS, type InvitationStatus } from '../../../../shared/api';
import { useCanManageInvitations } from '../../../../app/hooks/useCanManageInvitations';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getRoleLabelKey } from './utils';

const STATUS_ORDER: InvitationStatus[] = [
  INVITATION_STATUS.PENDING,
  INVITATION_STATUS.SENDING,
  INVITATION_STATUS.SENT,
  INVITATION_STATUS.FAILED,
  INVITATION_STATUS.ACCEPTED,
  INVITATION_STATUS.EXPIRED,
  INVITATION_STATUS.CANCELLED,
];

const RESENDABLE: InvitationStatus[] = [
  INVITATION_STATUS.PENDING,
  INVITATION_STATUS.SENT,
  INVITATION_STATUS.FAILED,
];

const CANCELLABLE: InvitationStatus[] = [
  INVITATION_STATUS.PENDING,
  INVITATION_STATUS.SENDING,
  INVITATION_STATUS.SENT,
  INVITATION_STATUS.FAILED,
  INVITATION_STATUS.EXPIRED,
];

function statusKey(s: InvitationStatus): string {
  return `invitationStatus${s.charAt(0) + s.slice(1).toLowerCase()}`;
}

function truncate(str: string | null, max: number): string {
  if (!str) return '—';
  return str.length <= max ? str : str.slice(0, max) + '…';
}

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
    <div className="department-page invitation-page">
      <h1 className="department-page-title">{t('invitationManagement')}</h1>
      <p className="department-page-subtitle">{t('invitationSubtitle')}</p>

      {!canManage && (
        <div className="department-alert department-alert--info" role="status">
          {t('invitationViewOnlyHint')}
        </div>
      )}
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
                {t(statusKey(s))}
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
                  <td title={[item.firstName, item.lastName].filter(Boolean).join(' ') || undefined}>
                    {truncate([item.firstName, item.lastName].filter(Boolean).join(' '), 30) || '—'}
                  </td>
                  <td>
                    <span className={`invitation-status-badge invitation-status-badge--${item.status.toLowerCase()}`}>
                      {t(statusKey(item.status))}
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

      {resendId && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setResendId(null)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('invitationResendConfirmTitle')}</h3>
            <p>{t('invitationResendConfirmText')}</p>
            <div className="department-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setResendId(null)}>
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={resending}
                onClick={() => handleResend(resendId)}
              >
                {resending ? tCommon('submitting') : t('invitationResend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelId && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setCancelId(null)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('invitationCancelConfirmTitle')}</h3>
            <p>{t('invitationCancelConfirmText')}</p>
            <div className="department-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setCancelId(null)}>
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className="btn-delete"
                disabled={cancelling}
                onClick={() => handleCancel(cancelId)}
              >
                {cancelling ? tCommon('submitting') : t('invitationCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

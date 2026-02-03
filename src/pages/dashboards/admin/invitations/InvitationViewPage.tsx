import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getInvitation, resendInvitation, cancelInvitation } from '../../../../shared/api';
import { INVITATION_STATUS, type InvitationStatus, type InvitationDto } from '../../../../shared/api';
import { useCanManageInvitations } from '../../../../app/hooks/useCanManageInvitations';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getRoleLabelKey } from './utils';

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

export function InvitationViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canManage = useCanManageInvitations();
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<InvitationDto | undefined>(undefined);
  const [resending, setResending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resendConfirm, setResendConfirm] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    getInvitation(id).then(({ data: res, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404) setNotFound(true);
        else setError(err.message ?? t('invitationErrorLoad'));
        return;
      }
      setData(res);
      if (!res) setNotFound(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refetch when id changes; t would cause infinite loop
  }, [id]);

  const handleResend = async () => {
    if (!id || !data) return;
    setResending(true);
    setError(null);
    const { error: err } = await resendInvitation(id);
    setResending(false);
    setResendConfirm(false);
    if (err) {
      setError(err.message ?? t('invitationErrorResend', { message: String(err.status ?? '') }));
      return;
    }
    getInvitation(id).then(({ data: res }) => res && setData(res));
  };

  const handleCancel = async () => {
    if (!id || !data) return;
    setCancelling(true);
    setError(null);
    const { error: err } = await cancelInvitation(id);
    setCancelling(false);
    setCancelConfirm(false);
    if (err) {
      setError(err.message ?? t('invitationErrorCancel', { message: String(err.status ?? '') }));
      return;
    }
    navigate('/dashboards/admin/invitations', { replace: true });
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
        <div className="department-alert department-alert--error">{t('invitationNotFound')}</div>
        <Link to="/dashboards/admin/invitations" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="department-alert department-alert--error">{error}</div>
        <Link to="/dashboards/admin/invitations" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const canResend = canManage && RESENDABLE.includes(data.status);
  const canCancelItem = canManage && CANCELLABLE.includes(data.status);
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ') || '—';

  return (
    <div className="entity-view-page department-form-page invitation-view-page">
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
      <header className="entity-view-header">
        <h1 className="entity-view-title">{t('invitationViewPageTitle')}</h1>
        <div className="entity-view-actions department-form-actions">
          {canResend ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setResendConfirm(true)}
            >
              {t('invitationResend')}
            </button>
          ) : RESENDABLE.includes(data.status) && !canManage ? (
            <span className="invitation-no-permission" title={t('invitationNoPermissionResend')}>
              {t('invitationResend')} — {t('invitationNoPermissionResend')}
            </span>
          ) : null}
          {canCancelItem ? (
            <button
              type="button"
              className="btn-delete"
              onClick={() => setCancelConfirm(true)}
            >
              {t('invitationCancel')}
            </button>
          ) : CANCELLABLE.includes(data.status) && !canManage ? (
            <span className="invitation-no-permission" title={t('invitationNoPermissionCancel')}>
              {t('invitationCancel')} — {t('invitationNoPermissionCancel')}
            </span>
          ) : null}
          <Link to="/dashboards/admin/invitations" className="btn-secondary">
            {t('backToList')}
          </Link>
        </div>
      </header>
      <div className="entity-view-card">
        <dl className="entity-view-dl entity-view-dl--two-cols">
          <dt>{t('invitationEmail')}</dt>
          <dd>{data.email}</dd>
        <dt>{t('invitationRoles')}</dt>
        <dd>
          {(data.roles ?? []).length === 0
            ? '—'
            : (data.roles ?? []).map((r) => t(getRoleLabelKey(r))).join(', ')}
        </dd>
          <dt>{t('name')}</dt>
          <dd>{fullName}</dd>
          <dt>{t('invitationStatus')}</dt>
          <dd>
            <span className={`invitation-status-badge invitation-status-badge--${data.status.toLowerCase()}`}>
              {t(statusKey(data.status))}
            </span>
          </dd>
          <dt>{t('invitationExpiresAt')}</dt>
          <dd>{formatDateTime(data.expiresAt, locale)}</dd>
          <dt>{t('invitationCreatedAt')}</dt>
          <dd>{formatDateTime(data.createdAt, locale)}</dd>
          <dt>{t('invitationEmailSentAt')}</dt>
          <dd>{data.emailSentAt ? formatDateTime(data.emailSentAt, locale) : '—'}</dd>
          <dt>{t('invitationEmailAttempts')}</dt>
          <dd>{data.emailAttempts}</dd>
          <dt>{t('invitationAcceptedAt')}</dt>
          <dd>{data.acceptedAt ? formatDateTime(data.acceptedAt, locale) : '—'}</dd>
          <dt>{t('invitationInvitedBy')}</dt>
          <dd>{data.invitedById}</dd>
        </dl>
      </div>

      {resendConfirm && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setResendConfirm(false)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('invitationResendConfirmTitle')}</h3>
            <p>{t('invitationResendConfirmText')}</p>
            <div className="department-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setResendConfirm(false)}>
                {tCommon('cancel')}
              </button>
              <button type="button" className="btn-primary" disabled={resending} onClick={handleResend}>
                {resending ? tCommon('submitting') : t('invitationResend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelConfirm && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setCancelConfirm(false)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('invitationCancelConfirmTitle')}</h3>
            <p>{t('invitationCancelConfirmText')}</p>
            <div className="department-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setCancelConfirm(false)}>
                {tCommon('cancel')}
              </button>
              <button type="button" className="btn-delete" disabled={cancelling} onClick={handleCancel}>
                {cancelling ? tCommon('submitting') : t('invitationCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

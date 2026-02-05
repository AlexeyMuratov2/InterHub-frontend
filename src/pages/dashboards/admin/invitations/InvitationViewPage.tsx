import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getInvitation, resendInvitation, cancelInvitation } from '../../../../shared/api';
import type { InvitationDto } from '../../../../shared/api';
import { useCanManageInvitations } from '../../../../app/hooks/useCanManageInvitations';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getDisplayName } from '../../../../shared/lib';
import { Alert, ConfirmModal } from '../../../../shared/ui';
import { EntityViewLayout } from '../../../../widgets/entity-view-layout';
import { CANCELLABLE, getInvitationStatusLabelKey, getRoleLabelKey, RESENDABLE } from './utils';

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

  const canResend = data && canManage && RESENDABLE.includes(data.status);
  const canCancelItem = data && canManage && CANCELLABLE.includes(data.status);
  const fullName = data ? getDisplayName(data.firstName, data.lastName, data.email ?? '') || '—' : '—';

  return (
    <EntityViewLayout
      loading={loading}
      notFound={notFound}
      error={error != null && !data ? error : null}
      notFoundMessage={t('invitationNotFound')}
      errorMessage={error ?? t('invitationErrorLoad')}
      backTo="/dashboards/admin/invitations"
      backLabel={tCommon('back')}
      viewOnly={!canManage}
      viewOnlyMessage={t('invitationViewOnlyHint')}
      title={t('invitationViewPageTitle')}
      loadingMessage={t('loadingList')}
      extraActions={
        <>
          {data && (canResend ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setResendConfirm(true)}
            >
              {t('invitationResend')}
            </button>
          ) : data && RESENDABLE.includes(data.status) && !canManage ? (
            <span className="invitation-no-permission" title={t('invitationNoPermissionResend')}>
              {t('invitationResend')} — {t('invitationNoPermissionResend')}
            </span>
          ) : null)}
          {data && (canCancelItem ? (
            <button
              type="button"
              className="btn-delete"
              onClick={() => setCancelConfirm(true)}
            >
              {t('invitationCancel')}
            </button>
          ) : data && CANCELLABLE.includes(data.status) && !canManage ? (
            <span className="invitation-no-permission" title={t('invitationNoPermissionCancel')}>
              {t('invitationCancel')} — {t('invitationNoPermissionCancel')}
            </span>
          ) : null)}
        </>
      }
    >
      {data && (
        <>
          {error != null && error !== '' && (
            <Alert variant="error" role="alert">
              {error}
            </Alert>
          )}
          <div className="entity-view-card invitation-view-page">
            <dl className="entity-view-dl entity-view-dl--two-cols">
              <dt>{t('invitationEmail')}</dt>
              <dd>{data.email ?? '—'}</dd>
              <dt>{t('invitationRoles')}</dt>
              <dd>
                {(data.roles ?? []).length === 0
                  ? '—'
                  : (data.roles ?? []).map((r) => t(getRoleLabelKey(r))).join(', ')}
              </dd>
              <dt>{t('name')}</dt>
              <dd>
                {data.userId ? (
                  <Link
                    to={`/dashboards/admin/accounts/${data.userId}`}
                    className="invitation-user-link"
                  >
                    {fullName}
                  </Link>
                ) : (
                  fullName
                )}
              </dd>
              <dt>{t('invitationStatus')}</dt>
              <dd>
                <span className={`invitation-status-badge invitation-status-badge--${data.status.toLowerCase()}`}>
                  {t(getInvitationStatusLabelKey(data.status))}
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
              <dd>{data.invitedById ?? '—'}</dd>
            </dl>
          </div>

          <ConfirmModal
            open={resendConfirm}
            title={t('invitationResendConfirmTitle')}
            message={t('invitationResendConfirmText')}
            onCancel={() => setResendConfirm(false)}
            onConfirm={handleResend}
            cancelLabel={tCommon('cancel')}
            confirmLabel={resending ? tCommon('submitting') : t('invitationResend')}
            confirmDisabled={resending}
          />

          <ConfirmModal
            open={cancelConfirm}
            title={t('invitationCancelConfirmTitle')}
            message={t('invitationCancelConfirmText')}
            onCancel={() => setCancelConfirm(false)}
            onConfirm={handleCancel}
            cancelLabel={tCommon('cancel')}
            confirmLabel={cancelling ? tCommon('submitting') : t('invitationCancel')}
            confirmDisabled={cancelling}
            confirmVariant="danger"
          />
        </>
      )}
    </EntityViewLayout>
  );
}

/**
 * Диалог подачи заявки об отсутствии на конкретный урок.
 * Стиль entity-detail (ed-*): hero с данными урока, форма с типом заявки и причиной.
 */
import { useState, useCallback } from 'react';
import { FileText, Calendar, Send, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { createAbsenceNotice } from '../../api';
import type { AbsenceNoticeType } from '../../api';
import { Modal, Alert, FormGroup } from '..';

const MAX_REASON_LENGTH = 2000;

export interface AbsenceRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** ID урока (lesson session id) */
  lessonId: string;
  /** Название предмета для отображения в hero */
  subjectName: string;
  /** Подзаголовок: дата и время урока */
  lessonDateTime?: string;
}

export function AbsenceRequestDialog({
  open,
  onClose,
  onSuccess,
  lessonId,
  subjectName,
  lessonDateTime,
}: AbsenceRequestDialogProps) {
  const { t } = useTranslation('dashboard');
  const [type, setType] = useState<AbsenceNoticeType>('ABSENT');
  const [reasonText, setReasonText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setType('ABSENT');
    setReasonText('');
    setError(null);
    setSuccess(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  }, [onClose, resetForm, submitting]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      const res = await createAbsenceNotice({
        lessonSessionIds: [lessonId],
        type,
        reasonText: reasonText.trim() || undefined,
        fileIds: [],
      });
      setSubmitting(false);
      if (res.error) {
        setError(res.error.message ?? t('absenceRequestErrorSubmit'));
        return;
      }
      setSuccess(true);
      onSuccess?.();
      setTimeout(handleClose, 1500);
    },
    [lessonId, type, reasonText, t, onSuccess, handleClose]
  );

  const reasonLength = reasonText.length;
  const reasonOverLimit = reasonLength > MAX_REASON_LENGTH;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('absenceRequestDialogTitle')}
      variant="form"
      modalClassName="ed-absence-request-dialog"
    >
      <div className="ed-absence-request-dialog__body">
        <div className="ed-absence-request-dialog__hero">
          <div className="ed-absence-request-dialog__hero-icon">
            <FileText size={24} aria-hidden />
          </div>
          <div className="ed-absence-request-dialog__hero-text">
            <span className="ed-absence-request-dialog__hero-subject">
              {subjectName}
            </span>
            {lessonDateTime && (
              <span className="ed-absence-request-dialog__hero-meta">
                <Calendar size={14} aria-hidden />
                {lessonDateTime}
              </span>
            )}
          </div>
        </div>

        {success ? (
          <div className="ed-absence-request-dialog__success" role="status">
            <Send size={20} aria-hidden />
            <span>{t('absenceRequestSuccess')}</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="ed-absence-request-dialog__form"
            noValidate
          >
            {error && (
              <Alert variant="error" role="alert" style={{ marginBottom: '1rem' }}>
                {error}
              </Alert>
            )}

            <div className="ed-absence-request-dialog__type-row">
              <span className="ed-absence-request-dialog__type-label">
                {t('absenceRequestsNoticeType')} *
              </span>
              <div className="ed-absence-request-dialog__type-options">
                <button
                  type="button"
                  className={`ed-absence-request-dialog__type-option ${
                    type === 'ABSENT' ? 'ed-absence-request-dialog__type-option--active' : ''
                  }`}
                  onClick={() => setType('ABSENT')}
                  aria-pressed={type === 'ABSENT'}
                >
                  <span className="ed-absence-request-dialog__type-option-label">
                    {t('absenceRequestsNoticeTypeAbsent')}
                  </span>
                  <span className="ed-absence-request-dialog__type-option-desc">
                    {t('absenceRequestTypeAbsentDesc')}
                  </span>
                </button>
                <button
                  type="button"
                  className={`ed-absence-request-dialog__type-option ${
                    type === 'LATE' ? 'ed-absence-request-dialog__type-option--active' : ''
                  }`}
                  onClick={() => setType('LATE')}
                  aria-pressed={type === 'LATE'}
                >
                  <span className="ed-absence-request-dialog__type-option-label">
                    {t('absenceRequestsNoticeTypeLate')}
                  </span>
                  <span className="ed-absence-request-dialog__type-option-desc">
                    {t('absenceRequestTypeLateDesc')}
                  </span>
                </button>
              </div>
            </div>

            <FormGroup
              label={t('absenceRequestsReason')}
              htmlFor="absence-request-reason"
              hint={t('absenceRequestReasonHint')}
            >
              <textarea
                id="absence-request-reason"
                className="ed-absence-request-dialog__reason"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={t('absenceRequestReasonPlaceholder')}
                rows={4}
                maxLength={MAX_REASON_LENGTH + 1}
                aria-invalid={reasonOverLimit}
                disabled={submitting}
              />
              <div className="ed-absence-request-dialog__reason-footer">
                <span className={reasonOverLimit ? 'ed-absence-request-dialog__count--over' : ''}>
                  {reasonLength} / {MAX_REASON_LENGTH}
                </span>
              </div>
            </FormGroup>

            <div className="ed-absence-request-dialog__actions">
              <button
                type="button"
                className="btn-secondary ed-absence-request-dialog__btn-cancel"
                onClick={handleClose}
                disabled={submitting}
              >
                {t('absenceRequestsClose')}
              </button>
              <button
                type="submit"
                className="btn-primary ed-absence-request-dialog__btn-submit"
                disabled={submitting || reasonOverLimit}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="ed-absence-request-dialog__spinner" aria-hidden />
                    {t('absenceRequestSubmitting')}
                  </>
                ) : (
                  <>
                    <Send size={18} aria-hidden />
                    {t('absenceRequestSubmit')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

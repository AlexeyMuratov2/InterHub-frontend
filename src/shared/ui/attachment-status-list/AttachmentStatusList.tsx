import { useMemo } from 'react';
import { useTranslation } from '../../i18n';
import { formatFileSize } from '../../lib/fileUtils';
import { isDocumentAttachmentFailed, isDocumentAttachmentReady } from '../../lib/documentAttachment';
import type { DocumentAttachmentDto } from '../../api';
import { CheckCircle2, Download, FileText, LoaderCircle, ShieldAlert, Trash2 } from 'lucide-react';
import './attachment-status-list.css';

export interface AttachmentStatusListProps {
  attachments: DocumentAttachmentDto[];
  onDownload?: (attachment: DocumentAttachmentDto) => void;
  onDelete?: (attachment: DocumentAttachmentDto) => void;
  emptyText?: string;
}

function translateOrFallback(
  t: (key: string, params?: Record<string, string | number>) => string,
  key: string,
  fallback: string,
  params?: Record<string, string | number>
): string {
  const translated = t(key, params);
  if (translated !== key) {
    return translated;
  }

  return Object.entries(params ?? {}).reduce(
    (current, [paramKey, paramValue]) => current.replaceAll(`{{${paramKey}}}`, String(paramValue)),
    fallback
  );
}

function clampProgress(progressPercent: number): number {
  if (!Number.isFinite(progressPercent)) return 0;
  return Math.max(0, Math.min(100, progressPercent));
}

function getStageTranslationKey(stage: DocumentAttachmentDto['stage']): string {
  switch (stage) {
    case 'SCANNING':
      return 'attachmentStageScanning';
    case 'FINALIZING':
      return 'attachmentStageFinalizing';
    case 'READY':
      return 'attachmentStageReady';
    case 'FAILED':
      return 'attachmentStageFailed';
    case 'RECEIVED':
    default:
      return 'attachmentStageReceived';
  }
}

function getStageFallback(stage: DocumentAttachmentDto['stage']): string {
  switch (stage) {
    case 'SCANNING':
      return 'Security scan';
    case 'FINALIZING':
      return 'Finalizing';
    case 'READY':
      return 'Ready';
    case 'FAILED':
      return 'Failed';
    case 'RECEIVED':
    default:
      return 'Received';
  }
}

function getTone(attachment: DocumentAttachmentDto): 'ready' | 'failed' | 'processing' {
  if (isDocumentAttachmentReady(attachment)) return 'ready';
  if (isDocumentAttachmentFailed(attachment)) return 'failed';
  return 'processing';
}

export function AttachmentStatusList({
  attachments,
  onDownload,
  onDelete,
  emptyText,
}: AttachmentStatusListProps) {
  const { t } = useTranslation('dashboard');

  const orderedAttachments = useMemo(() => attachments, [attachments]);

  if (orderedAttachments.length === 0) {
    return emptyText ? <p className="ed-attachment-list__empty">{emptyText}</p> : null;
  }

  return (
    <div className="ed-attachment-list">
      {orderedAttachments.map((attachment) => {
        const progressPercent = clampProgress(attachment.progressPercent);
        const remainingPercent = Math.max(0, 100 - progressPercent);
        const tone = getTone(attachment);
        const Icon = tone === 'ready' ? CheckCircle2 : tone === 'failed' ? ShieldAlert : LoaderCircle;

        return (
          <article
            key={attachment.id}
            className={`ed-attachment-card ed-attachment-card--${tone}`}
          >
            <div className="ed-attachment-card__header">
              <div className="ed-attachment-card__icon-wrap">
                {tone === 'processing' ? (
                  <LoaderCircle className="ed-attachment-card__spinner" aria-hidden />
                ) : (
                  <FileText aria-hidden />
                )}
              </div>
              <div className="ed-attachment-card__meta">
                <div className="ed-attachment-card__title-row">
                  <h4 className="ed-attachment-card__title">
                    {attachment.fileName?.trim()
                      || translateOrFallback(t, 'attachmentUntitled', 'Attachment')}
                  </h4>
                  <span className={`ed-attachment-card__badge ed-attachment-card__badge--${tone}`}>
                    <Icon aria-hidden />
                    {translateOrFallback(
                      t,
                      getStageTranslationKey(attachment.stage),
                      getStageFallback(attachment.stage)
                    )}
                  </span>
                </div>
                <div className="ed-attachment-card__details">
                  <span>{formatFileSize(attachment.sizeBytes)}</span>
                  <span className="ed-attachment-card__separator" aria-hidden />
                  <span>{attachment.declaredContentType || 'application/octet-stream'}</span>
                </div>
              </div>
              <div className="ed-attachment-card__actions">
                {onDownload && attachment.downloadAvailable && (
                  <button
                    type="button"
                    className="btn-secondary ed-attachment-card__action-btn"
                    onClick={() => onDownload(attachment)}
                    title={t('download')}
                  >
                    <Download aria-hidden />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="btn-secondary ed-attachment-card__action-btn ed-attachment-card__action-btn--danger"
                    onClick={() => onDelete(attachment)}
                    title={t('delete')}
                  >
                    <Trash2 aria-hidden />
                  </button>
                )}
              </div>
            </div>

            <div className="ed-attachment-card__progress-shell" aria-hidden>
              <div
                className={`ed-attachment-card__progress ed-attachment-card__progress--${tone}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="ed-attachment-card__footer">
              {tone === 'failed' ? (
                <span className="ed-attachment-card__hint ed-attachment-card__hint--failed">
                  {attachment.failureCode
                    ? translateOrFallback(
                        t,
                        'attachmentFailedWithCode',
                        'The file could not be prepared ({{code}}).',
                        { code: attachment.failureCode }
                      )
                    : translateOrFallback(t, 'attachmentFailed', 'The file could not be prepared.')}
                </span>
              ) : tone === 'ready' ? (
                <span className="ed-attachment-card__hint ed-attachment-card__hint--ready">
                  {attachment.downloadAvailable
                    ? translateOrFallback(t, 'attachmentReadyToDownload', 'The file is ready to download.')
                    : translateOrFallback(t, 'attachmentReady', 'The file is ready.')}
                </span>
              ) : (
                <span className="ed-attachment-card__hint">
                  {translateOrFallback(
                    t,
                    'attachmentProgressStatus',
                    '{{progress}}% ready · {{remaining}}% left',
                    {
                      progress: progressPercent,
                      remaining: remainingPercent,
                    }
                  )}
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

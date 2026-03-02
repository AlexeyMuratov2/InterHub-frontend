/**
 * Диалог просмотра заявок студента по уроку (из ростера посещаемости).
 * Показывает список заявок: тип, статус, отменена ли, описание, время отправки, файлы.
 */
import { useTranslation } from '../../i18n';
import { Modal, DetailFileRow, InfoTile } from '..';
import type { LessonRosterNoticeDto } from '../../api';

function getNoticeTypeKey(type: string): string {
  return type === 'LATE' ? 'attendanceNoticeTypeLate' : 'attendanceNoticeTypeAbsent';
}

function getNoticeStatusKey(status: string): string {
  switch (status) {
    case 'SUBMITTED':
      return 'attendanceNoticeStatusSubmitted';
    case 'APPROVED':
      return 'attendanceNoticeStatusApproved';
    case 'REJECTED':
      return 'attendanceNoticeStatusRejected';
    case 'CANCELED':
      return 'attendanceNoticeStatusCanceled';
    default:
      return 'attendanceNoticeStatusSubmitted';
  }
}

function formatSubmittedAt(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
}

export interface AbsenceNoticesViewDialogProps {
  open: boolean;
  onClose: () => void;
  /** Имя студента для заголовка */
  studentDisplayName: string;
  /** Список заявок (в т.ч. отменённых) */
  notices: LessonRosterNoticeDto[];
  /** Скачивание файла по id (например getFileDownloadUrl + open) */
  onDownloadFile?: (fileId: string) => void | Promise<void>;
}

export function AbsenceNoticesViewDialog({
  open,
  onClose,
  studentDisplayName,
  notices,
  onDownloadFile,
}: AbsenceNoticesViewDialogProps) {
  const { t, locale } = useTranslation('dashboard');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('attendanceNoticesDialogTitle', { name: studentDisplayName })}
      variant="form"
      modalClassName="ed-absence-notices-view-dialog"
    >
      <div className="ed-absence-notices-view-dialog__body">
        {!notices?.length ? (
          <p className="ed-absence-notices-view-dialog__empty">{t('attendanceNoNotice')}</p>
        ) : (
          <ul className="ed-absence-notices-view-dialog__list" role="list">
            {notices.map((notice) => {
              const isWithdrawn = notice.status === 'CANCELED';
              const itemClass = [
                'ed-absence-notices-view-dialog__item',
                isWithdrawn ? 'ed-absence-notices-view-dialog__item--withdrawn' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <li key={notice.id} className={itemClass}>
                  {isWithdrawn && (
                    <div className="ed-absence-notices-view-dialog__withdrawn-banner" role="status">
                      {t('attendanceNoticeWithdrawnByStudent')}
                    </div>
                  )}
                  <div className="ed-absence-notices-view-dialog__item-header">
                    <span
                      className={`ed-absence-notices-view-dialog__type ed-absence-notices-view-dialog__type--${notice.type.toLowerCase()}`}
                    >
                      {t(getNoticeTypeKey(notice.type))}
                    </span>
                    {!isWithdrawn && (
                      <span className="ed-absence-notices-view-dialog__status">
                        {t(getNoticeStatusKey(notice.status))}
                      </span>
                    )}
                  </div>
                  <InfoTile
                    label={t('absenceRequestsSubmittedAt')}
                    value={formatSubmittedAt(notice.submittedAt, locale)}
                  />
                  {notice.reasonText != null && notice.reasonText.trim() !== '' && (
                    <div className="ed-absence-notices-view-dialog__reason">
                      <span className="ed-absence-notices-view-dialog__reason-label">
                        {t('absenceRequestsReason')}:
                      </span>
                      <p className="ed-absence-notices-view-dialog__reason-text">
                        {notice.reasonText}
                      </p>
                    </div>
                  )}
                  {notice.fileIds?.length ? (
                    <div className="ed-absence-notices-view-dialog__files">
                      <span className="ed-absence-notices-view-dialog__files-label">
                        {t('absenceRequestsAttachments')}:
                      </span>
                      <div className="ed-absence-notices-view-dialog__files-list">
                        {notice.fileIds.map((fileId, idx) => (
                          <DetailFileRow
                            key={fileId}
                            title={t('attendanceNoticeFileLabel', { index: idx + 1 })}
                            onDownload={
                              onDownloadFile
                                ? () => {
                                    void onDownloadFile(fileId);
                                  }
                                : undefined
                            }
                            downloadLabel={t('download')}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <div className="ed-absence-notices-view-dialog__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            {t('absenceRequestsClose')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

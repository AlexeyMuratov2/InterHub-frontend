import type { TimeslotDto } from '../../../../../entities/schedule';
import { useTranslation } from '../../../../../shared/i18n';
import { Modal } from '../../../../../shared/ui';

/** Normalize API time "HH:mm:ss" or "HH:mm" to "HH:mm" for display */
function timeDisplay(s: string): string {
  if (!s) return '';
  return s.length > 5 ? s.slice(0, 5) : s;
}

export interface SlotDetailModalProps {
  open: boolean;
  onClose: () => void;
  slot: TimeslotDto | null;
  dayLabel: string;
  onDelete: () => void;
  deleting: boolean;
  canDelete?: boolean;
}

export function SlotDetailModal({
  open,
  onClose,
  slot,
  dayLabel,
  onDelete,
  deleting,
  canDelete = true,
}: SlotDetailModalProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  if (!slot) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('timeslotSlotDetailTitle')}
      variant="form"
      modalClassName="timeslot-detail-modal"
    >
      <div className="timeslot-detail-body">
        <dl className="timeslot-detail-dl">
          <dt>{t('timeslotDayLabel')}</dt>
          <dd>{dayLabel}</dd>
          <dt>{t('timeslotStartTime')}</dt>
          <dd>{timeDisplay(slot.startTime)}</dd>
          <dt>{t('timeslotEndTime')}</dt>
          <dd>{timeDisplay(slot.endTime)}</dd>
        </dl>
        <p className="timeslot-detail-hint">{t('timeslotsSubtitle')}</p>
      </div>
      <div className="department-modal-actions timeslot-detail-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onClose}
        >
          {tCommon('cancelButton')}
        </button>
        <button
          type="button"
          className="btn-delete"
          disabled={deleting || !canDelete}
          onClick={onDelete}
          aria-label={tCommon('delete')}
          title={!canDelete ? t('viewOnlyNotice') : undefined}
        >
          {deleting ? tCommon('submitting') : tCommon('delete')}
        </button>
      </div>
    </Modal>
  );
}

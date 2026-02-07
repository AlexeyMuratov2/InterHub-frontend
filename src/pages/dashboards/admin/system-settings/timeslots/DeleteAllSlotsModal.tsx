import { useTranslation } from '../../../../../shared/i18n';
import { ConfirmModal } from '../../../../../shared/ui';

export interface DeleteAllSlotsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
}

export function DeleteAllSlotsModal({
  open,
  onClose,
  onConfirm,
  confirming,
}: DeleteAllSlotsModalProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  return (
    <ConfirmModal
      open={open}
      title={t('timeslotDeleteAllConfirmTitle')}
      message={t('timeslotDeleteAllConfirmText')}
      onCancel={onClose}
      onConfirm={onConfirm}
      cancelLabel={tCommon('cancelButton')}
      confirmLabel={confirming ? tCommon('submitting') : tCommon('delete')}
      confirmDisabled={confirming}
      confirmVariant="danger"
    />
  );
}

import { useState, useEffect } from 'react';
import type { CreateTimeslotRequest } from '../../../../../entities/schedule';
import { useTranslation } from '../../../../../shared/i18n';
import { Modal, FormGroup, FormActions, Alert } from '../../../../../shared/ui';

export interface AddOneSlotModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: CreateTimeslotRequest) => Promise<{ error?: { message?: string } }>;
  onSuccess: () => void;
}

const DEFAULT_START = '09:00';
const DEFAULT_END = '10:30';

export function AddOneSlotModal({ open, onClose, onSubmit, onSuccess }: AddOneSlotModalProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setDayOfWeek(1);
      setStartTime(DEFAULT_START);
      setEndTime(DEFAULT_END);
      setError(null);
      setFieldErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!startTime?.trim()) err.startTime = t('timeslotErrorStartRequired');
    if (!endTime?.trim()) err.endTime = t('timeslotErrorEndRequired');
    if (startTime && endTime && endTime <= startTime) {
      err.endTime = t('timeslotErrorEndAfterStart');
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const res = await onSubmit({
      dayOfWeek,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message ?? t('timeslotBulkError'));
      return;
    }
    onSuccess();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('timeslotAddOneTitle')}
      variant="form"
      modalClassName="timeslot-add-one-modal"
    >
      <form className="department-form" onSubmit={handleSubmit}>
        {error && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <Alert variant="error" role="alert">
              {error}
            </Alert>
          </div>
        )}
        <FormGroup
          label={t('timeslotDayLabel')}
          htmlFor="add-one-day"
          error={fieldErrors.dayOfWeek}
        >
          <select
            id="add-one-day"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            aria-invalid={!!fieldErrors.dayOfWeek}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {t(`timeslotDay${d}`)}
              </option>
            ))}
          </select>
        </FormGroup>
        <FormGroup
          label={t('timeslotStartTime')}
          htmlFor="add-one-start"
          error={fieldErrors.startTime}
        >
          <input
            id="add-one-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            aria-invalid={!!fieldErrors.startTime}
          />
        </FormGroup>
        <FormGroup
          label={t('timeslotEndTime')}
          htmlFor="add-one-end"
          error={fieldErrors.endTime}
        >
          <input
            id="add-one-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            aria-invalid={!!fieldErrors.endTime}
          />
        </FormGroup>
        <FormActions
          submitLabel={submitting ? t('timeslotCreating') : tCommon('create')}
          submitting={submitting}
          onCancel={onClose}
          cancelLabel={tCommon('cancelButton')}
        />
      </form>
    </Modal>
  );
}

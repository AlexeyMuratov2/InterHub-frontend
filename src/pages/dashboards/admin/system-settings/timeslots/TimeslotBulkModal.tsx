import { useState, useEffect } from 'react';
import type { CreateTimeslotRequest } from '../../../../../entities/schedule';
import { useTranslation } from '../../../../../shared/i18n';
import { Modal, FormGroup, FormActions, Alert } from '../../../../../shared/ui';

export interface TimeslotBulkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: CreateTimeslotRequest[]) => Promise<{ data?: unknown[]; error?: { message?: string } }>;
  onSuccess: (createdCount: number) => void;
}

const DEFAULT_ROW = { startTime: '09:00', endTime: '10:30' };

export function TimeslotBulkModal({
  open,
  onClose,
  onSubmit,
  onSuccess,
}: TimeslotBulkModalProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const [rows, setRows] = useState<Array<{ startTime: string; endTime: string }>>([
    { ...DEFAULT_ROW },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setRows([{ ...DEFAULT_ROW }]);
      setError(null);
      setFieldErrors({});
    }
  }, [open]);

  const addRow = () => {
    setRows((prev) => [...prev, { ...DEFAULT_ROW }]);
  };

  const updateRow = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    rows.forEach((row, i) => {
      if (!row.startTime?.trim()) err[`start_${i}`] = t('timeslotErrorStartRequired');
      if (!row.endTime?.trim()) err[`end_${i}`] = t('timeslotErrorEndRequired');
      if (row.startTime && row.endTime && row.endTime <= row.startTime) {
        err[`end_${i}`] = t('timeslotErrorEndAfterStart');
      }
    });
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    const items: CreateTimeslotRequest[] = [];
    for (const row of rows) {
      for (let day = 1; day <= 7; day++) {
        items.push({
          dayOfWeek: day,
          startTime: row.startTime.trim(),
          endTime: row.endTime.trim(),
        });
      }
    }
    setSubmitting(true);
    const res = await onSubmit(items);
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message ?? t('timeslotBulkError'));
      return;
    }
    onSuccess(res.data?.length ?? 0);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('timeslotBulkTitle')}
      variant="form"
      modalClassName="timeslot-bulk-modal"
    >
      <form className="department-form" onSubmit={handleSubmit}>
        {error && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <Alert variant="error" role="alert">
              {error}
            </Alert>
          </div>
        )}
        <p className="timeslot-bulk-hint">{t('timeslotBulkHint')}</p>
        {rows.map((row, index) => (
          <div key={index} className="timeslot-bulk-row">
            <FormGroup
              label={t('timeslotStartTime')}
              htmlFor={`bulk-start-${index}`}
              error={fieldErrors[`start_${index}`]}
            >
              <input
                id={`bulk-start-${index}`}
                type="time"
                value={row.startTime}
                onChange={(e) => updateRow(index, 'startTime', e.target.value)}
                aria-invalid={!!fieldErrors[`start_${index}`]}
              />
            </FormGroup>
            <FormGroup
              label={t('timeslotEndTime')}
              htmlFor={`bulk-end-${index}`}
              error={fieldErrors[`end_${index}`]}
            >
              <input
                id={`bulk-end-${index}`}
                type="time"
                value={row.endTime}
                onChange={(e) => updateRow(index, 'endTime', e.target.value)}
                aria-invalid={!!fieldErrors[`end_${index}`]}
              />
            </FormGroup>
            <div className="timeslot-bulk-row-actions">
              {rows.length > 1 && (
                <button
                  type="button"
                  className="department-table-btn department-table-btn--danger"
                  onClick={() => removeRow(index)}
                  aria-label={tCommon('delete')}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="department-table-btn"
          onClick={addRow}
          style={{ marginBottom: '1rem' }}
        >
          + {t('timeslotAddRow')}
        </button>
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

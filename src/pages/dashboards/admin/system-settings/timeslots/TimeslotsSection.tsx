import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchTimeslots,
  createTimeslot,
  createTimeslotsBulk,
  deleteTimeslot,
  deleteTimeslotsAll,
  type TimeslotDto,
  type CreateTimeslotRequest,
} from '../../../../../entities/schedule';
import { useCanEditInAdmin } from '../../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../../shared/i18n';
import { Alert } from '../../../../../shared/ui';
import { SlotDetailModal } from './SlotDetailModal';
import { AddOneSlotModal } from './AddOneSlotModal';
import { TimeslotBulkModal } from './TimeslotBulkModal';
import { DeleteAllSlotsModal } from './DeleteAllSlotsModal';
import { ConfirmModal } from '../../../../../shared/ui';

/** "HH:mm:ss" or "HH:mm" → "HH:mm" */
function timeDisplay(s: string): string {
  if (!s) return '';
  return s.length > 5 ? s.slice(0, 5) : s;
}

const DAY_KEYS = ['timeslotDay1', 'timeslotDay2', 'timeslotDay3', 'timeslotDay4', 'timeslotDay5', 'timeslotDay6', 'timeslotDay7'] as const;

export function TimeslotsSection() {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  /** MODERATOR, ADMIN, SUPER_ADMIN can create/delete timeslots (per schedule API contract) */
  const canEdit = useCanEditInAdmin();

  const [slots, setSlots] = useState<TimeslotDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [addOneOpen, setAddOneOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [detailSlot, setDetailSlot] = useState<TimeslotDto | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const loadSlots = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchTimeslots().then(({ data, error: err }) => {
      setLoading(false);
      if (err) {
        setError(err.message ?? null);
        setSlots([]);
        return;
      }
      setSlots(data ?? []);
    });
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const slotsByDay = useMemo(() => {
    const map = new Map<number, TimeslotDto[]>();
    for (let d = 1; d <= 7; d++) {
      map.set(d, []);
    }
    for (const s of slots) {
      const list = map.get(s.dayOfWeek) ?? [];
      list.push(s);
      map.set(s.dayOfWeek, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));
    }
    return map;
  }, [slots]);

  const handleCreateOne = async (body: CreateTimeslotRequest) => {
    return createTimeslot(body);
  };

  const handleCreateBulk = async (items: CreateTimeslotRequest[]) => {
    return createTimeslotsBulk(items);
  };

  const handleDeleteFromDetail = () => {
    if (detailSlot) {
      setDeleteSlotId(detailSlot.id);
      setDetailSlot(null);
    }
  };

  const handleConfirmDeleteSlot = async () => {
    if (!deleteSlotId) return;
    setDeleting(true);
    setError(null);
    const { error: err } = await deleteTimeslot(deleteSlotId);
    setDeleting(false);
    setDeleteSlotId(null);
    if (err) {
      setError(err.message ?? t('timeslotErrorDelete', { status: String(err.status ?? '') }));
      return;
    }
    setSuccess(t('timeslotSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
    loadSlots();
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    setError(null);
    const { error: err } = await deleteTimeslotsAll();
    setDeletingAll(false);
    setDeleteAllOpen(false);
    if (err) {
      setError(err.message ?? t('timeslotErrorDeleteAll'));
      return;
    }
    setSuccess(t('timeslotDeleteAllSuccess'));
    setTimeout(() => setSuccess(null), 3000);
    loadSlots();
  };

  const onBulkSuccess = (createdCount: number) => {
    setSuccess(t('timeslotBulkSuccess', { count: String(createdCount) }));
    setTimeout(() => setSuccess(null), 3000);
    loadSlots();
  };

  const onAddOneSuccess = () => {
    setSuccess(t('timeslotAddOneSuccess'));
    setTimeout(() => setSuccess(null), 3000);
    loadSlots();
  };

  return (
    <section className="timeslots-section buildings-section" aria-labelledby="timeslots-heading">
      <h2 id="timeslots-heading" className="academic-summary-heading">
        {t('timeslotsTitle')}
      </h2>
      <p className="department-page-subtitle timeslots-section-subtitle">
        {t('timeslotsSubtitle')}
      </p>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" role="status">
          {success}
        </Alert>
      )}

      {!canEdit && (
        <p className="department-page-subtitle" style={{ color: '#64748b', marginBottom: '1rem' }}>
          {t('viewOnlyNotice')}
        </p>
      )}

      {canEdit && (
        <div className="timeslots-toolbar">
          <button
            type="button"
            className="department-table-btn department-table-btn--primary"
            onClick={() => setBulkOpen(true)}
          >
            {t('timeslotAddToEachDay')}
          </button>
          <button
            type="button"
            className="department-table-btn"
            onClick={() => setAddOneOpen(true)}
          >
            {t('timeslotAddOne')}
          </button>
          <button
            type="button"
            className="department-table-btn department-table-btn--danger"
            onClick={() => setDeleteAllOpen(true)}
            disabled={slots.length === 0}
          >
            {t('timeslotDeleteAll')}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>{t('loadingList')}</p>
      ) : (
        <div className="timeslots-by-day">
          {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => {
            const daySlots = slotsByDay.get(day) ?? [];
            const dayLabel = t(DAY_KEYS[day - 1]);
            return (
              <div key={day} className="timeslots-day-card">
                <h3 className="timeslots-day-title">{dayLabel}</h3>
                {daySlots.length === 0 ? (
                  <p className="timeslots-day-empty">{t('timeslotNoSlots')}</p>
                ) : (
                  <ul className="timeslots-day-list" role="list">
                    {daySlots.map((slot) => (
                      <li key={slot.id}>
                        <button
                          type="button"
                          className="timeslots-slot-button"
                          onClick={() => setDetailSlot(slot)}
                          aria-label={t('timeslotSlotDetailTitle')}
                        >
                          <span className="timeslots-slot-time">
                            {timeDisplay(slot.startTime)} – {timeDisplay(slot.endTime)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SlotDetailModal
        open={detailSlot != null}
        onClose={() => setDetailSlot(null)}
        slot={detailSlot}
        dayLabel={detailSlot ? t(DAY_KEYS[detailSlot.dayOfWeek - 1]) : ''}
        onDelete={handleDeleteFromDetail}
        deleting={deleting}
        canDelete={canEdit}
      />

      <ConfirmModal
        open={deleteSlotId != null}
        title={t('timeslotDeleteConfirmTitle')}
        message={t('timeslotDeleteConfirmText')}
        onCancel={() => setDeleteSlotId(null)}
        onConfirm={handleConfirmDeleteSlot}
        cancelLabel={tCommon('cancelButton')}
        confirmLabel={deleting ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deleting}
        confirmVariant="danger"
      />

      <AddOneSlotModal
        open={addOneOpen}
        onClose={() => setAddOneOpen(false)}
        onSubmit={handleCreateOne}
        onSuccess={onAddOneSuccess}
      />

      <TimeslotBulkModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSubmit={handleCreateBulk}
        onSuccess={onBulkSuccess}
      />

      <DeleteAllSlotsModal
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={handleDeleteAll}
        confirming={deletingAll}
      />
    </section>
  );
}

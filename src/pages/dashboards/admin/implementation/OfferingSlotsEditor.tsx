import { useState, useEffect } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import { FormGroup, FormActions, Alert, TimeslotsByDayGrid } from '../../../../shared/ui';
import { listTeachers } from '../../../../shared/api';
import { fetchRooms, fetchTimeslots } from '../../../../entities/schedule';
import {
  fetchOfferingSlots,
  createOfferingSlot,
  deleteOfferingSlot,
  type OfferingSlotDto,
} from '../../../../entities/offering';
import { OFFERING_LESSON_TYPES } from '../../../../entities/offering';

const DAY_KEYS: Record<number, string> = {
  1: 'timeslotDay1',
  2: 'timeslotDay2',
  3: 'timeslotDay3',
  4: 'timeslotDay4',
  5: 'timeslotDay5',
  6: 'timeslotDay6',
  7: 'timeslotDay7',
};

const LESSON_TYPE_KEYS: Record<string, string> = {
  LECTURE: 'implementationLessonTypeLecture',
  PRACTICE: 'implementationLessonTypePractice',
  LAB: 'implementationLessonTypeLab',
  SEMINAR: 'implementationLessonTypeSeminar',
};

export interface OfferingSlotsEditorProps {
  offeringId: string;
  onUpdate: () => void;
  highlightError?: boolean;
  /** Дефолтный преподаватель офферинга — подставляется в форму добавления слота */
  defaultTeacherId?: string | null;
  /** Дефолтная комната офферинга — подставляется в форму добавления слота */
  defaultRoomId?: string | null;
}

export function OfferingSlotsEditor({ offeringId, onUpdate, highlightError, defaultTeacherId, defaultRoomId }: OfferingSlotsEditorProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [slots, setSlots] = useState<OfferingSlotDto[]>([]);
  const [timeslots, setTimeslots] = useState<{ id: string; dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; displayName: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useTimeslot, setUseTimeslot] = useState(true);
  const [timeslotId, setTimeslotId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [lessonType, setLessonType] = useState('LECTURE');
  const [slotTeacherId, setSlotTeacherId] = useState('');
  const [slotRoomId, setSlotRoomId] = useState('');

  useEffect(() => {
    if (defaultTeacherId != null && defaultTeacherId !== '') setSlotTeacherId(defaultTeacherId);
  }, [defaultTeacherId]);
  useEffect(() => {
    if (defaultRoomId != null && defaultRoomId !== '') setSlotRoomId(defaultRoomId);
  }, [defaultRoomId]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOfferingSlots(offeringId).then(({ data, error: err }) => {
      setLoading(false);
      if (err) setError(err.message ?? null);
      else setSlots(data ?? []);
    });
    fetchTimeslots().then(({ data }) => setTimeslots((data ?? []).map((s) => ({ id: s.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }))));
    listTeachers({ limit: 100 }).then(({ data }) => {
      if (data?.items) setTeachers(data.items.map((i) => ({ id: i.profile.id, displayName: i.displayName })));
    });
    fetchRooms().then(({ data }) =>
      setRooms((data ?? []).map((r) => ({ id: r.id, label: r.buildingName + ' — ' + r.number })))
    );
  }, [offeringId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const body: Record<string, unknown> = {
      lessonType,
      roomId: slotRoomId || null,
      teacherId: slotTeacherId || null,
    };
    if (useTimeslot && timeslotId) {
      body.timeslotId = timeslotId;
    } else {
      body.dayOfWeek = dayOfWeek;
      body.startTime = startTime;
      body.endTime = endTime;
    }
    setAdding(true);
    const { data, error: err } = await createOfferingSlot(offeringId, body as any);
    setAdding(false);
    if (err) {
      setAddError(err.status === 409 ? t('implementationDuplicateSlot') : (err.message ?? t('implementationErrorLoadOfferings')));
      return;
    }
    if (data) {
      setSlots((prev) => [...prev, data]);
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteOfferingSlot(id);
    setDeletingId(null);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    onUpdate();
  };

  const teacherDisplayName = (id: string | null) => {
    if (!id) return '—';
    const x = teachers.find((t) => t.id === id);
    return x?.displayName ?? id;
  };
  const roomLabel = (id: string | null) => {
    if (!id) return '—';
    const r = rooms.find((x) => x.id === id);
    return r?.label ?? id;
  };

  /** Format time for display: "09:00:00" or "09:00" → "09:00" */
  const formatTime = (time: string) => (time ? time.slice(0, 5) : '—');

  if (loading) return <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('loading')}</p>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <section style={{ marginTop: '1.25rem', border: highlightError ? '1px solid #dc2626' : undefined, borderRadius: 8, padding: highlightError ? '0.75rem' : 0 }}>
      <h3 className="entity-view-card-title">{t('implementationWeeklySlots')}</h3>
      {lessonType === 'SEMINAR' && (
        <p className="form-hint" style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>
          {t('implementationSeminarHint')}
        </p>
      )}
      <div className="department-table-wrap implementation-slots-table-wrap" style={{ marginBottom: '1rem' }}>
        <table className="department-table implementation-slots-table" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>{t('implementationDayOfWeek')}</th>
              <th>{t('implementationSlotTime')}</th>
              <th>{t('implementationLessonType')}</th>
              <th>{t('implementationTeacher')}</th>
              <th>{t('implementationRoom')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id}>
                <td>{t(DAY_KEYS[slot.dayOfWeek] ?? '')}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatTime(slot.startTime)} — {formatTime(slot.endTime)}</td>
                <td>{t(LESSON_TYPE_KEYS[slot.lessonType] ?? slot.lessonType)}</td>
                <td>{teacherDisplayName(slot.teacherId)}</td>
                <td>{roomLabel(slot.roomId)}</td>
                <td>
                  <button
                    type="button"
                    className="btn-action-sm department-table-btn department-table-btn--danger"
                    onClick={() => handleDelete(slot.id)}
                    disabled={deletingId === slot.id}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleAdd} className="department-form">
        {addError && (
          <div style={{ marginBottom: '0.5rem' }}>
            <Alert variant="error">{addError}</Alert>
          </div>
        )}
        <FormGroup label={t('implementationLessonType')} htmlFor="slot-lesson-type">
          <select
            id="slot-lesson-type"
            value={lessonType}
            onChange={(e) => setLessonType(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            {OFFERING_LESSON_TYPES.map((lt) => (
              <option key={lt} value={lt}>
                {t(LESSON_TYPE_KEYS[lt] ?? lt)}
              </option>
            ))}
          </select>
        </FormGroup>
        <div className="implementation-slot-time-mode" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
            {t('implementationSlotTimeMode')}
          </div>
          <label
            htmlFor="slot-use-timeslot"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              width: 'fit-content',
            }}
          >
            <input
              type="radio"
              id="slot-use-timeslot"
              checked={useTimeslot}
              onChange={() => setUseTimeslot(true)}
              style={{ flexShrink: 0, margin: 0 }}
            />
            <span style={{ whiteSpace: 'nowrap' }}>{t('implementationSlotFromTimeslot')}</span>
          </label>
          {useTimeslot && (
            <div style={{ marginLeft: '1.5rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
              <TimeslotsByDayGrid
                slots={timeslots}
                getDayLabel={(day) => t(DAY_KEYS[day])}
                emptyMessage={t('timeslotNoSlots')}
                onSlotClick={(slot) => setTimeslotId(slot.id)}
                selectedId={timeslotId || null}
                formatTime={formatTime}
              />
            </div>
          )}
          <label
            htmlFor="slot-manual"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              width: 'fit-content',
            }}
          >
            <input
              type="radio"
              id="slot-manual"
              checked={!useTimeslot}
              onChange={() => setUseTimeslot(false)}
              style={{ flexShrink: 0, margin: 0 }}
            />
            <span style={{ whiteSpace: 'nowrap' }}>{t('implementationSlotManual')}</span>
          </label>
        </div>
        {!useTimeslot && (
          <>
            <FormGroup label={t('implementationDayOfWeek')} htmlFor="slot-day">
              <select id="slot-day" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {t(DAY_KEYS[d])}
                  </option>
                ))}
              </select>
            </FormGroup>
            <FormGroup label={t('implementationStartTime')} htmlFor="slot-start">
              <input
                id="slot-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </FormGroup>
            <FormGroup label={t('implementationEndTime')} htmlFor="slot-end">
              <input
                id="slot-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </FormGroup>
          </>
        )}
        <FormGroup label={t('implementationTeacher')} htmlFor="slot-teacher">
          <select id="slot-teacher" value={slotTeacherId} onChange={(e) => setSlotTeacherId(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
            <option value="">—</option>
            {teachers.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.displayName}
              </option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label={t('implementationRoom')} htmlFor="slot-room">
          <select id="slot-room" value={slotRoomId} onChange={(e) => setSlotRoomId(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
            <option value="">—</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </FormGroup>
        <FormActions
          submitLabel={adding ? tCommon('submitting') : t('implementationAddSlot')}
          submitting={adding}
          cancelLabel={tCommon('cancel')}
          onCancel={() => setAddError(null)}
        />
      </form>
    </section>
  );
}

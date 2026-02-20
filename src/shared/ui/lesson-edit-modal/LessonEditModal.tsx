/**
 * Модалка редактирования урока: работает с LessonDto напрямую.
 * Используется на странице деталей урока для редактирования и удаления.
 */
import { useState, useCallback, useEffect } from 'react';
import { useTranslation, useI18n, formatDate, formatTime } from '../../i18n';
import { parseFieldErrors } from '../../lib/parseFieldErrors';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { FormActions } from '../FormActions';
import { FormGroup } from '../FormGroup';
import { Alert } from '../Alert';
import { updateLesson, deleteLesson } from '../../api';
import type { LessonDto, RoomDto } from '../../api/types';
import '../lesson-modal/lesson-modal.css';

export interface LessonEditModalProps {
  open: boolean;
  onClose: () => void;
  lesson: LessonDto;
  rooms: RoomDto[];
  subjectName?: string;
  onUpdated: () => void;
  onDeleted: () => void;
}

const STATUS_KEYS = {
  PLANNED: 'lessonModalStatusPlanned',
  CANCELLED: 'lessonModalStatusCancelled',
  DONE: 'lessonModalStatusDone',
} as const;

function timeToInputValue(s: string): string {
  if (!s) return '';
  return s.length >= 5 ? s.slice(0, 5) : s;
}

export function LessonEditModal({
  open,
  onClose,
  lesson,
  rooms,
  subjectName,
  onUpdated,
  onDeleted,
}: LessonEditModalProps) {
  const { t } = useTranslation('dashboard');
  const { locale } = useI18n();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [editStart, setEditStart] = useState(() => timeToInputValue(lesson.startTime));
  const [editEnd, setEditEnd] = useState(() => timeToInputValue(lesson.endTime));
  const [editRoomId, setEditRoomId] = useState<string | null>(lesson.roomId);
  const [editTopic, setEditTopic] = useState(lesson.topic ?? '');
  const [editStatus, setEditStatus] = useState(lesson.status);

  const title = subjectName?.trim() || t('lessonModalTitleFallback');
  const statusLabel = t(STATUS_KEYS[lesson.status] as keyof typeof STATUS_KEYS);

  const timeDisplay = (() => {
    const start = lesson.startTime && lesson.date ? formatTime(`${lesson.date}T${lesson.startTime}`, locale) : '';
    const end = lesson.endTime && lesson.date ? formatTime(`${lesson.date}T${lesson.endTime}`, locale) : '';
    return start && end ? `${start} – ${end}` : `${timeToInputValue(lesson.startTime)}–${timeToInputValue(lesson.endTime)}`;
  })();

  const resetForm = useCallback(() => {
    setEditStart(timeToInputValue(lesson.startTime));
    setEditEnd(timeToInputValue(lesson.endTime));
    setEditRoomId(lesson.roomId);
    setEditTopic(lesson.topic ?? '');
    setEditStatus(lesson.status);
    setFormError(null);
    setFieldErrors({});
  }, [lesson]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    setFormError(null);
    onClose();
  }, [onClose, resetForm]);

  const handleSave = useCallback(async () => {
    const start = editStart.trim();
    const end = editEnd.trim();
    if (!start || !end) {
      setFieldErrors({ startTime: t('timeslotErrorStartRequired'), endTime: t('timeslotErrorEndRequired') });
      return;
    }
    const startM = parseInt(start.slice(0, 2), 10) * 60 + parseInt(start.slice(3, 5), 10);
    const endM = parseInt(end.slice(0, 2), 10) * 60 + parseInt(end.slice(3, 5), 10);
    if (endM <= startM) {
      setFieldErrors({ endTime: t('lessonModalErrorEndAfterStart') });
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        startTime: start.length === 5 ? start : start + ':00',
        endTime: end.length === 5 ? end : end + ':00',
        roomId: editRoomId,
        topic: editTopic.trim() || null,
        status: editStatus,
      };
      const result = await updateLesson(lesson.id, payload);
      if (result.error) {
        if (result.status === 403) {
          setFormError(t('lessonModalErrorForbidden'));
          return;
        }
        if (result.status === 404) {
          setFormError(t('lessonModalErrorNotFound'));
          handleClose();
          onUpdated();
          return;
        }
        const err = result.error as { details?: Record<string, string> };
        const details = err?.details;
        if (details && typeof details === 'object') {
          setFieldErrors(parseFieldErrors(details));
        }
        setFormError(result.error.message ?? t('lessonModalErrorNotFound'));
        return;
      }
      onUpdated();
      handleClose();
    } finally {
      setSaving(false);
    }
  }, [editStart, editEnd, editRoomId, editTopic, editStatus, lesson.id, t, handleClose, onUpdated]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      const result = await deleteLesson(lesson.id);
      if (result.error) {
        if (result.status === 403) {
          setFormError(t('lessonModalErrorForbidden'));
          setDeleteConfirmOpen(false);
          return;
        }
        setFormError(result.error.message ?? '');
        setDeleteConfirmOpen(false);
        return;
      }
      setDeleteConfirmOpen(false);
      onDeleted();
      handleClose();
    } finally {
      setDeleting(false);
    }
  }, [lesson.id, t, onDeleted, handleClose]);

  const deleteConfirmMessage = t('lessonModalDeleteConfirmMessage', {
    subjectName: title,
    date: formatDate(lesson.date, locale),
    time: `${timeToInputValue(lesson.startTime)}–${timeToInputValue(lesson.endTime)}`,
  });

  if (!open) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={title}
        variant="form"
        modalClassName="lesson-modal"
      >
        <form
          className="department-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {formError && (
            <Alert variant="error" role="alert" style={{ marginBottom: '1rem' }}>
              {formError}
            </Alert>
          )}
          <div className="lesson-modal-form-row">
            <FormGroup label={t('lessonModalStartTime')} htmlFor="lesson-edit-start" error={fieldErrors.startTime}>
              <input
                id="lesson-edit-start"
                type="time"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                className="form-control"
              />
            </FormGroup>
            <FormGroup label={t('lessonModalEndTime')} htmlFor="lesson-edit-end" error={fieldErrors.endTime}>
              <input
                id="lesson-edit-end"
                type="time"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                className="form-control"
              />
            </FormGroup>
          </div>
          <FormGroup label={t('lessonModalRoomLabel')} htmlFor="lesson-edit-room" error={fieldErrors.roomId}>
            <select
              id="lesson-edit-room"
              value={editRoomId ?? ''}
              onChange={(e) => setEditRoomId(e.target.value === '' ? null : e.target.value)}
              className="form-control"
            >
              <option value="">{t('lessonModalRoomNone')}</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.buildingName} — {r.number}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label={t('lessonModalTopic')} htmlFor="lesson-edit-topic">
            <input
              id="lesson-edit-topic"
              type="text"
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
              className="form-control"
              placeholder={t('lessonModalTopicNone')}
            />
          </FormGroup>
          <FormGroup label={t('lessonModalStatus')} htmlFor="lesson-edit-status">
            <select
              id="lesson-edit-status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as 'PLANNED' | 'CANCELLED' | 'DONE')}
              className="form-control"
            >
              <option value="PLANNED">{t('lessonModalStatusPlanned')}</option>
              <option value="CANCELLED">{t('lessonModalStatusCancelled')}</option>
              <option value="DONE">{t('lessonModalStatusDone')}</option>
            </select>
          </FormGroup>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn-delete"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={saving || deleting}
            >
              {t('lessonModalDelete')}
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <FormActions
                submitLabel={saving ? t('lessonModalSaving') : t('lessonModalSave')}
                submitting={saving}
                cancelLabel={t('lessonModalCancel')}
                onCancel={handleClose}
              />
            </div>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        open={deleteConfirmOpen}
        title={t('lessonModalDeleteConfirmTitle')}
        message={deleteConfirmMessage}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        cancelLabel={t('lessonModalCancel')}
        confirmLabel={t('lessonModalDelete')}
        confirmDisabled={deleting}
        confirmVariant="danger"
      />
    </>
  );
}

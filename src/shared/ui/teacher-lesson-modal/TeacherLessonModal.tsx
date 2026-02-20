/**
 * Модалка урока для преподавателя: только просмотр (view).
 * Показывает группу вместо преподавателя, кнопка "Перейти к уроку".
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation, useI18n, formatDate, formatTime } from '../../i18n';
import { formatRoomLine, formatGroupLine } from '../../lib/schedule';
import { Modal } from '../Modal';
import type { LessonForScheduleDto } from '../../api/types';
import '../lesson-modal/lesson-modal.css';
import './teacher-lesson-modal.css';

export interface TeacherLessonModalProps {
  open: boolean;
  onClose: () => void;
  item: LessonForScheduleDto;
  getLessonTypeLabel: (lessonType: string | null) => string;
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

export function TeacherLessonModal({
  open,
  onClose,
  item,
  getLessonTypeLabel,
}: TeacherLessonModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const { locale } = useI18n();

  const { lesson, subjectName, slot, room, group } = item;
  const title = subjectName?.trim() || t('lessonModalTitleFallback');
  const groupDisplay = formatGroupLine(group);
  const roomDisplay = room ? formatRoomLine(room) : null;
  const lessonTypeLabel = slot?.lessonType != null ? getLessonTypeLabel(slot.lessonType) : t('lessonModalTypeCustom');
  const statusLabel = t(STATUS_KEYS[lesson.status] as keyof typeof STATUS_KEYS);

  const timeDisplay = (() => {
    const start = lesson.startTime && lesson.date ? formatTime(`${lesson.date}T${lesson.startTime}`, locale) : '';
    const end = lesson.endTime && lesson.date ? formatTime(`${lesson.date}T${lesson.endTime}`, locale) : '';
    return start && end ? `${start} – ${end}` : `${timeToInputValue(lesson.startTime)}–${timeToInputValue(lesson.endTime)}`;
  })();

  const handleGoToLesson = () => {
    onClose();
    navigate(`/dashboards/teacher/lessons/${lesson.id}`);
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      variant="form"
      modalClassName="teacher-lesson-modal"
    >
      <div className="lesson-modal-view">
        <div className="lesson-modal-badges">
          <span className="lesson-modal-badge lesson-modal-badge--status">{statusLabel}</span>
          <span className="lesson-modal-badge lesson-modal-badge--type">{lessonTypeLabel}</span>
        </div>
        <dl className="lesson-modal-dl">
          <dt>{t('lessonModalDate')}</dt>
          <dd>{formatDate(lesson.date, locale)}</dd>
          <dt>{t('lessonModalTime')}</dt>
          <dd>{timeDisplay}</dd>
          <dt>{t('lessonModalStatus')}</dt>
          <dd>{statusLabel}</dd>
          <dt>{t('lessonModalType')}</dt>
          <dd>{lessonTypeLabel}</dd>
          <dt>{t('lessonModalGroup')}</dt>
          <dd>{groupDisplay || t('lessonModalGroupNone')}</dd>
          <dt>{t('lessonModalRoom')}</dt>
          <dd>{roomDisplay || t('lessonModalRoomNone')}</dd>
          <dt>{t('lessonModalTopic')}</dt>
          <dd>{lesson.topic?.trim() || t('lessonModalTopicNone')}</dd>
        </dl>
        <div className="lesson-modal-details-muted">
          <span>{t('lessonModalDetails')}:</span> ID {lesson.id}
        </div>
        <div className="lesson-modal-actions">
          <button type="button" className="btn-primary" onClick={handleGoToLesson}>
            {t('lessonModalGoToLesson')}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('lessonModalClose')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

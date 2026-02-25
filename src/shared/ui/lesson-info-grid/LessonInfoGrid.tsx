/**
 * Сетка информации об уроке в стиле страницы детального просмотра (InfoTile).
 * Дата, время, аудитория, преподаватель, тип занятия, тема.
 */
import { useTranslation, formatDate, formatTime } from '../../i18n';
import {
  getLessonTypeDisplayKey,
  getSubjectDisplayName,
  getTeacherDisplayName,
  formatCompositionRoomLine,
} from '../../lib';
import { InfoTile } from '../info-tile';
import type {
  CompositionLessonDto,
  CompositionRoomDto,
  CompositionTeacherDto,
  CompositionSubjectDto,
  CompositionOfferingSlotDto,
} from '../../api/types';

export interface LessonInfoGridProps {
  lesson: CompositionLessonDto;
  subject: CompositionSubjectDto;
  room: CompositionRoomDto | null;
  mainTeacher: CompositionTeacherDto | null;
  offeringSlot: CompositionOfferingSlotDto | null;
}

export function LessonInfoGrid({
  lesson,
  subject,
  room,
  mainTeacher,
  offeringSlot,
}: LessonInfoGridProps) {
  const { t, locale } = useTranslation('dashboard');
  const subjectName = getSubjectDisplayName(subject, locale);
  const teacherDisplay = mainTeacher ? getTeacherDisplayName(mainTeacher) : '—';
  const roomDisplay = formatCompositionRoomLine(room);
  const dateStr = formatDate(lesson.date, locale);
  const timeStr =
    lesson.startTime && lesson.endTime
      ? `${formatTime(`${lesson.date}T${lesson.startTime}`, locale)} – ${formatTime(`${lesson.date}T${lesson.endTime}`, locale)}`
      : `${lesson.startTime?.slice(0, 5) ?? ''} – ${lesson.endTime?.slice(0, 5) ?? ''}`;
  const lessonTypeKey = offeringSlot?.lessonType
    ? getLessonTypeDisplayKey(offeringSlot.lessonType)
    : null;

  return (
    <>
      <div className="ed-info-grid">
        <InfoTile label={t('groupSubjectInfoSubject')} value={subjectName} />
        <InfoTile label={t('lessonModalDate')} value={dateStr} />
        <InfoTile label={t('lessonModalTime')} value={timeStr} />
        <InfoTile label={t('lessonDetailsRoomLabel')} value={roomDisplay} />
        <InfoTile label={t('lessonDetailsTeacherLabel')} value={teacherDisplay} />
        {lessonTypeKey && (
          <InfoTile label={t('lessonModalType')} value={t(lessonTypeKey)} />
        )}
      </div>
      {lesson.topic?.trim() && (
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.9375rem', color: '#475569' }}>
          <strong>{t('lessonModalTopic')}:</strong> {lesson.topic.trim()}
        </p>
      )}
    </>
  );
}

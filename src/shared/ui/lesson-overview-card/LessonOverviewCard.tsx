/**
 * Карточка обзора урока: предмет, дата/время, статус, тип, аудитория, преподаватель, тема.
 * Переиспользуется на странице урока преподавателя и студента.
 */
import { useTranslation, formatDate, formatTime } from '../../i18n';
import {
  isNonStandardLessonStatus,
  getLessonStatusDisplayKey,
  getLessonTypeDisplayKey,
  getSubjectDisplayName,
  getTeacherDisplayName,
  formatCompositionRoomLine,
} from '../../lib';
import type {
  CompositionLessonDto,
  CompositionRoomDto,
  CompositionTeacherDto,
  CompositionSubjectDto,
  CompositionOfferingSlotDto,
} from '../../api/types';

export interface LessonOverviewCardProps {
  lesson: CompositionLessonDto;
  subject: CompositionSubjectDto;
  room: CompositionRoomDto | null;
  mainTeacher: CompositionTeacherDto | null;
  offeringSlot: CompositionOfferingSlotDto | null;
  actions?: React.ReactNode;
}

export function LessonOverviewCard({
  lesson,
  subject,
  room,
  mainTeacher,
  offeringSlot,
  actions,
}: LessonOverviewCardProps) {
  const { t, locale } = useTranslation('dashboard');
  const subjectName = getSubjectDisplayName(subject, locale);
  const teacherDisplay = mainTeacher ? getTeacherDisplayName(mainTeacher) : '—';
  const roomDisplay = formatCompositionRoomLine(room);
  const dateTimeLine = [
    formatDate(lesson.date, locale),
    lesson.startTime && lesson.endTime
      ? `${formatTime(`${lesson.date}T${lesson.startTime}`, locale)} – ${formatTime(`${lesson.date}T${lesson.endTime}`, locale)}`
      : `${lesson.startTime?.slice(0, 5) ?? ''} – ${lesson.endTime?.slice(0, 5) ?? ''}`,
  ].filter(Boolean).join(' • ');
  const showStatus = isNonStandardLessonStatus(lesson.status);
  const statusKey = getLessonStatusDisplayKey(lesson.status);
  const lessonTypeKey = getLessonTypeDisplayKey(offeringSlot?.lessonType ?? null);

  return (
    <section className="entity-view-card lesson-overview-card">
      <div className="lesson-overview-card__meta">
        <span className="lesson-overview-card__subject">{subjectName}</span>
        {dateTimeLine && (
          <span className="lesson-overview-card__datetime">{dateTimeLine}</span>
        )}
        {showStatus && statusKey && (
          <span className="lesson-overview-card__status">
            {t(statusKey as 'lessonModalStatusCancelled')}
          </span>
        )}
        {offeringSlot?.lessonType && (
          <span className="lesson-overview-card__type">
            {t(lessonTypeKey as 'scheduleLessonTypeLecture')}
          </span>
        )}
      </div>

      <div className="lesson-overview-card__details">
        {roomDisplay !== '—' && <span>{roomDisplay}</span>}
        <span>
          {t('lessonDetailsTeacherLabel')}: {teacherDisplay}
        </span>
      </div>

      {lesson.topic?.trim() && (
        <p className="lesson-overview-card__topic">{lesson.topic.trim()}</p>
      )}

      {actions && (
        <div className="lesson-overview-card__actions">{actions}</div>
      )}
    </section>
  );
}

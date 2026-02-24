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
import type { CompositionLessonDto, CompositionRoomDto, CompositionTeacherDto, CompositionSubjectDto, CompositionOfferingSlotDto } from '../../api/types';

export interface LessonOverviewCardProps {
  lesson: CompositionLessonDto;
  subject: CompositionSubjectDto;
  room: CompositionRoomDto | null;
  mainTeacher: CompositionTeacherDto | null;
  offeringSlot: CompositionOfferingSlotDto | null;
  /** Дополнительные действия (например, кнопка «Редактировать урок» для преподавателя) */
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
    <section
      className="entity-view-card lesson-overview-card"
      style={{
        marginBottom: '1.5rem',
        padding: '1.25rem 1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem 1rem',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {subjectName}
        </span>
        {dateTimeLine && (
          <span style={{ fontSize: '0.9375rem', color: '#475569' }}>{dateTimeLine}</span>
        )}
        {showStatus && statusKey && (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {t(statusKey as 'lessonModalStatusCancelled')}
          </span>
        )}
        {offeringSlot?.lessonType && (
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {t(lessonTypeKey as 'scheduleLessonTypeLecture')}
          </span>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem 1.25rem',
          fontSize: '0.9375rem',
          color: '#334155',
        }}
      >
        {roomDisplay !== '—' && <span>{roomDisplay}</span>}
        <span>
          {t('lessonDetailsTeacherLabel')}: {teacherDisplay}
        </span>
      </div>
      {lesson.topic?.trim() && (
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.9375rem', color: '#475569' }}>
          {lesson.topic.trim()}
        </p>
      )}
      {actions && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </section>
  );
}

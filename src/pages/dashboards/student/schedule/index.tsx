import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, formatDate } from '../../../../shared/i18n';
import { getStudentLessonsWeek } from '../../../../shared/api';
import type { LessonForScheduleDto } from '../../../../shared/api';
import {
  ScheduleGrid,
  SchedulePageContent,
  StudentLessonModal,
} from '../../../../shared/ui';
import type { ScheduleEvent } from '../../../../shared/ui';
import { mapLessonsForScheduleToEvents } from '../../../../shared/lib';
import { useScheduleWeek } from '../../../../shared/hooks/useScheduleWeek';

export function SchedulePage() {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const {
    anchorDate,
    setAnchorDate,
    weekStart,
    weekEnd,
    lessons,
    semester,
    lessonsError,
    semesterError,
    loading,
    handleToday,
    handlePrev,
    handleNext,
  } = useScheduleWeek({
    storageKey: 'student-schedule-anchor-date',
    fetchLessons: getStudentLessonsWeek,
    errorMessage: (fallback) => tRef.current(fallback as 'groupErrorLoad'),
  });

  const [selectedLesson, setSelectedLesson] = useState<LessonForScheduleDto | null>(null);

  useEffect(() => {
    if (!selectedLesson || !lessons?.length) return;
    const next = lessons.find((l) => l.lesson.id === selectedLesson.lesson.id);
    if (next && next !== selectedLesson) setSelectedLesson(next);
  }, [lessons, selectedLesson?.lesson.id]);

  const getDayLabel = (dayOfWeek: number) => t(`timeslotDay${dayOfWeek}` as 'timeslotDay1');
  const formatTime = (s: string) => (s ? s.slice(0, 5) : '');

  const getLessonTypeLabel = (lessonType: string | null) => {
    if (lessonType == null || lessonType === '') return t('scheduleSlotCustom');
    const keyMap: Record<string, string> = {
      LECTURE: 'scheduleLessonTypeLecture',
      PRACTICE: 'scheduleLessonTypePractice',
      LAB: 'scheduleLessonTypeLab',
      SEMINAR: 'scheduleLessonTypeSeminar',
    };
    return t((keyMap[lessonType] ?? 'scheduleSlotCustom') as 'scheduleLessonTypeLecture');
  };
  const getCancelledLabel = () => t('scheduleSlotCancelled');

  const events = lessons ? mapLessonsForScheduleToEvents(lessons) : [];

  const handleEventClick = useCallback((event: ScheduleEvent) => {
    const item = event.meta as LessonForScheduleDto | undefined;
    if (item) setSelectedLesson(item);
  }, []);

  const semesterText =
    semester != null
      ? `${semester.name ?? `${t('academicSemesterNumber')} ${semester.number}`} — ${formatDate(semester.startDate, locale)} – ${formatDate(semester.endDate, locale)}`
      : null;

  return (
    <>
      <SchedulePageContent
        title={t('groupTabSchedule')}
        toolbarProps={{
          anchorDate,
          onAnchorDateChange: setAnchorDate,
          weekRangeText: `${formatDate(weekStart, locale)} — ${formatDate(weekEnd, locale)}`,
          dateFormatAriaLabel: t('dateFormat'),
          todayLabel: t('scheduleToday'),
          prevLabel: t('schedulePrev'),
          nextLabel: t('scheduleNext'),
          onToday: handleToday,
          onPrev: handlePrev,
          onNext: handleNext,
        }}
        semesterText={semesterText}
        semesterError={!!semesterError}
        lessonsError={lessonsError}
        semesterLabel={t('scheduleSemester')}
        semesterNotFoundLabel={t('scheduleSemesterNotFound')}
        loading={loading}
        empty={!loading && (events?.length ?? 0) === 0}
        emptyLabel={t('scheduleEmptyWeek')}
        loadingLabel={t('loading')}
      >
        <ScheduleGrid
          events={events}
          getDayLabel={getDayLabel}
          formatTime={formatTime}
          getLessonTypeLabel={getLessonTypeLabel}
          getCancelledLabel={getCancelledLabel}
          onEventClick={handleEventClick}
          height="520px"
        />
      </SchedulePageContent>

      {selectedLesson && (
        <StudentLessonModal
          open={!!selectedLesson}
          onClose={() => setSelectedLesson(null)}
          item={selectedLesson}
          getLessonTypeLabel={getLessonTypeLabel}
        />
      )}
    </>
  );
}

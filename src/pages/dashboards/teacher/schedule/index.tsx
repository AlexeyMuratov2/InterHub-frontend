import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, formatDate } from '../../../../shared/i18n';
import { getTeacherLessonsWeek, getSemesterByDate } from '../../../../shared/api';
import type { LessonForScheduleDto } from '../../../../shared/api';
import { ScheduleGrid, Alert, TeacherLessonModal } from '../../../../shared/ui';
import type { ScheduleEvent } from '../../../../shared/ui';
import { mapLessonsForScheduleToEventsForTeacher } from '../../../../shared/lib';
import { getIsoWeekStart, getIsoWeekEnd } from '../../../../shared/lib';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SchedulePage() {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [anchorDate, setAnchorDate] = useState(todayString);
  const [lessons, setLessons] = useState<Awaited<ReturnType<typeof getTeacherLessonsWeek>>['data']>(undefined);
  const [semester, setSemester] = useState<Awaited<ReturnType<typeof getSemesterByDate>>['data']>(undefined);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [semesterError, setSemesterError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<LessonForScheduleDto | null>(null);
  const cacheRef = useRef<Map<string, Awaited<ReturnType<typeof getTeacherLessonsWeek>>['data']>>(new Map());

  const weekStart = getIsoWeekStart(anchorDate);
  const weekEnd = getIsoWeekEnd(anchorDate);
  const cacheKey = `${weekStart}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setLessonsError(null);
    setSemesterError(null);

    const cachedLessons = cacheRef.current.get(cacheKey);
    const lessonsPromise =
      cachedLessons !== undefined
        ? Promise.resolve({ data: cachedLessons, error: undefined, status: 200 })
        : getTeacherLessonsWeek(anchorDate);
    const semesterPromise = getSemesterByDate(anchorDate);

    const [lessonsRes, semesterRes] = await Promise.all([lessonsPromise, semesterPromise]);

    if (lessonsRes.error) {
      setLessonsError(lessonsRes.error.message ?? tRef.current('groupErrorLoad'));
      setLessons([]);
    } else {
      const data = lessonsRes.data ?? [];
      setLessons(data);
      if (cachedLessons === undefined) cacheRef.current.set(cacheKey, data);
    }

    if (semesterRes.error) {
      setSemesterError(semesterRes.error.message ?? null);
      setSemester(undefined);
    } else {
      setSemester(semesterRes.data ?? undefined);
    }
    setLoading(false);
  }, [anchorDate, cacheKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedLesson || !lessons?.length) return;
    const next = lessons.find((l) => l.lesson.id === selectedLesson.lesson.id);
    if (next && next !== selectedLesson) setSelectedLesson(next);
  }, [lessons, selectedLesson?.lesson.id]);

  const handleToday = () => setAnchorDate(todayString());
  const handlePrev = () => {
    const d = new Date(anchorDate + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setAnchorDate(d.toISOString().slice(0, 10));
  };
  const handleNext = () => {
    const d = new Date(anchorDate + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setAnchorDate(d.toISOString().slice(0, 10));
  };

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

  const events = lessons ? mapLessonsForScheduleToEventsForTeacher(lessons) : [];

  const handleEventClick = useCallback((event: ScheduleEvent) => {
    const item = event.meta as LessonForScheduleDto | undefined;
    if (item) {
      setSelectedLesson(item);
    }
  }, []);

  return (
    <section className="entity-view-card" style={{ marginTop: '1rem' }}>
      <h2 className="entity-view-card-title">{t('groupTabSchedule')}</h2>

      <div className="schedule-tab-toolbar">
        <input
          type="date"
          value={anchorDate}
          onChange={(e) => setAnchorDate(e.target.value)}
          aria-label={t('dateFormat')}
        />
        <span className="schedule-tab-week-range">
          {formatDate(weekStart, locale)} — {formatDate(weekEnd, locale)}
        </span>
        <div className="schedule-tab-toolbar-buttons">
          <button type="button" className="btn-schedule-primary" onClick={handleToday}>
            {t('scheduleToday')}
          </button>
          <button type="button" className="btn-schedule-secondary" onClick={handlePrev} aria-label={t('schedulePrev')}>
            ‹ {t('schedulePrev')}
          </button>
          <button type="button" className="btn-schedule-secondary" onClick={handleNext} aria-label={t('scheduleNext')}>
            {t('scheduleNext')} ›
          </button>
        </div>
      </div>

      {semesterError && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="info" role="status">
            {t('scheduleSemester')}: {t('scheduleSemesterNotFound')}
          </Alert>
        </div>
      )}

      {!semesterError && semester && (
        <div className="schedule-tab-semester">
          <strong>{t('scheduleSemester')}:</strong>{' '}
          <span className="schedule-tab-semester-muted">
            {semester.name ?? `${t('academicSemesterNumber')} ${semester.number}`} — {formatDate(semester.startDate, locale)} – {formatDate(semester.endDate, locale)}
          </span>
        </div>
      )}

      {lessonsError && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="error" role="alert">
            {lessonsError}
          </Alert>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('loading')}</p>
      ) : events.length === 0 ? (
        <div className="schedule-tab-empty">{t('scheduleEmptyWeek')}</div>
      ) : (
        <ScheduleGrid
          events={events}
          getDayLabel={getDayLabel}
          formatTime={formatTime}
          getLessonTypeLabel={getLessonTypeLabel}
          getCancelledLabel={getCancelledLabel}
          onEventClick={handleEventClick}
          height="520px"
        />
      )}

      {selectedLesson && (
        <TeacherLessonModal
          open={!!selectedLesson}
          onClose={() => {
            setSelectedLesson(null);
          }}
          item={selectedLesson}
          getLessonTypeLabel={getLessonTypeLabel}
        />
      )}
    </section>
  );
}

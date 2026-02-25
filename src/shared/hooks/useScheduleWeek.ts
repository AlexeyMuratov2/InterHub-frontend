import { useState, useEffect, useRef, useCallback } from 'react';
import { getSemesterByDate } from '../api';
import type { LessonForScheduleDto, SemesterByDateDto } from '../api';
import { getIsoWeekStart, getIsoWeekEnd } from '../lib';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export type UseScheduleWeekFetch = (
  date: string
) => Promise<{ data?: LessonForScheduleDto[]; error?: { message?: string }; status?: number }>;

export type UseScheduleWeekOptions = {
  /** Ключ sessionStorage для сохранения выбранной даты */
  storageKey: string;
  /** Функция загрузки занятий на неделю (getTeacherLessonsWeek или getStudentLessonsWeek) */
  fetchLessons: UseScheduleWeekFetch;
  /** Функция для перевода сообщения об ошибке загрузки */
  errorMessage?: (fallback: string) => string;
};

export type UseScheduleWeekResult = {
  anchorDate: string;
  setAnchorDate: (date: string) => void;
  weekStart: string;
  weekEnd: string;
  lessons: LessonForScheduleDto[] | undefined;
  semester: SemesterByDateDto | undefined;
  lessonsError: string | null;
  semesterError: string | null;
  loading: boolean;
  handleToday: () => void;
  handlePrev: () => void;
  handleNext: () => void;
};

function getInitialAnchorDate(storageKey: string): string {
  try {
    const saved = sessionStorage.getItem(storageKey);
    return saved || todayString();
  } catch {
    return todayString();
  }
}

export function useScheduleWeek({
  storageKey,
  fetchLessons,
  errorMessage = (msg) => msg,
}: UseScheduleWeekOptions): UseScheduleWeekResult {
  const [anchorDate, setAnchorDate] = useState(() => getInitialAnchorDate(storageKey));
  const [lessons, setLessons] = useState<LessonForScheduleDto[] | undefined>(undefined);
  const [semester, setSemester] = useState<SemesterByDateDto | undefined>(undefined);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [semesterError, setSemesterError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Map<string, LessonForScheduleDto[]>>(new Map());
  const errorMessageRef = useRef(errorMessage);
  errorMessageRef.current = errorMessage;

  const weekStart = getIsoWeekStart(anchorDate);
  const weekEnd = getIsoWeekEnd(anchorDate);
  const cacheKey = weekStart;

  const loadData = useCallback(async () => {
    setLoading(true);
    setLessonsError(null);
    setSemesterError(null);

    const cachedLessons = cacheRef.current.get(cacheKey);
    const lessonsPromise =
      cachedLessons !== undefined
        ? Promise.resolve({ data: cachedLessons, error: undefined, status: 200 })
        : fetchLessons(anchorDate);
    const semesterPromise = getSemesterByDate(anchorDate);

    const [lessonsRes, semesterRes] = await Promise.all([lessonsPromise, semesterPromise]);

    if (lessonsRes.error) {
      setLessonsError(lessonsRes.error.message ?? errorMessageRef.current('groupErrorLoad'));
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
  }, [anchorDate, cacheKey, fetchLessons]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, anchorDate);
    } catch {
      /* ignore */
    }
  }, [storageKey, anchorDate]);

  const handleToday = useCallback(() => setAnchorDate(todayString()), []);
  const handlePrev = useCallback(() => {
    const d = new Date(anchorDate + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setAnchorDate(d.toISOString().slice(0, 10));
  }, [anchorDate]);
  const handleNext = useCallback(() => {
    const d = new Date(anchorDate + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setAnchorDate(d.toISOString().slice(0, 10));
  }, [anchorDate]);

  return {
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
  };
}

import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentSemester,
  getAcademicYears,
  getSemestersByYear,
} from '../api';
import type { SemesterDto } from '../api';

export type UseSemesterFilterResult = {
  /** Текущий семестр (из GET /api/academic/semesters/current) */
  currentSemester: SemesterDto | null;
  /** Список семестров для выбора (год текущий или первый из списка) */
  semesterOptions: SemesterDto[];
  /** Выбранный номер семестра (1, 2, …) или null — «все» */
  selectedSemesterNumber: number | null;
  /** Установить выбранный семестр и вызвать onSemesterChange */
  setSelectedSemesterNumber: (value: number | null) => void;
  /** Обработчик смены значения в select */
  handleSemesterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Идёт ли первичная загрузка списка семестров */
  loading: boolean;
};

/**
 * Хук для фильтра по семестру на страницах предметов (преподаватель / студент).
 * Загружает текущий семестр и список семестров года, формирует опции для select.
 */
export function useSemesterFilter(options?: {
  /** Вызывается при смене семестра (в т.ч. при первоначальной установке не вызывается) */
  onSemesterChange?: (semesterNo: number | null) => void;
}): UseSemesterFilterResult {
  const [currentSemester, setCurrentSemester] = useState<SemesterDto | null>(null);
  const [semesterOptions, setSemesterOptions] = useState<SemesterDto[]>([]);
  const [selectedSemesterNumber, setSelectedSemesterNumberState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSemestersForPicker = useCallback(async () => {
    const yearsRes = await getAcademicYears();
    if (yearsRes.error || !yearsRes.data?.length) return;
    const year = yearsRes.data.find((y) => y.isCurrent) ?? yearsRes.data[0];
    const semRes = await getSemestersByYear(year.id);
    if (semRes.error) return;
    setSemesterOptions(semRes.data ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      const currentRes = await getCurrentSemester();
      if (cancelled) return;
      await loadSemestersForPicker();
      if (cancelled) return;

      if (currentRes.data) {
        setCurrentSemester(currentRes.data);
        setSelectedSemesterNumberState(currentRes.data.number);
      } else {
        setCurrentSemester(null);
        setSelectedSemesterNumberState(null);
      }
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [loadSemestersForPicker]);

  const setSelectedSemesterNumber = useCallback(
    (value: number | null) => {
      setSelectedSemesterNumberState(value);
      options?.onSemesterChange?.(value);
    },
    [options]
  );

  const handleSemesterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === '') {
        setSelectedSemesterNumberState(null);
        options?.onSemesterChange?.(null);
      } else {
        const num = parseInt(value, 10);
        if (!Number.isNaN(num)) {
          setSelectedSemesterNumberState(num);
          options?.onSemesterChange?.(num);
        }
      }
    },
    [options]
  );

  const optionsForSelect =
    semesterOptions.length > 0
      ? currentSemester && !semesterOptions.some((s) => s.id === currentSemester.id)
        ? [currentSemester, ...semesterOptions]
        : semesterOptions
      : currentSemester
        ? [currentSemester]
        : [];

  return {
    currentSemester,
    semesterOptions: optionsForSelect,
    selectedSemesterNumber,
    setSelectedSemesterNumber,
    handleSemesterChange,
    loading,
  };
}

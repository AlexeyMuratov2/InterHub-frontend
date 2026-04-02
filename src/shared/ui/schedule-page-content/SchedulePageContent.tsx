/**
 * Общая разметка страницы расписания (неделя): hero, секция с тулбаром, семестром, алертами и контентом.
 * Используется на страницах расписания преподавателя и студента.
 */
import type { ReactNode } from 'react';
import { Calendar } from 'lucide-react';
import { Alert } from '../Alert';
import { PageHero } from '../page-hero';
import { SectionCard } from '../section-card';
import { ScheduleToolbar } from '../schedule-toolbar';
import type { ScheduleToolbarProps } from '../schedule-toolbar';

export interface SchedulePageContentProps {
  /** Заголовок в hero (например «Расписание») */
  title: string;
  /** Подзаголовок в hero (опционально) */
  subtitle?: string | null;
  /** Пропсы для тулбара выбора недели */
  toolbarProps: ScheduleToolbarProps;
  /** Текст строки семестра (например «Семестр 1 — 01.09 – 31.12») или null */
  semesterText?: ReactNode;
  /** Показывать алерт «семестр не найден» */
  semesterError?: boolean;
  /** Сообщение об ошибке загрузки занятий */
  lessonsError?: string | null;
  /** Ключ/текст для заголовка семестра (например "scheduleSemester") */
  semesterLabel: string;
  /** Ключ/текст для «семестр не найден» */
  semesterNotFoundLabel: string;
  /** Идёт загрузка */
  loading: boolean;
  /** Неделя пустая (нет занятий) */
  empty: boolean;
  /** Текст при пустом расписании */
  emptyLabel: string;
  /** Текст при загрузке */
  loadingLabel: string;
  /** Сетка расписания или другой контент (показывается когда !loading && !empty) */
  children?: ReactNode;
}

export function SchedulePageContent({
  title,
  subtitle,
  toolbarProps,
  semesterText,
  semesterError = false,
  lessonsError,
  semesterLabel,
  semesterNotFoundLabel,
  loading,
  empty,
  emptyLabel,
  loadingLabel,
  children,
}: SchedulePageContentProps) {
  return (
    <div className="entity-view-page department-form-page ed-page">
      <PageHero
        icon={<Calendar size={28} />}
        title={title}
        subtitle={subtitle ?? undefined}
      />

      <SectionCard icon={<Calendar size={18} />} title={title}>
        <ScheduleToolbar {...toolbarProps} />

        {semesterError && (
          <div className="ed-schedule-alerts">
            <Alert variant="info" role="status">
              {semesterLabel}: {semesterNotFoundLabel}
            </Alert>
          </div>
        )}

        {!semesterError && semesterText != null && semesterText !== '' && (
          <div className="schedule-tab-semester ed-schedule-semester">
            <strong>{semesterLabel}:</strong>{' '}
            <span className="schedule-tab-semester-muted">{semesterText}</span>
          </div>
        )}

        {lessonsError && (
          <div className="ed-schedule-alerts">
            <Alert variant="error" role="alert">
              {lessonsError}
            </Alert>
          </div>
        )}

        {loading ? (
          <p className="ed-empty ed-empty--loading">{loadingLabel}</p>
        ) : empty ? (
          <div className="schedule-tab-empty ed-schedule-empty">{emptyLabel}</div>
        ) : (
          children
        )}
      </SectionCard>
    </div>
  );
}

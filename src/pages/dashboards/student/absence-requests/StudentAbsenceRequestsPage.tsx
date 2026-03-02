import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Check, Clock, X, Send, CalendarDays } from 'lucide-react';
import {
  getMyAbsenceNotices,
  createAbsenceNotice,
  getStudentLessonsWeek,
  ABSENCE_NOTICE_STATUS,
  ABSENCE_NOTICE_TYPE,
  type StudentAbsenceNoticeItemDto,
  type AbsenceNoticeStatus,
} from '../../../../shared/api';
import { useTranslation, formatDate, formatDateTime } from '../../../../shared/i18n';
import { PageHero, SectionCard, Alert, AbsenceRequestsFiltersBar, FormGroup } from '../../../../shared/ui';
import { getLessonTypeDisplayKey } from '../../../../shared/lib';

const LIMIT = 30;
const MAX_REASON_LENGTH = 2000;
const MAX_RANGE_DAYS = 60;

type StatusFilterValue = typeof ABSENCE_NOTICE_STATUS.SUBMITTED | '';
type CreateSelectionMode = 'RANGE' | 'SINGLE';
type CreateNoticeType = typeof ABSENCE_NOTICE_TYPE.ABSENT | typeof ABSENCE_NOTICE_TYPE.LATE;
type ConflictLessonInfo = { lessonId: string; status: AbsenceNoticeStatus | null };

interface SelectableLesson {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  lessonType: string | null;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeekMonday(isoDate: string): Date {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function getStatusBadgeVariant(
  status: AbsenceNoticeStatus
): 'approved' | 'pending' | 'rejected' | 'submitted' | 'canceled' | 'acknowledged' | 'attached' {
  switch (status) {
    case ABSENCE_NOTICE_STATUS.APPROVED:
    case ABSENCE_NOTICE_STATUS.ATTACHED:
    case ABSENCE_NOTICE_STATUS.ACKNOWLEDGED:
      return 'approved';
    case ABSENCE_NOTICE_STATUS.SUBMITTED:
      return 'pending';
    case ABSENCE_NOTICE_STATUS.CANCELED:
    case ABSENCE_NOTICE_STATUS.REJECTED:
      return 'rejected';
    default:
      return status === 'SUBMITTED' ? 'pending' : status === 'CANCELED' || status === 'REJECTED' ? 'rejected' : 'approved';
  }
}

function getStatusLabelKey(status: AbsenceNoticeStatus): string {
  switch (status) {
    case ABSENCE_NOTICE_STATUS.SUBMITTED:
      return 'absenceRequestsStatusPending';
    case ABSENCE_NOTICE_STATUS.APPROVED:
    case ABSENCE_NOTICE_STATUS.ATTACHED:
    case ABSENCE_NOTICE_STATUS.ACKNOWLEDGED:
      return 'absenceRequestsStatusApproved';
    case ABSENCE_NOTICE_STATUS.CANCELED:
    case ABSENCE_NOTICE_STATUS.REJECTED:
      return 'absenceRequestsStatusRejected';
    default:
      return 'absenceRequestsStatusSubmitted';
  }
}

function getNoticeTypeKey(type: string): string {
  return type === 'LATE' ? 'absenceRequestsNoticeTypeLate' : 'absenceRequestsNoticeTypeAbsent';
}

function getSubjectDisplay(item: StudentAbsenceNoticeItemDto): string {
  return item.offering?.subjectName ?? item.lesson?.topic ?? '—';
}

function getLessonType(item: StudentAbsenceNoticeItemDto): string | null {
  return item.slot?.lessonType ?? item.lesson?.lessonType ?? null;
}

function getLessonDate(item: StudentAbsenceNoticeItemDto): string {
  return item.lesson?.date ?? item.notice.submittedAt.slice(0, 10);
}

const STUDENT_STATUS_OPTIONS = [
  { value: ABSENCE_NOTICE_STATUS.SUBMITTED, labelKey: 'absenceRequestsStatusPending' },
  { value: ABSENCE_NOTICE_STATUS.APPROVED, labelKey: 'absenceRequestsStatusApproved' },
  { value: ABSENCE_NOTICE_STATUS.REJECTED, labelKey: 'absenceRequestsStatusRejected' },
  { value: ABSENCE_NOTICE_STATUS.CANCELED, labelKey: 'absenceRequestsStatusCanceled' },
];

export function StudentAbsenceRequestsPage() {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const today = useMemo(() => toIsoDate(new Date()), []);
  const [items, setItems] = useState<StudentAbsenceNoticeItemDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [createMode, setCreateMode] = useState<CreateSelectionMode>('RANGE');
  const [createType, setCreateType] = useState<CreateNoticeType>('ABSENT');
  const [createReason, setCreateReason] = useState('');
  const [createDateFrom, setCreateDateFrom] = useState<string>(today);
  const [createDateTo, setCreateDateTo] = useState<string>(addDays(today, 14));
  const [availableLessons, setAvailableLessons] = useState<SelectableLesson[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [singleLessonId, setSingleLessonId] = useState<string>('');
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createConflictLessons, setCreateConflictLessons] = useState<ConflictLessonInfo[]>([]);

  const loadNotices = async (cursor?: string | null) => {
    const isFirst = cursor == null;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const from = dateFrom ? `${dateFrom}T00:00:00` : undefined;
    const to = dateTo ? `${dateTo}T23:59:59` : undefined;

    const { data, error: err } = await getMyAbsenceNotices({
      from: from ?? undefined,
      to: to ?? undefined,
      cursor: cursor ?? undefined,
      limit: LIMIT,
    });

    if (isFirst) setLoading(false);
    else setLoadingMore(false);

    if (err) {
      setError(err.message ?? t('absenceRequestsErrorLoad'));
      if (isFirst) {
        setItems([]);
        setNextCursor(null);
      }
      return;
    }

    const list = data?.items ?? [];
    const next = data?.nextCursor ?? null;

    if (isFirst) {
      setItems(list);
      setNextCursor(next);
    } else {
      setItems((prev) => [...prev, ...list]);
      setNextCursor(next);
    }
  };

  const loadLessonsForCreate = useCallback(async () => {
    if (!createDateFrom || !createDateTo) {
      setAvailableLessons([]);
      setSelectedLessonIds([]);
      setSingleLessonId('');
      return;
    }
    if (createDateFrom > createDateTo) {
      setCreateError(tRef.current('studentAbsenceCreateErrorInvalidRange'));
      setAvailableLessons([]);
      setSelectedLessonIds([]);
      setSingleLessonId('');
      return;
    }
    const daysDiff =
      (new Date(`${createDateTo}T00:00:00`).getTime() -
        new Date(`${createDateFrom}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysDiff > MAX_RANGE_DAYS) {
      setCreateError(tRef.current('studentAbsenceCreateErrorInvalidRange'));
      setAvailableLessons([]);
      setSelectedLessonIds([]);
      setSingleLessonId('');
      return;
    }

    setLessonsLoading(true);
    setCreateError(null);

    const weekAnchors: string[] = [];
    for (
      let cursor = startOfWeekMonday(createDateFrom);
      cursor <= new Date(`${createDateTo}T00:00:00`);
      cursor.setDate(cursor.getDate() + 7)
    ) {
      weekAnchors.push(toIsoDate(cursor));
    }

    const responses = await Promise.all(weekAnchors.map((weekDate) => getStudentLessonsWeek(weekDate)));
    const failed = responses.find((res) => res.error);
    if (failed?.error) {
      setLessonsLoading(false);
      setCreateError(failed.error.message ?? tRef.current('studentAbsenceCreateErrorLoadLessons'));
      return;
    }

    const dedup = new Map<string, SelectableLesson>();
    responses.forEach((res) => {
      (res.data ?? []).forEach((item) => {
        if (!item?.lesson?.id) return;
        const date = item.lesson.date;
        if (date < createDateFrom || date > createDateTo) return;
        if (item.lesson.status === 'CANCELLED') return;
        dedup.set(item.lesson.id, {
          id: item.lesson.id,
          date: item.lesson.date,
          startTime: item.lesson.startTime,
          endTime: item.lesson.endTime,
          subjectName: item.subjectName ?? '—',
          lessonType: item.slot?.lessonType ?? null,
        });
      });
    });

    const lessons = Array.from(dedup.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    setAvailableLessons(lessons);
    setSelectedLessonIds((prev) => {
      const allowed = new Set(lessons.map((l) => l.id));
      const next = prev.filter((id) => allowed.has(id));
      if (next.length > 0) return next;
      return lessons.map((lesson) => lesson.id);
    });
    setSingleLessonId((prev) => {
      if (prev && lessons.some((lesson) => lesson.id === prev)) return prev;
      return lessons[0]?.id ?? '';
    });
    setLessonsLoading(false);
  }, [createDateFrom, createDateTo]);

  useEffect(() => {
    loadNotices();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadLessonsForCreate();
  }, [loadLessonsForCreate]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter) {
      list = list.filter((item) => item.notice.status === statusFilter);
    }
    return list;
  }, [items, statusFilter]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) loadNotices(nextCursor);
  };

  const lessonUrl = (lessonSessionId: string) => `/dashboards/student/lessons/${lessonSessionId}`;
  const reasonLength = createReason.length;

  const groupedLessons = useMemo(() => {
    const map = new Map<string, SelectableLesson[]>();
    availableLessons.forEach((lesson) => {
      const list = map.get(lesson.date) ?? [];
      list.push(lesson);
      map.set(lesson.date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [availableLessons]);
  const lessonById = useMemo(() => {
    const map = new Map<string, SelectableLesson>();
    availableLessons.forEach((lesson) => map.set(lesson.id, lesson));
    return map;
  }, [availableLessons]);

  const toggleLessonSelection = (lessonId: string) => {
    setSelectedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreateConflictLessons([]);

    const lessonSessionIds =
      createMode === 'SINGLE'
        ? singleLessonId
          ? [singleLessonId]
          : []
        : selectedLessonIds;

    if (lessonSessionIds.length === 0) {
      setCreateError(t('studentAbsenceCreateErrorNoLessonsSelected'));
      return;
    }

    setCreateSubmitting(true);
    const { error: submitError } = await createAbsenceNotice({
      lessonSessionIds,
      type: createType,
      reasonText: createReason.trim() || undefined,
      fileIds: [],
    });
    setCreateSubmitting(false);

    if (submitError) {
      if (submitError.code === 'ATTENDANCE_NOTICE_ALREADY_EXISTS') {
        const targetIds = new Set(lessonSessionIds);
        const conflicts = new Map<string, ConflictLessonInfo>();
        let cursor: string | undefined;
        const from = createDateFrom ? `${createDateFrom}T00:00:00` : undefined;
        const to = createDateTo ? `${createDateTo}T23:59:59` : undefined;
        do {
          const { data, error: conflictErr } = await getMyAbsenceNotices({
            from,
            to,
            cursor,
            limit: LIMIT,
          });
          if (conflictErr) break;
          const pageItems = data?.items ?? [];
          pageItems.forEach((item) => {
            if (item.notice.status === ABSENCE_NOTICE_STATUS.CANCELED) return;
            (item.notice.lessonSessionIds ?? []).forEach((sessionId) => {
              if (!targetIds.has(sessionId)) return;
              if (!conflicts.has(sessionId)) {
                conflicts.set(sessionId, {
                  lessonId: sessionId,
                  status: item.notice.status ?? null,
                });
              }
            });
          });
          cursor = data?.nextCursor ?? undefined;
        } while (cursor && conflicts.size < targetIds.size);

        setCreateConflictLessons(Array.from(conflicts.values()));
        setCreateError(t('studentAbsenceCreateErrorAlreadyExists'));
        return;
      }
      setCreateError(submitError.message ?? t('absenceRequestErrorSubmit'));
      return;
    }

    setCreateSuccess(t('studentAbsenceCreateSuccess'));
    setCreateReason('');
    loadNotices();
  };

  return (
    <div className="entity-view-page department-form-page ed-page">
      <PageHero
        icon={<ClipboardList size={28} />}
        title={t('studentAbsenceRequestsTitle')}
        subtitle={t('studentAbsenceRequestsSubtitle')}
      />

      <SectionCard icon={<CalendarDays size={18} />} title={t('studentAbsenceCreateTitle')}>
        <p className="student-absence-create-subtitle">{t('studentAbsenceCreateSubtitle')}</p>
        {createError && (
          <Alert variant="error" role="alert">
            {createError}
            {createConflictLessons.length > 0 && (
              <div className="student-absence-conflicts">
                <div className="student-absence-conflicts__title">{t('studentAbsenceCreateConflictsTitle')}</div>
                <ul className="student-absence-conflicts__list">
                  {createConflictLessons.map((conflict) => {
                    const lesson = lessonById.get(conflict.lessonId);
                    return (
                      <li key={conflict.lessonId}>
                        <Link to={lessonUrl(conflict.lessonId)} className="absence-requests-student-link">
                          {lesson
                            ? `${formatDate(lesson.date, locale)} ${lesson.startTime.slice(0, 5)}-${lesson.endTime.slice(0, 5)} · ${lesson.subjectName}`
                            : `${t('studentAbsenceCreateConflictUnknownLesson')} ${conflict.lessonId.slice(0, 8)}`}
                        </Link>
                        {conflict.status && (
                          <span className="student-absence-conflicts__status">
                            {t(getStatusLabelKey(conflict.status))}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Alert>
        )}
        {createSuccess && (
          <Alert variant="success" role="status">
            {createSuccess}
          </Alert>
        )}
        <form className="student-absence-create-form" onSubmit={handleCreateSubmit} noValidate>
          <div className="student-absence-create-mode">
            <span className="student-absence-create-label">{t('studentAbsenceCreateModeLabel')}</span>
            <div className="student-absence-create-mode-options">
              <button
                type="button"
                className={`student-absence-chip ${createMode === 'RANGE' ? 'student-absence-chip--active' : ''}`}
                onClick={() => setCreateMode('RANGE')}
              >
                {t('studentAbsenceCreateModeRange')}
              </button>
              <button
                type="button"
                className={`student-absence-chip ${createMode === 'SINGLE' ? 'student-absence-chip--active' : ''}`}
                onClick={() => setCreateMode('SINGLE')}
              >
                {t('studentAbsenceCreateModeSingle')}
              </button>
            </div>
          </div>

          <div className="student-absence-create-dates">
            <label htmlFor="student-absence-create-from">{t('absenceRequestsDateFrom')}</label>
            <input
              id="student-absence-create-from"
              type="date"
              value={createDateFrom}
              onChange={(e) => setCreateDateFrom(e.target.value)}
              max={createDateTo || undefined}
            />
            <label htmlFor="student-absence-create-to">{t('absenceRequestsDateTo')}</label>
            <input
              id="student-absence-create-to"
              type="date"
              value={createDateTo}
              onChange={(e) => setCreateDateTo(e.target.value)}
              min={createDateFrom || undefined}
            />
          </div>

          {createMode === 'SINGLE' ? (
            <FormGroup label={t('studentAbsenceCreatePickLesson')} htmlFor="student-absence-single-lesson">
              <select
                id="student-absence-single-lesson"
                value={singleLessonId}
                onChange={(e) => setSingleLessonId(e.target.value)}
                disabled={lessonsLoading || availableLessons.length === 0}
              >
                {availableLessons.length === 0 && (
                  <option value="">{t('studentAbsenceCreateNoLessonsInRange')}</option>
                )}
                {availableLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {formatDate(lesson.date, locale)} {lesson.startTime.slice(0, 5)}-{lesson.endTime.slice(0, 5)} ·{' '}
                    {lesson.subjectName}
                  </option>
                ))}
              </select>
            </FormGroup>
          ) : (
            <div className="student-absence-create-lessons">
              <div className="student-absence-create-lessons-header">
                <span className="student-absence-create-label">{t('studentAbsenceCreateLessonsLabel')}</span>
                <div className="student-absence-create-lessons-actions">
                  <button
                    type="button"
                    className="department-table-btn"
                    onClick={() => setSelectedLessonIds(availableLessons.map((lesson) => lesson.id))}
                    disabled={availableLessons.length === 0}
                  >
                    {t('studentAbsenceCreateSelectAllLessons')}
                  </button>
                  <button
                    type="button"
                    className="department-table-btn"
                    onClick={() => setSelectedLessonIds([])}
                    disabled={selectedLessonIds.length === 0}
                  >
                    {t('studentAbsenceCreateClearSelection')}
                  </button>
                </div>
              </div>
              <p className="student-absence-create-hint">
                {t('studentAbsenceCreateSelectedCount', { count: selectedLessonIds.length })}
              </p>
              {lessonsLoading ? (
                <p className="student-absence-create-hint">{t('loadingList')}</p>
              ) : groupedLessons.length === 0 ? (
                <p className="student-absence-create-hint">{t('studentAbsenceCreateNoLessonsInRange')}</p>
              ) : (
                groupedLessons.map(([date, lessons]) => (
                  <div key={date} className="student-absence-create-day">
                    <div className="student-absence-create-day-title">{formatDate(date, locale)}</div>
                    <div className="student-absence-create-day-items">
                      {lessons.map((lesson) => (
                        <label key={lesson.id} className="student-absence-create-lesson-item">
                          <input
                            type="checkbox"
                            checked={selectedLessonIds.includes(lesson.id)}
                            onChange={() => toggleLessonSelection(lesson.id)}
                          />
                          <span>
                            {lesson.startTime.slice(0, 5)}-{lesson.endTime.slice(0, 5)} · {lesson.subjectName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="ed-absence-request-dialog__type-row">
            <span className="ed-absence-request-dialog__type-label">{t('absenceRequestsNoticeType')} *</span>
            <div className="ed-absence-request-dialog__type-options">
              <button
                type="button"
                className={`ed-absence-request-dialog__type-option ${
                  createType === 'ABSENT' ? 'ed-absence-request-dialog__type-option--active' : ''
                }`}
                onClick={() => setCreateType('ABSENT')}
              >
                <span className="ed-absence-request-dialog__type-option-label">
                  {t('absenceRequestsNoticeTypeAbsent')}
                </span>
                <span className="ed-absence-request-dialog__type-option-desc">
                  {t('absenceRequestTypeAbsentDesc')}
                </span>
              </button>
              <button
                type="button"
                className={`ed-absence-request-dialog__type-option ${
                  createType === 'LATE' ? 'ed-absence-request-dialog__type-option--active' : ''
                }`}
                onClick={() => setCreateType('LATE')}
              >
                <span className="ed-absence-request-dialog__type-option-label">
                  {t('absenceRequestsNoticeTypeLate')}
                </span>
                <span className="ed-absence-request-dialog__type-option-desc">
                  {t('absenceRequestTypeLateDesc')}
                </span>
              </button>
            </div>
          </div>

          <FormGroup
            label={t('absenceRequestsReason')}
            htmlFor="student-absence-reason"
            hint={t('absenceRequestReasonHint')}
          >
            <textarea
              id="student-absence-reason"
              className="ed-absence-request-dialog__reason"
              value={createReason}
              onChange={(e) => setCreateReason(e.target.value)}
              placeholder={t('absenceRequestReasonPlaceholder')}
              rows={4}
              maxLength={MAX_REASON_LENGTH + 1}
              aria-invalid={reasonLength > MAX_REASON_LENGTH}
              disabled={createSubmitting}
            />
            <div className="ed-absence-request-dialog__reason-footer">
              <span className={reasonLength > MAX_REASON_LENGTH ? 'ed-absence-request-dialog__count--over' : ''}>
                {reasonLength} / {MAX_REASON_LENGTH}
              </span>
            </div>
          </FormGroup>

          <div className="student-absence-create-submit">
            <button
              type="submit"
              className="btn-primary"
              disabled={createSubmitting || reasonLength > MAX_REASON_LENGTH || lessonsLoading}
            >
              <Send size={16} aria-hidden />
              {createSubmitting ? t('studentAbsenceCreateSubmitting') : t('studentAbsenceCreateSubmit')}
            </button>
          </div>
        </form>
      </SectionCard>

      <AbsenceRequestsFiltersBar
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={STUDENT_STATUS_OPTIONS}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        t={t}
      />

      {error && (
        <Alert variant="error" role="alert" className="ed-card">
          {error}
        </Alert>
      )}

      <SectionCard icon={<ClipboardList size={18} />} title={t('studentAbsenceRequestsTableTitle')}>
        <div className="department-table-wrap">
          {loading ? (
            <div className="department-empty">
              <p>{t('loadingList')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="department-empty">
              <p>{items.length === 0 ? t('absenceRequestsNoNotices') : t('noResults')}</p>
            </div>
          ) : (
            <table className="department-table">
              <thead>
                <tr>
                  <th>{t('absenceRequestsDate')}</th>
                  <th>{t('absenceRequestsSubject')}</th>
                  <th>{t('absenceRequestsLessonType')}</th>
                  <th>{t('absenceRequestsNoticeType')}</th>
                  <th>{t('absenceRequestsStatus')}</th>
                  <th>{t('absenceRequestsSubmittedAt')}</th>
                  <th>{t('absenceRequestsActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const lessonDate = getLessonDate(item);
                  const subject = getSubjectDisplay(item);
                  const status = item.notice.status;
                  const variant = getStatusBadgeVariant(status);
                  const lessonTypeValue = getLessonType(item);
                  const lessonTypeLabel = lessonTypeValue ? t(getLessonTypeDisplayKey(lessonTypeValue)) : '—';
                  const typeLabel = t(getNoticeTypeKey(item.notice.type));
                  const sessionId = item.lesson?.id ?? item.notice.lessonSessionIds?.[0] ?? '';
                  const canOpenLesson = sessionId !== '';

                  return (
                    <tr key={item.notice.id}>
                      <td>
                        {canOpenLesson ? (
                          <Link to={lessonUrl(sessionId)} className="absence-requests-student-link">
                            {formatDate(lessonDate, locale)}
                            {item.lesson?.startTime && (
                              <span className="student-absence-time">
                                {' '}
                                {item.lesson.startTime.slice(0, 5)}
                                {item.lesson.endTime ? ` – ${item.lesson.endTime.slice(0, 5)}` : ''}
                              </span>
                            )}
                          </Link>
                        ) : (
                          formatDate(lessonDate, locale)
                        )}
                      </td>
                      <td>{subject}</td>
                      <td>{lessonTypeLabel}</td>
                      <td>{typeLabel}</td>
                      <td>
                        <span className={`absence-status-badge absence-status-badge--${variant}`}>
                          {variant === 'approved' && <Check className="absence-status-icon" aria-hidden />}
                          {variant === 'pending' && <Clock className="absence-status-icon" aria-hidden />}
                          {variant === 'rejected' && <X className="absence-status-icon" aria-hidden />}
                          {t(getStatusLabelKey(status))}
                        </span>
                      </td>
                      <td>{formatDateTime(item.notice.submittedAt, locale)}</td>
                      <td>
                        {canOpenLesson ? (
                          <Link
                            to={lessonUrl(sessionId)}
                            className="department-table-btn department-table-btn-link"
                            title={t('absenceRequestsGoToLesson')}
                          >
                            {t('absenceRequestsGoToLesson')}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && nextCursor != null && (
          <div className="department-page-load-more">
            <button
              type="button"
              className="department-page-load-more-btn"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? t('loadingList') : t('absenceRequestsLoadMore')}
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

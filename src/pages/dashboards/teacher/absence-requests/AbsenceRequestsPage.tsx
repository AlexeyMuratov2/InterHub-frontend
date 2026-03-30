import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  listTeacherNotices,
  ABSENCE_NOTICE_STATUS,
  ABSENCE_NOTICE_TYPE,
  type TeacherAbsenceNoticeItemDto,
  type AbsenceNoticeStatus,
} from '../../../../shared/api';
import { useTranslation, formatDate, formatDateTime, type Locale } from '../../../../shared/i18n';
import { Modal, PageHero, SectionCard, Alert, AbsenceRequestsFiltersBar } from '../../../../shared/ui';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';

const LIMIT = 30;
const REASON_PREVIEW_LENGTH = 80;

/** Фильтр по статусу: пустая строка = все, SUBMITTED, CANCELED */
type StatusFilterValue = typeof ABSENCE_NOTICE_STATUS.SUBMITTED | typeof ABSENCE_NOTICE_STATUS.CANCELED | '';

/** Предмет: только для заявки на один урок (offering.subjectName и т.д.). */
function getSubjectDisplay(item: TeacherAbsenceNoticeItemDto): string {
  if (!item.lesson) return '—';
  return item.offering?.subjectName ?? item.lesson?.topic ?? item.group?.name ?? item.group?.code ?? '—';
}

/** Даты заявки: один урок — одна дата; период — «с … по …». */
function getDateDisplay(item: TeacherAbsenceNoticeItemDto, locale: Locale): string {
  if (item.lesson) {
    return formatDate(item.lesson.date, locale);
  }
  if (item.period) {
    const start = formatDate(item.period.startAt.slice(0, 10), locale);
    const end = formatDate(item.period.endAt.slice(0, 10), locale);
    return start === end ? start : `${start} – ${end}`;
  }
  return formatDate(item.notice.submittedAt.slice(0, 10), locale);
}

/** ID первого занятия (для перехода к уроку). */
function getFirstLessonSessionId(item: TeacherAbsenceNoticeItemDto): string {
  return item.lesson?.id ?? item.notice.lessonSessionIds?.[0] ?? '';
}

const TEACHER_STATUS_OPTIONS = [
  { value: ABSENCE_NOTICE_STATUS.SUBMITTED, labelKey: 'absenceRequestsStatusSubmitted' },
  { value: ABSENCE_NOTICE_STATUS.CANCELED, labelKey: 'absenceRequestsStatusCanceled' },
];

export function AbsenceRequestsPage() {
  const [searchParams] = useSearchParams();
  const { t, locale } = useTranslation('dashboard');
  const [items, setItems] = useState<TeacherAbsenceNoticeItemDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReasonIds, setExpandedReasonIds] = useState<Set<string>>(new Set());

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('dateFrom') ?? '';
    const to = p.get('dateTo') ?? '';
    return from || to ? '' : ABSENCE_NOTICE_STATUS.SUBMITTED;
  });
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>(() => new URLSearchParams(window.location.search).get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState<string>(() => new URLSearchParams(window.location.search).get('dateTo') ?? '');

  const [viewItem, setViewItem] = useState<TeacherAbsenceNoticeItemDto | null>(null);

  useEffect(() => {
    const from = searchParams.get('dateFrom') ?? '';
    const to = searchParams.get('dateTo') ?? '';
    if (from || to) {
      setDateFrom(from);
      setDateTo(to);
    }
  }, [searchParams]);

  const load = async (cursor?: string | null) => {
    const isFirst = cursor == null;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    const statusesParam =
      statusFilter === ABSENCE_NOTICE_STATUS.SUBMITTED || statusFilter === ABSENCE_NOTICE_STATUS.CANCELED
        ? statusFilter
        : undefined;
    const { data, error: err } = await listTeacherNotices({
      statuses: statusesParam,
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

  useEffect(() => {
    load();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    let list = items;
    if (subjectFilter) {
      list = list.filter((item) => getSubjectDisplay(item) === subjectFilter);
    }
    if (groupFilter) {
      const groupKey = (item: TeacherAbsenceNoticeItemDto) =>
        item.group?.name ?? item.group?.code ?? item.student?.groupName ?? '';
      list = list.filter((item) => groupKey(item) === groupFilter);
    }
    if (dateFrom || dateTo) {
      list = list.filter((item) => {
        if (item.lesson) {
          const d = item.lesson.date;
          return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
        }
        if (item.period) {
          const start = item.period.startAt.slice(0, 10);
          const end = item.period.endAt.slice(0, 10);
          return (!dateTo || start <= dateTo) && (!dateFrom || end >= dateFrom);
        }
        return true;
      });
    }
    return list;
  }, [items, subjectFilter, groupFilter, dateFrom, dateTo]);

  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const s = getSubjectDisplay(item);
      if (s && s !== '—') set.add(s);
    });
    return Array.from(set).sort();
  }, [items]);

  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const g = item.group?.name ?? item.group?.code ?? item.student?.groupName ?? '';
      if (g) set.add(g);
    });
    return Array.from(set).sort();
  }, [items]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) load(nextCursor);
  };

  const lessonUrl = (lessonSessionId: string) => `/dashboards/teacher/lessons/${lessonSessionId}`;

  const openView = (item: TeacherAbsenceNoticeItemDto) => setViewItem(item);
  const closeView = () => setViewItem(null);

  const toggleReasonExpand = (noticeId: string) => {
    setExpandedReasonIds((prev) => {
      const next = new Set(prev);
      if (next.has(noticeId)) next.delete(noticeId);
      else next.add(noticeId);
      return next;
    });
  };

  const subjectOptions = useMemo(
    () => uniqueSubjects.map((s) => ({ value: s, label: s })),
    [uniqueSubjects]
  );
  const groupOptions = useMemo(
    () => uniqueGroups.map((g) => ({ value: g, label: g })),
    [uniqueGroups]
  );

  return (
    <div className="entity-view-page department-form-page ed-page">
      <PageHero
        icon={<ClipboardList size={28} />}
        title={t('absenceRequestsTitle')}
        subtitle={t('absenceRequestsSubtitle')}
      />

      <AbsenceRequestsFiltersBar
        statusValue={statusFilter}
        onStatusChange={(v) => setStatusFilter(v as StatusFilterValue)}
        statusOptions={TEACHER_STATUS_OPTIONS}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        showSubjectSelect
        subjectValue={subjectFilter}
        onSubjectChange={setSubjectFilter}
        subjectOptions={subjectOptions}
        showGroupSelect
        groupValue={groupFilter}
        onGroupChange={setGroupFilter}
        groupOptions={groupOptions}
        t={t}
      />

      {error && (
        <Alert variant="error" role="alert" className="ed-card">
          {error}
        </Alert>
      )}

      <SectionCard icon={<ClipboardList size={18} />} title={t('absenceRequestsTitle')}>
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
                  <th>{t('absenceRequestsStudent')}</th>
                  <th>{t('absenceRequestsDatesColumn')}</th>
                  <th>{t('absenceRequestsSubject')}</th>
                  <th>{t('absenceRequestsStatus')}</th>
                  <th>{t('absenceRequestsReason')}</th>
                  <th>{t('absenceRequestsSubmittedAt')}</th>
                  <th>{t('absenceRequestsActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const studentName = item.student?.displayName ?? item.student?.studentId ?? '—';
                  const dateDisplay = getDateDisplay(item, locale);
                  const subject = getSubjectDisplay(item);
                  const status: AbsenceNoticeStatus = item.notice.status;
                  const type = item.notice.type;
                  const isCanceled = status === ABSENCE_NOTICE_STATUS.CANCELED;
                  const typeVariant = type === ABSENCE_NOTICE_TYPE.LATE ? 'late' : 'absent';
                  const reasonText = item.notice.reasonText || '—';
                  const isReasonLong = reasonText.length > REASON_PREVIEW_LENGTH;
                  const isExpanded = expandedReasonIds.has(item.notice.id);
                  const lessonSessionId = getFirstLessonSessionId(item);
                  const lessonLink = lessonUrl(lessonSessionId);
                  const canOpenLesson = item.lesson != null && lessonSessionId !== '';

                  return (
                    <tr key={item.notice.id}>
                      <td>
                        {canOpenLesson ? (
                          <Link to={lessonLink} className="absence-requests-student-link">
                            {studentName}
                          </Link>
                        ) : (
                          studentName
                        )}
                      </td>
                      <td>{dateDisplay}</td>
                      <td>{subject}</td>
                      <td>
                        {isCanceled ? (
                          <span className="absence-status-badge absence-status-badge--canceled">
                            {t('absenceRequestsStatusCanceled')}
                          </span>
                        ) : (
                          <span
                            className={`absence-status-badge absence-type-badge absence-type-badge--${typeVariant}`}
                            title={type === ABSENCE_NOTICE_TYPE.LATE ? t('absenceRequestsNoticeTypeLate') : t('absenceRequestsNoticeTypeAbsent')}
                          >
                            {type === ABSENCE_NOTICE_TYPE.LATE
                              ? t('absenceRequestsNoticeTypeLate')
                              : t('absenceRequestsNoticeTypeAbsent')}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="absence-reason-cell">
                          {isReasonLong ? (
                            <>
                              <span className="absence-reason-text">
                                {isExpanded ? reasonText : `${reasonText.slice(0, REASON_PREVIEW_LENGTH)}…`}
                              </span>
                              <button
                                type="button"
                                className="absence-reason-toggle"
                                onClick={() => toggleReasonExpand(item.notice.id)}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <>
                                    {t('absenceRequestsReasonCollapse')}
                                    <ChevronUp className="absence-reason-toggle-icon" aria-hidden />
                                  </>
                                ) : (
                                  <>
                                    {t('absenceRequestsReasonExpand')}
                                    <ChevronDown className="absence-reason-toggle-icon" aria-hidden />
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="absence-reason-text">{reasonText}</span>
                          )}
                        </div>
                      </td>
                      <td>{formatDateTime(item.notice.submittedAt, locale)}</td>
                      <td>
                        <div className="department-table-actions">
                          <button
                            type="button"
                            className="department-table-btn"
                            onClick={() => openView(item)}
                            title={t('absenceRequestsActionView')}
                            aria-label={t('absenceRequestsActionView')}
                          >
                            {t('absenceRequestsActionView')}
                          </button>
                          {canOpenLesson && (
                            <Link
                              to={lessonLink}
                              className="department-table-btn department-table-btn-link"
                              title={t('absenceRequestsGoToLesson')}
                            >
                              {t('absenceRequestsGoToLesson')}
                            </Link>
                          )}
                        </div>
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

      <Modal
        open={viewItem != null}
        onClose={closeView}
        title={t('absenceRequestsModalTitle')}
        variant="form"
        modalClassName="absence-review-modal"
      >
        {viewItem && (
          <div className="absence-review-modal-content">
            <dl className="absence-review-dl">
              <dt>{t('absenceRequestsStudent')}</dt>
              <dd>{viewItem.student?.displayName ?? viewItem.student?.studentId ?? '—'}</dd>
              {viewItem.student?.groupName && (
                <>
                  <dt>{t('absenceRequestsGroup')}</dt>
                  <dd>{viewItem.student.groupName}</dd>
                </>
              )}
              <dt>{t('absenceRequestsDatesColumn')}</dt>
              <dd>
                {viewItem.lesson
                  ? formatDate(viewItem.lesson.date, locale) +
                    (viewItem.lesson.startTime
                      ? ` ${viewItem.lesson.startTime.slice(0, 5)} – ${viewItem.lesson.endTime?.slice(0, 5) ?? ''}`
                      : '')
                  : viewItem.period
                    ? (() => {
                        const start = viewItem.period.startAt.slice(0, 10);
                        const end = viewItem.period.endAt.slice(0, 10);
                        const startF = formatDate(start, locale);
                        const endF = formatDate(end, locale);
                        return start === end ? startF : `${startF} – ${endF}`;
                      })()
                    : formatDate(viewItem.notice.submittedAt.slice(0, 10), locale)}
              </dd>
              <dt>{t('absenceRequestsSubjectName')}</dt>
              <dd>{getSubjectDisplay(viewItem)}</dd>
              <dt>{t('absenceRequestsStatus')}</dt>
              <dd>
                {viewItem.notice.status === ABSENCE_NOTICE_STATUS.CANCELED ? (
                  t('absenceRequestsStatusCanceled')
                ) : viewItem.notice.type === ABSENCE_NOTICE_TYPE.LATE ? (
                  t('absenceRequestsNoticeTypeLate')
                ) : (
                  t('absenceRequestsNoticeTypeAbsent')
                )}
              </dd>
              <dt>{t('absenceRequestsReason')}</dt>
              <dd>{viewItem.notice.reasonText || '—'}</dd>
              <dt>{t('absenceRequestsSubmittedAt')}</dt>
              <dd>{formatDateTime(viewItem.notice.submittedAt, locale)}</dd>
              {viewItem.notice.fileIds?.length > 0 && (
                <>
                  <dt>{t('absenceRequestsAttachments')}</dt>
                  <dd>{t('absenceRequestsAttachmentsCount', { count: viewItem.notice.fileIds.length })}</dd>
                </>
              )}
            </dl>
            <div className="absence-review-actions">
              {viewItem.lesson != null && getFirstLessonSessionId(viewItem) && (
                <Link
                  to={lessonUrl(getFirstLessonSessionId(viewItem))}
                  className="department-table-btn department-table-btn--primary"
                  onClick={closeView}
                >
                  {t('absenceRequestsGoToLesson')}
                </Link>
              )}
              <button type="button" className="department-table-btn" onClick={closeView}>
                {t('absenceRequestsClose')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

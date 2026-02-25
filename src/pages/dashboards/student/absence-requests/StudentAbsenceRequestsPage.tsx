import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Check, Clock, X } from 'lucide-react';
import {
  getMyAbsenceNotices,
  ABSENCE_NOTICE_STATUS,
  type StudentAbsenceNoticeItemDto,
  type AbsenceNoticeStatus,
} from '../../../../shared/api';
import { useTranslation, formatDate, formatDateTime } from '../../../../shared/i18n';
import { PageHero, SectionCard, Alert, AbsenceRequestsFiltersBar } from '../../../../shared/ui';
import { getLessonTypeDisplayKey } from '../../../../shared/lib';

const LIMIT = 30;

type StatusFilterValue = typeof ABSENCE_NOTICE_STATUS.SUBMITTED | '';

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
  const [items, setItems] = useState<StudentAbsenceNoticeItemDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const load = async (cursor?: string | null) => {
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

  useEffect(() => {
    load();
  }, [dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter) {
      list = list.filter((item) => item.notice.status === statusFilter);
    }
    return list;
  }, [items, statusFilter]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) load(nextCursor);
  };

  const lessonUrl = (lessonSessionId: string) => `/dashboards/student/lessons/${lessonSessionId}`;

  return (
    <div className="entity-view-page department-form-page ed-page">
      <PageHero
        icon={<ClipboardList size={28} />}
        title={t('studentAbsenceRequestsTitle')}
        subtitle={t('studentAbsenceRequestsSubtitle')}
      />

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
                  const sessionId = item.lesson?.id ?? item.notice.lessonSessionId;

                  return (
                    <tr key={item.notice.id}>
                      <td>
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
                        <Link
                          to={lessonUrl(sessionId)}
                          className="department-table-btn department-table-btn-link"
                          title={t('absenceRequestsGoToLesson')}
                        >
                          {t('absenceRequestsGoToLesson')}
                        </Link>
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

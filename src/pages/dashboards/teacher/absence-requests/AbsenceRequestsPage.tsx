import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  listTeacherNotices,
  approveNotice,
  rejectNotice,
  ABSENCE_NOTICE_STATUS,
  type TeacherAbsenceNoticeItemDto,
  type AbsenceNoticeStatus,
} from '../../../../shared/api';
import { useTranslation, formatDate, formatDateTime } from '../../../../shared/i18n';
import { EntityListLayout } from '../../../../widgets/entity-list-layout';
import { Modal, FormGroup } from '../../../../shared/ui';
import { getLessonTypeDisplayKey } from '../../../../shared/lib';
import { Check, Clock, X, ChevronDown, Calendar } from 'lucide-react';

const LIMIT = 30;
const MAX_COMMENT_LENGTH = 2000;

/** По умолчанию запрос с статусом Pending (SUBMITTED). «Все типы» = пустой statuses. */
type StatusFilterValue = typeof ABSENCE_NOTICE_STATUS.SUBMITTED | '';

function getStatusBadgeVariant(status: AbsenceNoticeStatus): 'approved' | 'pending' | 'rejected' | 'submitted' | 'canceled' | 'acknowledged' | 'attached' {
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

/** Предмет: приоритет у названия из офферинга (subjectName), затем тема занятия, группа. */
function getSubjectDisplay(item: TeacherAbsenceNoticeItemDto): string {
  return item.offering?.subjectName ?? item.lesson?.topic ?? item.group?.name ?? item.group?.code ?? '—';
}

/** Тип занятия: приоритет у слота офферинга (slot.lessonType), иначе lesson.lessonType. */
function getLessonType(item: TeacherAbsenceNoticeItemDto): string | null {
  return item.slot?.lessonType ?? item.lesson?.lessonType ?? null;
}

export function AbsenceRequestsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useTranslation('dashboard');
  const [items, setItems] = useState<TeacherAbsenceNoticeItemDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const [reviewItem, setReviewItem] = useState<TeacherAbsenceNoticeItemDto | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [respondLoading, setRespondLoading] = useState<'approve' | 'reject' | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);

  const dateFromInputRef = useRef<HTMLInputElement>(null);
  const dateToInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const from = searchParams.get('dateFrom') ?? '';
    const to = searchParams.get('dateTo') ?? '';
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c470b1f7-aa7f-426b-ab37-21c24aa9760e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AbsenceRequestsPage.tsx:searchParams effect',message:'searchParams effect ran',data:{from,to,willSetState:!!(from||to)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (from || to) {
      setDateFrom(from);
      setDateTo(to);
      // Do not set statusFilter to '' — it triggers a second load() that overwrites items with empty API result
    }
  }, [searchParams]);

  const load = async (cursor?: string | null) => {
    const isFirst = cursor == null;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c470b1f7-aa7f-426b-ab37-21c24aa9760e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AbsenceRequestsPage.tsx:load() entry',message:'load called',data:{statusFilter,isFirst,cursor:!!cursor},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    const statusesParam = statusFilter === ABSENCE_NOTICE_STATUS.SUBMITTED ? ABSENCE_NOTICE_STATUS.SUBMITTED : undefined;
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c470b1f7-aa7f-426b-ab37-21c24aa9760e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AbsenceRequestsPage.tsx:load() done',message:'load completed',data:{listLength:list.length,isFirst,hadError:!!err},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c470b1f7-aa7f-426b-ab37-21c24aa9760e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AbsenceRequestsPage.tsx:useMemo filtered',message:'filtered memo',data:{itemsLength:items.length,dateFrom,dateTo,subjectFilter,groupFilter},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (subjectFilter) {
      list = list.filter((item) => getSubjectDisplay(item) === subjectFilter);
    }
    if (groupFilter) {
      list = list.filter((item) => (item.group?.name ?? item.group?.code ?? '') === groupFilter);
    }
    if (dateFrom) {
      list = list.filter((item) => item.lesson && item.lesson.date >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((item) => item.lesson && item.lesson.date <= dateTo);
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c470b1f7-aa7f-426b-ab37-21c24aa9760e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AbsenceRequestsPage.tsx:filtered result',message:'filtered length',data:{filteredLength:list.length},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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
      const g = item.group?.name ?? item.group?.code ?? '';
      if (g) set.add(g);
    });
    return Array.from(set).sort();
  }, [items]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) load(nextCursor);
  };

  const lessonUrl = (lessonSessionId: string) => `/dashboards/teacher/lessons/${lessonSessionId}`;
  const isPending = (status: AbsenceNoticeStatus) => status === ABSENCE_NOTICE_STATUS.SUBMITTED;

  const openReview = (item: TeacherAbsenceNoticeItemDto) => {
    setReviewItem(item);
    setReviewComment('');
    setRespondError(null);
  };

  const closeReview = () => {
    setReviewItem(null);
    setReviewComment('');
    setRespondError(null);
    setRespondLoading(null);
  };

  const handleApprove = async () => {
    if (!reviewItem) return;
    setRespondLoading('approve');
    setRespondError(null);
    const comment = reviewComment.trim().slice(0, MAX_COMMENT_LENGTH) || undefined;
    const { data, error: err } = await approveNotice(reviewItem.notice.id, comment ? { comment } : undefined);
    setRespondLoading(null);
    if (err) {
      setRespondError(err.message ?? t('absenceRequestsErrorRespond'));
      return;
    }
    setSuccess(t('absenceRequestsSuccessApproved'));
    setTimeout(() => setSuccess(null), 3000);
    setItems((prev) =>
      prev.map((it) =>
        it.notice.id === reviewItem.notice.id ? { ...it, notice: data! } : it
      )
    );
    closeReview();
  };

  const handleReject = async () => {
    if (!reviewItem) return;
    setRespondLoading('reject');
    setRespondError(null);
    const comment = reviewComment.trim().slice(0, MAX_COMMENT_LENGTH) || undefined;
    const { data, error: err } = await rejectNotice(reviewItem.notice.id, comment ? { comment } : undefined);
    setRespondLoading(null);
    if (err) {
      setRespondError(err.message ?? t('absenceRequestsErrorRespond'));
      return;
    }
    setSuccess(t('absenceRequestsSuccessRejected'));
    setTimeout(() => setSuccess(null), 3000);
    setItems((prev) =>
      prev.map((it) =>
        it.notice.id === reviewItem.notice.id ? { ...it, notice: data! } : it
      )
    );
    closeReview();
  };

  const lessonTypeValue = reviewItem ? getLessonType(reviewItem) : null;
  const lessonTypeLabel = lessonTypeValue ? t(getLessonTypeDisplayKey(lessonTypeValue)) : '—';

  return (
    <EntityListLayout
      title={t('absenceRequestsTitle')}
      subtitle={t('absenceRequestsSubtitle')}
      viewOnly={false}
      error={error}
      success={success}
      showToolbar={false}
      searchValue=""
      onSearchChange={() => {}}
      searchPlaceholder=""
      showCreate={false}
    >
      <div className="absence-requests-filters-card">
        <div className="absence-requests-filters-inner">
          <div className="absence-requests-filter-field absence-requests-filter-field--select">
            <select
              className="absence-requests-select"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label={t('absenceRequestsFilterAllSubjects')}
            >
              <option value="">{t('absenceRequestsFilterAllSubjects')}</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absence-requests-select-icon" aria-hidden />
          </div>
          <div className="absence-requests-filter-field absence-requests-filter-field--select">
            <select
              className="absence-requests-select"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              aria-label={t('absenceRequestsFilterAllGroups')}
            >
              <option value="">{t('absenceRequestsFilterAllGroups')}</option>
              {uniqueGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown className="absence-requests-select-icon" aria-hidden />
          </div>
          <div className="absence-requests-filter-field absence-requests-filter-field--select">
            <select
              className="absence-requests-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
              aria-label={t('absenceRequestsStatus')}
            >
              <option value="">{t('absenceRequestsFilterAllStatus')}</option>
              <option value={ABSENCE_NOTICE_STATUS.SUBMITTED}>{t('absenceRequestsStatusPending')}</option>
            </select>
            <ChevronDown className="absence-requests-select-icon" aria-hidden />
          </div>
          <div className="absence-requests-filter-field absence-requests-filter-field--date">
            <input
              ref={dateFromInputRef}
              type="date"
              className="absence-requests-date-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label={t('absenceRequestsDateFrom')}
              id="absence-requests-date-from"
            />
            <button
              type="button"
              className="absence-requests-date-trigger"
              onClick={() => dateFromInputRef.current?.showPicker?.() ?? dateFromInputRef.current?.click()}
              aria-label={t('absenceRequestsDateFrom')}
              title={t('absenceRequestsDateFrom')}
            >
              <Calendar className="absence-requests-date-icon" aria-hidden />
            </button>
          </div>
          <div className="absence-requests-filter-field absence-requests-filter-field--date">
            <input
              ref={dateToInputRef}
              type="date"
              className="absence-requests-date-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label={t('absenceRequestsDateTo')}
              id="absence-requests-date-to"
            />
            <button
              type="button"
              className="absence-requests-date-trigger"
              onClick={() => dateToInputRef.current?.showPicker?.() ?? dateToInputRef.current?.click()}
              aria-label={t('absenceRequestsDateTo')}
              title={t('absenceRequestsDateTo')}
            >
              <Calendar className="absence-requests-date-icon" aria-hidden />
            </button>
          </div>
        </div>
      </div>

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
                <th>{t('absenceRequestsDate')}</th>
                <th>{t('absenceRequestsSubject')}</th>
                <th>{t('absenceRequestsLessonType')}</th>
                <th>{t('absenceRequestsStatus')}</th>
                <th>{t('absenceRequestsActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const studentName = item.student?.displayName ?? item.student?.studentId ?? '—';
                const lessonDate = item.lesson?.date ?? item.notice.submittedAt.slice(0, 10);
                const subject = getSubjectDisplay(item);
                const status = item.notice.status;
                const variant = getStatusBadgeVariant(status);
                const lessonLink = lessonUrl(item.notice.lessonSessionId);
                const lessonTypeValue = getLessonType(item);
                const lessonTypeLabelRow = lessonTypeValue ? t(getLessonTypeDisplayKey(lessonTypeValue)) : '—';
                return (
                  <tr key={item.notice.id}>
                    <td>
                      <Link to={lessonLink} className="absence-requests-student-link">
                        {studentName}
                      </Link>
                    </td>
                    <td>{formatDate(lessonDate, locale)}</td>
                    <td>{subject}</td>
                    <td>{lessonTypeLabelRow}</td>
                    <td>
                      <span className={`absence-status-badge absence-status-badge--${variant}`}>
                        {variant === 'approved' && <Check className="absence-status-icon" aria-hidden />}
                        {variant === 'pending' && <Clock className="absence-status-icon" aria-hidden />}
                        {variant === 'rejected' && <X className="absence-status-icon" aria-hidden />}
                        {t(getStatusLabelKey(status))}
                      </span>
                    </td>
                    <td>
                      <div className="department-table-actions">
                        {isPending(status) ? (
                          <button
                            type="button"
                            className="department-table-btn department-table-btn--primary"
                            onClick={() => openReview(item)}
                            title={t('absenceRequestsActionReview')}
                            aria-label={t('absenceRequestsActionReview')}
                          >
                            {t('absenceRequestsActionReview')}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="department-table-btn"
                              onClick={() => openReview(item)}
                              title={t('absenceRequestsActionView')}
                              aria-label={t('absenceRequestsActionView')}
                            >
                              {t('absenceRequestsActionView')}
                            </button>
                            <Link
                              to={lessonLink}
                              className="department-table-btn department-table-btn-link"
                              title={t('absenceRequestsGoToLesson')}
                            >
                              {t('absenceRequestsGoToLesson')}
                            </Link>
                          </>
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

      <Modal
        open={reviewItem != null}
        onClose={closeReview}
        title={t('absenceRequestsModalTitle')}
        variant="form"
        modalClassName="absence-review-modal"
      >
        {reviewItem && (
          <div className="absence-review-modal-content">
            <dl className="absence-review-dl">
              <dt>{t('absenceRequestsStudent')}</dt>
              <dd>{reviewItem.student?.displayName ?? reviewItem.student?.studentId ?? '—'}</dd>
              {reviewItem.student?.groupName && (
                <>
                  <dt>{t('absenceRequestsGroup')}</dt>
                  <dd>{reviewItem.student.groupName}</dd>
                </>
              )}
              <dt>{t('absenceRequestsDate')}</dt>
              <dd>
                {reviewItem.lesson
                  ? formatDate(reviewItem.lesson.date, locale) +
                    (reviewItem.lesson.startTime
                      ? ` ${reviewItem.lesson.startTime.slice(0, 5)} – ${reviewItem.lesson.endTime?.slice(0, 5) ?? ''}`
                      : '')
                  : formatDate(reviewItem.notice.submittedAt.slice(0, 10), locale)}
              </dd>
              <dt>{t('absenceRequestsSubjectName')}</dt>
              <dd>{getSubjectDisplay(reviewItem)}</dd>
              <dt>{t('absenceRequestsLessonType')}</dt>
              <dd>{lessonTypeLabel}</dd>
              <dt>{t('absenceRequestsStatus')}</dt>
              <dd>{t(getNoticeTypeKey(reviewItem.notice.type))}</dd>
              <dt>{t('absenceRequestsReason')}</dt>
              <dd>{reviewItem.notice.reasonText || '—'}</dd>
              <dt>{t('absenceRequestsSubmittedAt')}</dt>
              <dd>{formatDateTime(reviewItem.notice.submittedAt, locale)}</dd>
              {reviewItem.notice.fileIds?.length > 0 && (
                <>
                  <dt>{t('absenceRequestsAttachments')}</dt>
                  <dd>{t('absenceRequestsAttachmentsCount', { count: reviewItem.notice.fileIds.length })}</dd>
                </>
              )}
              {(reviewItem.notice.teacherComment != null || reviewItem.notice.respondedAt != null) && (
                <>
                  <dt>{t('absenceRequestsTeacherResponse')}</dt>
                  <dd>
                    {reviewItem.notice.teacherComment && (
                      <p className="absence-review-teacher-comment">{reviewItem.notice.teacherComment}</p>
                    )}
                    {reviewItem.notice.respondedAt && (
                      <p className="absence-review-responded-at">
                        {t('absenceRequestsRespondedAt')}: {formatDateTime(reviewItem.notice.respondedAt, locale)}
                      </p>
                    )}
                  </dd>
                </>
              )}
            </dl>

            {isPending(reviewItem.notice.status) && (
              <>
                <FormGroup
                  label={t('absenceRequestsTeacherComment')}
                  htmlFor="absence-review-comment"
                >
                  <textarea
                    id="absence-review-comment"
                    className="absence-review-comment-input"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t('absenceRequestsTeacherCommentPlaceholder')}
                    rows={3}
                    maxLength={MAX_COMMENT_LENGTH}
                  />
                </FormGroup>
                {respondError && (
                  <div className="field-error" role="alert">
                    {respondError}
                  </div>
                )}
                <div className="absence-review-actions">
                  <button
                    type="button"
                    className="department-table-btn department-table-btn--success"
                    onClick={handleApprove}
                    disabled={respondLoading != null}
                  >
                    {respondLoading === 'approve' ? t('loadingList') : t('absenceRequestsApprove')}
                  </button>
                  <button
                    type="button"
                    className="department-table-btn department-table-btn--danger"
                    onClick={handleReject}
                    disabled={respondLoading != null}
                  >
                    {respondLoading === 'reject' ? t('loadingList') : t('absenceRequestsReject')}
                  </button>
                  <button type="button" className="department-table-btn" onClick={closeReview}>
                    {t('cancel')}
                  </button>
                </div>
              </>
            )}

            {!isPending(reviewItem.notice.status) && (
              <div className="absence-review-actions">
                <button
                  type="button"
                  className="department-table-btn department-table-btn--primary"
                  onClick={() => {
                    closeReview();
                    navigate(lessonUrl(reviewItem.notice.lessonSessionId));
                  }}
                >
                  {t('absenceRequestsGoToLesson')}
                </button>
                <button type="button" className="department-table-btn" onClick={closeReview}>
                  {t('absenceRequestsClose')}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </EntityListLayout>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, formatDate, formatDateTime } from '../../i18n';
import type { Locale } from '../../i18n';
import { getStudentAttendanceHistory } from '../../api';
import type {
  StudentAttendanceHistoryDto,
  StudentAttendanceHistoryLessonItemDto,
  StudentNoticeDto,
} from '../../api';
import { Modal, Alert } from '..';
import { Calendar, UserCheck, FileText, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

const TEACHER_LESSON_PATH = '/dashboards/teacher/lessons';

export interface StudentAttendanceHistoryModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  offeringId: string;
  /** Student display name for the modal title */
  studentDisplayName: string;
}

function getAttendanceStatusLabelKey(status: string): string {
  switch (status) {
    case 'PRESENT':
      return 'attendanceStatusPresent';
    case 'ABSENT':
      return 'attendanceStatusAbsent';
    case 'LATE':
      return 'attendanceStatusLate';
    case 'EXCUSED':
      return 'attendanceStatusExcused';
    default:
      return 'attendanceStatusUnmarked';
  }
}

function getNoticeStatusLabelKey(status: string): string {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';
  return `absenceRequestsStatus${label}`;
}

function lessonDateTime(lesson: StudentAttendanceHistoryLessonItemDto['lesson'], locale: Locale): string {
  try {
    const dateStr = formatDate(lesson.date + 'T00:00:00', locale);
    const start = lesson.startTime ? lesson.startTime.slice(0, 5) : '';
    return start ? `${dateStr}, ${start}` : dateStr;
  } catch {
    return lesson.date;
  }
}

function NoticeCard({ notice, locale }: { notice: StudentNoticeDto; locale: Locale }) {
  const { t } = useTranslation('dashboard');
  return (
    <div className="student-attendance-history-modal__notice">
      <div className="student-attendance-history-modal__notice-header">
        <FileText size={14} aria-hidden />
        <span className="student-attendance-history-modal__notice-type">
          {notice.type === 'LATE' ? t('absenceRequestsNoticeTypeLate') : t('absenceRequestsNoticeTypeAbsent')}
        </span>
        <span className={`student-attendance-history-modal__notice-status status-${(notice.status || '').toLowerCase()}`}>
          {t(getNoticeStatusLabelKey(notice.status))}
        </span>
      </div>
      {notice.reasonText && (
        <p className="student-attendance-history-modal__notice-reason">{notice.reasonText}</p>
      )}
      <div className="student-attendance-history-modal__notice-meta">
        <span>{t('attendanceHistoryNoticeSubmittedAt')}: {formatDateTime(notice.submittedAt, locale)}</span>
        {notice.fileIds?.length > 0 && (
          <span>{t('attendanceHistoryAttachments')}: {notice.fileIds.length}</span>
        )}
      </div>
    </div>
  );
}

export function StudentAttendanceHistoryModal({
  open,
  onClose,
  studentId,
  offeringId,
  studentDisplayName,
}: StudentAttendanceHistoryModalProps) {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [data, setData] = useState<StudentAttendanceHistoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLessonIds, setExpandedLessonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !studentId || !offeringId) {
      setData(null);
      setError(null);
      setExpandedLessonIds(new Set());
      return;
    }
    setLoading(true);
    setError(null);
    getStudentAttendanceHistory(studentId, offeringId)
      .then((res) => {
        if (res.error) {
          setError(res.error.message ?? tRef.current('attendanceHistoryLoadError'));
          setData(null);
        } else {
          setData(res.data ?? null);
        }
      })
      .catch(() => {
        setError(tRef.current('attendanceHistoryLoadError'));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [open, studentId, offeringId]);

  const toggleLesson = (lessonId: string) => {
    setExpandedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('attendanceHistoryModalTitle', { name: studentDisplayName })}
      variant="default"
      modalClassName="student-attendance-history-modal"
    >
      <div className="student-attendance-history-modal__body">
        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error" role="alert">{error}</Alert>
          </div>
        )}
        {loading && (
          <p className="student-attendance-history-modal__loading">{t('loading')}</p>
        )}
        {!loading && !error && data && (
          <>
            <div className="student-attendance-history-modal__summary">
              <div className="student-attendance-history-modal__summary-row">
                <UserCheck size={20} aria-hidden />
                <span>{data.subjectName}</span>
              </div>
              <div className="student-attendance-history-modal__summary-stats">
                <span>{t('attendanceHistoryMissedCount', { count: data.missedCount })}</span>
                <span>{t('attendanceHistoryNoticesCount', { count: data.absenceNoticesSubmittedCount })}</span>
              </div>
            </div>
            {!data.lessons?.length ? (
              <p className="student-attendance-history-modal__empty">{t('attendanceHistoryNoLessons')}</p>
            ) : (
              <ol className="student-attendance-history-modal__list">
                {data.lessons.map((item) => {
                  const { lesson, attendance, absenceNotices } = item;
                  const status = attendance?.status ?? null;
                  const hasNotices = absenceNotices?.length > 0;
                  const isExpanded = expandedLessonIds.has(lesson.id);
                  const borderClass = status === 'PRESENT'
                    ? 'border-present'
                    : status === 'ABSENT' || status === 'EXCUSED'
                      ? 'border-absent'
                      : status === 'LATE'
                        ? 'border-late'
                        : 'border-unmarked';
                  return (
                    <li
                      key={lesson.id}
                      className={`student-attendance-history-modal__item ${borderClass}`}
                    >
                      <div className="student-attendance-history-modal__item-main">
                        <div className="student-attendance-history-modal__item-header">
                          <span className="student-attendance-history-modal__item-datetime">
                            <Calendar size={14} aria-hidden />
                            {lessonDateTime(item.lesson, locale as Locale)}
                          </span>
                          <span className={`student-attendance-history-modal__status status-${(status ?? 'unmarked').toLowerCase()}`}>
                            {t(getAttendanceStatusLabelKey(status ?? ''))}
                          </span>
                        </div>
                        {lesson.topic && (
                          <p className="student-attendance-history-modal__item-topic">{lesson.topic}</p>
                        )}
                        <div className="student-attendance-history-modal__item-actions">
                          <Link
                            to={`${TEACHER_LESSON_PATH}/${lesson.id}`}
                            className="student-attendance-history-modal__link"
                            onClick={onClose}
                          >
                            <ExternalLink size={14} aria-hidden />
                            {t('attendanceHistoryLinkToLesson')}
                          </Link>
                          {hasNotices && (
                            <button
                              type="button"
                              className="student-attendance-history-modal__toggle"
                              onClick={() => toggleLesson(lesson.id)}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <ChevronDown size={16} aria-hidden />
                              ) : (
                                <ChevronRight size={16} aria-hidden />
                              )}
                              {t('attendanceHistoryNoticesCount', { count: absenceNotices.length })}
                            </button>
                          )}
                        </div>
                      </div>
                      {hasNotices && isExpanded && (
                        <div className="student-attendance-history-modal__notices">
                          {absenceNotices.map((notice) => (
                            <NoticeCard key={notice.id} notice={notice} locale={locale as Locale} />
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

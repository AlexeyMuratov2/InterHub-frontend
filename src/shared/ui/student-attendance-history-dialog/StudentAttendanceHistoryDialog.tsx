/**
 * Dialog with full attendance history for a student in an offering.
 * Design follows entity-detail (ed-*) style: hero, lesson cards with present=green, absent=red, late=yellow.
 * Reusable on student subject page and teacher dashboard via lessonLinkBasePath.
 */
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
import {
  UserCheck,
  Calendar,
  FileText,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export interface StudentAttendanceHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  offeringId: string;
  /** Dialog title: e.g. subject name for student, or student name for teacher */
  title: string;
  /** Base path for lesson links: student = /dashboards/student/lessons, teacher = /dashboards/teacher/lessons */
  lessonLinkBasePath?: string;
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

function getAttendanceVariant(
  status: string | null
): 'present' | 'absent' | 'late' | 'unmarked' {
  if (status === 'PRESENT') return 'present';
  if (status === 'ABSENT' || status === 'EXCUSED') return 'absent';
  if (status === 'LATE') return 'late';
  return 'unmarked';
}

function lessonDateTime(
  lesson: StudentAttendanceHistoryLessonItemDto['lesson'],
  locale: Locale
): string {
  try {
    const dateStr = formatDate(lesson.date + 'T00:00:00', locale);
    const start = lesson.startTime ? lesson.startTime.slice(0, 5) : '';
    return start ? `${dateStr}, ${start}` : dateStr;
  } catch {
    return lesson.date;
  }
}

function NoticeCard({
  notice,
  locale,
}: {
  notice: StudentNoticeDto;
  locale: Locale;
}) {
  const { t } = useTranslation('dashboard');
  return (
    <div className="ed-attendance-dialog__notice">
      <div className="ed-attendance-dialog__notice-header">
        <FileText size={14} aria-hidden />
        <span className="ed-attendance-dialog__notice-type">
          {notice.type === 'LATE'
            ? t('absenceRequestsNoticeTypeLate')
            : t('absenceRequestsNoticeTypeAbsent')}
        </span>
        <span
          className={`ed-attendance-dialog__notice-status ed-attendance-dialog__notice-status--${(notice.status || '').toLowerCase()}`}
        >
          {t(getNoticeStatusLabelKey(notice.status))}
        </span>
      </div>
      {notice.reasonText && (
        <p className="ed-attendance-dialog__notice-reason">{notice.reasonText}</p>
      )}
      <div className="ed-attendance-dialog__notice-meta">
        <span>
          {t('attendanceHistoryNoticeSubmittedAt')}:{' '}
          {formatDateTime(notice.submittedAt, locale)}
        </span>
        {notice.fileIds?.length > 0 && (
          <span>
            {t('attendanceHistoryAttachments')}: {notice.fileIds.length}
          </span>
        )}
      </div>
    </div>
  );
}

export function StudentAttendanceHistoryDialog({
  open,
  onClose,
  studentId,
  offeringId,
  title,
  lessonLinkBasePath = '/dashboards/student/lessons',
}: StudentAttendanceHistoryDialogProps) {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [data, setData] = useState<StudentAttendanceHistoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLessonIds, setExpandedLessonIds] = useState<Set<string>>(
    new Set()
  );

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
          setError(
            res.error.message ?? tRef.current('attendanceHistoryLoadError')
          );
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
      title={title}
      variant="default"
      modalClassName="ed-attendance-dialog"
    >
      <div className="ed-attendance-dialog__body">
        {error && (
          <Alert variant="error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        {loading && (
          <p className="ed-empty" style={{ margin: 0 }}>
            {t('loading')}
          </p>
        )}
        {!loading && !error && data && (
          <>
            <div className="ed-attendance-dialog__hero">
              <div className="ed-attendance-dialog__hero-icon">
                <UserCheck size={24} aria-hidden />
              </div>
              <div className="ed-attendance-dialog__hero-text">
                <span className="ed-attendance-dialog__hero-subject">
                  {data.subjectName}
                </span>
                <span className="ed-attendance-dialog__hero-meta">
                  {t('attendanceHistoryMissedCount', {
                    count: data.missedCount,
                  })}
                  {' · '}
                  {t('attendanceHistoryNoticesCount', {
                    count: data.absenceNoticesSubmittedCount,
                  })}
                </span>
              </div>
            </div>

            {!data.lessons?.length ? (
              <p className="ed-empty">{t('attendanceHistoryNoLessons')}</p>
            ) : (
              <ol className="ed-attendance-dialog__list">
                {data.lessons.map((item) => {
                  const { lesson, attendance, absenceNotices } = item;
                  const status = attendance?.status ?? null;
                  const variant = getAttendanceVariant(status);
                  const hasNotices = absenceNotices?.length > 0;
                  const isExpanded = expandedLessonIds.has(lesson.id);

                  return (
                    <li
                      key={lesson.id}
                      className={`ed-attendance-dialog__card ed-attendance-dialog__card--${variant}`}
                    >
                      <div className="ed-attendance-dialog__card-main">
                        <div className="ed-attendance-dialog__card-header">
                          <span className="ed-attendance-dialog__card-datetime">
                            <Calendar size={16} aria-hidden />
                            {lessonDateTime(lesson, locale as Locale)}
                          </span>
                          <span
                            className={`ed-attendance-dialog__badge ed-attendance-dialog__badge--${variant}`}
                          >
                            {t(getAttendanceStatusLabelKey(status ?? ''))}
                          </span>
                        </div>
                        {lesson.topic && (
                          <p className="ed-attendance-dialog__card-topic">
                            {lesson.topic}
                          </p>
                        )}
                        <div className="ed-attendance-dialog__card-actions">
                          <Link
                            to={`${lessonLinkBasePath}/${lesson.id}`}
                            className="ed-attendance-dialog__link"
                            onClick={onClose}
                          >
                            <BookOpen size={16} aria-hidden />
                            {t('attendanceHistoryLinkToLesson')}
                          </Link>
                          {hasNotices && (
                            <button
                              type="button"
                              className="ed-attendance-dialog__toggle"
                              onClick={() => toggleLesson(lesson.id)}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <ChevronDown size={16} aria-hidden />
                              ) : (
                                <ChevronRight size={16} aria-hidden />
                              )}
                              {t('attendanceHistoryNoticesCount', {
                                count: absenceNotices.length,
                              })}
                            </button>
                          )}
                        </div>
                      </div>
                      {hasNotices && isExpanded && (
                        <div className="ed-attendance-dialog__notices">
                          {absenceNotices.map((notice) => (
                            <NoticeCard
                              key={notice.id}
                              notice={notice}
                              locale={locale as Locale}
                            />
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

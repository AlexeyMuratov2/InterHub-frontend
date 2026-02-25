/**
 * Dialog with full grade history for a student in an offering.
 * Design follows entity-detail (ed-*) style for use on student subject page and reusable on teacher dashboard.
 * Shows each grade with lesson/homework context, link to lesson, comment and grader. Reusable via lessonLinkBasePath.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, formatDate, formatDateTime } from '../../i18n';
import { getStudentGradeHistory } from '../../api';
import type { StudentGradeHistoryDto, StudentGradeHistoryItemDto } from '../../api';
import { Modal, Alert } from '..';
import { getDisplayName } from '../../lib';
import {
  Award,
  BookOpen,
  FileText,
  Calendar,
  User,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

export interface StudentGradeHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  offeringId: string;
  /** Dialog title: e.g. subject name for student, or student name for teacher */
  title: string;
  /** Base path for lesson links: student = /dashboards/student/lessons, teacher = /dashboards/teacher/lessons */
  lessonLinkBasePath?: string;
}

function sortEntriesChronological(
  entries: StudentGradeHistoryItemDto[]
): StudentGradeHistoryItemDto[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.gradeEntry.gradedAt).getTime() -
      new Date(b.gradeEntry.gradedAt).getTime()
  );
}

function graderDisplayName(item: StudentGradeHistoryItemDto): string {
  const u = item.gradedByUser;
  if (!u) return '—';
  return getDisplayName(
    u.firstName,
    u.lastName,
    u.email ?? ''
  );
}

function lessonForEntry(item: StudentGradeHistoryItemDto) {
  return item.lesson ?? item.lessonForHomework;
}

function lessonIdForLink(item: StudentGradeHistoryItemDto): string | null {
  const lesson = lessonForEntry(item);
  if (lesson) return lesson.id;
  if (item.homework?.lessonId) return item.homework.lessonId;
  return null;
}

function lessonDateForEntry(
  item: StudentGradeHistoryItemDto,
  formatDateFn: (date: string, locale: string) => string,
  locale: string
): string | null {
  const lesson = lessonForEntry(item);
  if (!lesson?.date) return null;
  try {
    return formatDateFn(lesson.date + 'T00:00:00', locale);
  } catch {
    return lesson.date;
  }
}

export function StudentGradeHistoryDialog({
  open,
  onClose,
  studentId,
  offeringId,
  title,
  lessonLinkBasePath = '/dashboards/student/lessons',
}: StudentGradeHistoryDialogProps) {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [data, setData] = useState<StudentGradeHistoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !studentId || !offeringId) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getStudentGradeHistory(studentId, offeringId)
      .then((res) => {
        if (res.error) {
          setError(res.error.message ?? tRef.current('gradeHistoryLoadError'));
          setData(null);
        } else {
          setData(res.data ?? null);
        }
      })
      .catch(() => {
        setError(tRef.current('gradeHistoryLoadError'));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [open, studentId, offeringId]);

  const sortedEntries = useMemo(() => {
    if (!data?.entries?.length) return [];
    return sortEntriesChronological(data.entries);
  }, [data?.entries]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      variant="default"
      modalClassName="ed-grade-dialog"
    >
      <div className="ed-grade-dialog__body">
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
            <div className="ed-grade-dialog__hero">
              <div className="ed-grade-dialog__hero-icon">
                <Award size={24} aria-hidden />
              </div>
              <div className="ed-grade-dialog__hero-text">
                <span className="ed-grade-dialog__hero-subject">{title}</span>
                <span className="ed-grade-dialog__hero-meta">
                  {t('gradeHistoryTotalPoints', { points: data.totalPoints })}
                </span>
              </div>
            </div>

            {sortedEntries.length === 0 ? (
              <p className="ed-empty">{t('gradeHistoryNoEntries')}</p>
            ) : (
              <ol className="ed-grade-dialog__list">
                {sortedEntries.map((item) => {
                  const entry = item.gradeEntry;
                  const lessonDate = lessonDateForEntry(
                    item,
                    formatDate,
                    locale
                  );
                  const linkLessonId = lessonIdForLink(item);
                  const isHomework = Boolean(item.homework);
                  const cardVariant = isHomework
                    ? 'ed-grade-dialog__card--homework'
                    : 'ed-grade-dialog__card--lesson';

                  return (
                    <li
                      key={entry.id}
                      className={`ed-grade-dialog__card ${cardVariant}`}
                    >
                      <div className="ed-grade-dialog__card-header">
                        <span className="ed-grade-dialog__points">
                          {entry.points} {t('homeworkHistoryPts')}
                        </span>
                        {entry.typeLabel && (
                          <span className="ed-grade-dialog__type">
                            {entry.typeLabel}
                          </span>
                        )}
                      </div>

                      <div className="ed-grade-dialog__source">
                        {isHomework ? (
                          <>
                            <FileText size={16} aria-hidden />
                            <span className="ed-grade-dialog__source-label">
                              {t('gradeHistoryForHomework')}
                            </span>
                            {item.homework?.title && (
                              <span className="ed-grade-dialog__homework-title">
                                — {item.homework.title}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <BookOpen size={16} aria-hidden />
                            <span className="ed-grade-dialog__source-label">
                              {t('gradeHistoryForLesson')}
                            </span>
                          </>
                        )}
                      </div>

                      {isHomework && item.homework && (
                        <div className="ed-grade-dialog__homework-info">
                          {item.homework.description && (
                            <p className="ed-grade-dialog__homework-desc">
                              {item.homework.description}
                            </p>
                          )}
                          {item.homework.points != null && (
                            <span className="ed-grade-dialog__homework-max">
                              {t('homeworkHistoryMaxPoints', {
                                points: item.homework.points,
                              })}
                            </span>
                          )}
                        </div>
                      )}

                      {lessonDate && (
                        <div className="ed-grade-dialog__meta-row">
                          <Calendar size={16} aria-hidden />
                          <span>
                            {t('gradeHistoryLessonDate')}: {lessonDate}
                          </span>
                        </div>
                      )}

                      {linkLessonId && (
                        <div className="ed-grade-dialog__link-row">
                          <Link
                            to={`${lessonLinkBasePath}/${linkLessonId}`}
                            className="ed-grade-dialog__link"
                            onClick={onClose}
                          >
                            <ExternalLink size={16} aria-hidden />
                            {t('gradeHistoryLinkToLesson')}
                          </Link>
                        </div>
                      )}

                      {entry.description && (
                        <div className="ed-grade-dialog__comment">
                          <MessageSquare size={16} aria-hidden />
                          <div className="ed-grade-dialog__comment-inner">
                            <span className="ed-grade-dialog__comment-label">
                              {t('gradeHistoryComment')}:
                            </span>
                            <p className="ed-grade-dialog__comment-text">
                              {entry.description}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="ed-grade-dialog__graded">
                        <User size={16} aria-hidden />
                        <span>
                          {t('gradeHistoryGradedBy')}: {graderDisplayName(item)}
                        </span>
                        <span className="ed-grade-dialog__graded-at">
                          {formatDateTime(entry.gradedAt, locale)}
                        </span>
                      </div>
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

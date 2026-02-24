import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, formatDate, formatDateTime } from '../../i18n';
import { getStudentGradeHistory } from '../../api';
import type { StudentGradeHistoryDto, StudentGradeHistoryItemDto } from '../../api';
import { Modal, Alert } from '..';
import { getDisplayName } from '../../lib';
import { Award, BookOpen, FileText, Calendar, User, MessageSquare, ExternalLink } from 'lucide-react';

const TEACHER_LESSON_PATH = '/dashboards/teacher/lessons';

export interface StudentGradeHistoryModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  offeringId: string;
  /** Student display name for the modal title */
  studentDisplayName: string;
}

/** Sort entries by gradedAt ascending (chronological: oldest first). */
function sortEntriesChronological(entries: StudentGradeHistoryItemDto[]): StudentGradeHistoryItemDto[] {
  return [...entries].sort(
    (a, b) => new Date(a.gradeEntry.gradedAt).getTime() - new Date(b.gradeEntry.gradedAt).getTime()
  );
}

function graderDisplayName(item: StudentGradeHistoryItemDto): string {
  const u = item.gradedByUser;
  if (!u) return '—';
  return getDisplayName(u.firstName, u.lastName, u.email ?? '');
}

export function StudentGradeHistoryModal({
  open,
  onClose,
  studentId,
  offeringId,
  studentDisplayName,
}: StudentGradeHistoryModalProps) {
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

  const lessonForEntry = (item: StudentGradeHistoryItemDto) =>
    item.lesson ?? item.lessonForHomework;

  const lessonIdForLink = (item: StudentGradeHistoryItemDto): string | null => {
    const lesson = lessonForEntry(item);
    if (lesson) return lesson.id;
    if (item.homework?.lessonId) return item.homework.lessonId;
    return null;
  };

  const lessonDateForEntry = (item: StudentGradeHistoryItemDto): string | null => {
    const lesson = lessonForEntry(item);
    if (!lesson?.date) return null;
    try {
      return formatDate(lesson.date + 'T00:00:00', locale);
    } catch {
      return lesson.date;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('gradeHistoryModalTitle', { name: studentDisplayName })}
      variant="default"
      modalClassName="student-grade-history-modal"
    >
      <div className="student-grade-history-modal__body">
        {error && (
          <Alert variant="error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        {loading && (
          <p className="student-grade-history-modal__loading">{t('loading')}</p>
        )}
        {!loading && !error && data && (
          <>
            <div className="student-grade-history-modal__summary">
              <Award size={20} aria-hidden />
              <span>{t('gradeHistoryTotalPoints', { points: data.totalPoints })}</span>
            </div>
            {sortedEntries.length === 0 ? (
              <p className="student-grade-history-modal__empty">{t('gradeHistoryNoEntries')}</p>
            ) : (
              <ol className="student-grade-history-modal__list">
                {sortedEntries.map((item) => {
                  const entry = item.gradeEntry;
                  const lessonDate = lessonDateForEntry(item);
                  const linkLessonId = lessonIdForLink(item);
                  const isHomework = Boolean(item.homework);
                  return (
                    <li key={entry.id} className="student-grade-history-modal__item">
                      <div className="student-grade-history-modal__item-header">
                        <span className="student-grade-history-modal__points">{entry.points} pts</span>
                        {entry.typeLabel && (
                          <span className="student-grade-history-modal__type">{entry.typeLabel}</span>
                        )}
                        <span className="student-grade-history-modal__source">
                          {isHomework ? (
                            <>
                              <FileText size={14} aria-hidden />
                              {t('gradeHistoryForHomework')}
                              {item.homework?.title && (
                                <span className="student-grade-history-modal__homework-title">
                                  — {item.homework.title}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <BookOpen size={14} aria-hidden />
                              {t('gradeHistoryForLesson')}
                            </>
                          )}
                        </span>
                      </div>
                      {lessonDate && (
                        <div className="student-grade-history-modal__meta">
                          <Calendar size={14} aria-hidden />
                          <span>{t('gradeHistoryLessonDate')}: {lessonDate}</span>
                        </div>
                      )}
                      {linkLessonId && (
                        <div className="student-grade-history-modal__link-wrap">
                          <Link
                            to={`${TEACHER_LESSON_PATH}/${linkLessonId}`}
                            className="student-grade-history-modal__link"
                            onClick={onClose}
                          >
                            <ExternalLink size={14} aria-hidden />
                            {t('gradeHistoryLinkToLesson')}
                          </Link>
                        </div>
                      )}
                      {entry.description && (
                        <div className="student-grade-history-modal__comment">
                          <MessageSquare size={14} aria-hidden />
                          <span className="student-grade-history-modal__comment-label">
                            {t('gradeHistoryComment')}:
                          </span>
                          <p className="student-grade-history-modal__comment-text">
                            {entry.description}
                          </p>
                        </div>
                      )}
                      <div className="student-grade-history-modal__graded">
                        <User size={14} aria-hidden />
                        <span>{t('gradeHistoryGradedBy')}: {graderDisplayName(item)}</span>
                        <span className="student-grade-history-modal__graded-at">
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

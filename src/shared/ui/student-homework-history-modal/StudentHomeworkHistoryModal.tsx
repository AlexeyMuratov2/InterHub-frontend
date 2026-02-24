import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, formatDate, formatDateTime } from '../../i18n';
import { getStudentHomeworkHistory } from '../../api';
import type {
  StudentHomeworkHistoryDto,
  StudentHomeworkHistoryItemDto,
} from '../../api';
import { Modal, Alert } from '..';
import { FileText, Calendar, ExternalLink, MessageSquare, Award, Upload, Paperclip } from 'lucide-react';

const TEACHER_LESSON_PATH = '/dashboards/teacher/lessons';

export interface StudentHomeworkHistoryModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  offeringId: string;
  /** Student display name for the modal title */
  studentDisplayName: string;
}

function lessonDateDisplay(lesson: StudentHomeworkHistoryItemDto['lesson'], locale: string): string {
  if (!lesson?.date) return '—';
  try {
    return formatDate(lesson.date + 'T00:00:00', locale);
  } catch {
    return lesson.date;
  }
}

export function StudentHomeworkHistoryModal({
  open,
  onClose,
  studentId,
  offeringId,
  studentDisplayName,
}: StudentHomeworkHistoryModalProps) {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [data, setData] = useState<StudentHomeworkHistoryDto | null>(null);
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
    getStudentHomeworkHistory(studentId, offeringId)
      .then((res) => {
        if (res.error) {
          setError(res.error.message ?? tRef.current('homeworkHistoryLoadError'));
          setData(null);
        } else {
          setData(res.data ?? null);
        }
      })
      .catch(() => {
        setError(tRef.current('homeworkHistoryLoadError'));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [open, studentId, offeringId]);

  const items = data?.items ?? [];
  const hasItems = items.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('homeworkHistoryModalTitle', { name: studentDisplayName })}
      variant="default"
      modalClassName="student-homework-history-modal"
    >
      <div className="student-homework-history-modal__body">
        {error && (
          <Alert variant="error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        {loading && (
          <p className="student-homework-history-modal__loading">{t('loading')}</p>
        )}
        {!loading && !error && data && (
          <>
            <div className="student-homework-history-modal__summary">
              <FileText size={20} aria-hidden />
              <span>{t('homeworkHistorySubject')}: {data.subjectName}</span>
            </div>
            {!hasItems ? (
              <p className="student-homework-history-modal__empty">{t('homeworkHistoryNoHomework')}</p>
            ) : (
              <ol className="student-homework-history-modal__list">
                {items.map((item) => {
                  const lessonId = item.lesson?.id ?? item.homework.lessonId;
                  const lessonDate = lessonDateDisplay(item.lesson, locale);
                  const hasSubmission = Boolean(item.submission);
                  const hasGrade = Boolean(item.gradeEntry);
                  const gradeEntry = item.gradeEntry;
                  const submissionFiles = item.submissionFiles ?? [];

                  return (
                    <li key={item.homework.id} className="student-homework-history-modal__item">
                      <div className="student-homework-history-modal__item-header">
                        <h4 className="student-homework-history-modal__homework-title">
                          {item.homework.title || t('homeworkHistoryUntitled')}
                        </h4>
                        {item.homework.points != null && (
                          <span className="student-homework-history-modal__max-points">
                            {t('homeworkHistoryMaxPoints', { points: item.homework.points })}
                          </span>
                        )}
                      </div>

                      {item.homework.description && (
                        <p className="student-homework-history-modal__description">
                          {item.homework.description}
                        </p>
                      )}

                      <div className="student-homework-history-modal__meta">
                        <Calendar size={14} aria-hidden />
                        <span>{t('homeworkHistoryLessonDate')}: {lessonDate}</span>
                      </div>

                      {lessonId && (
                        <div className="student-homework-history-modal__link-wrap">
                          <Link
                            to={`${TEACHER_LESSON_PATH}/${lessonId}`}
                            className="student-homework-history-modal__link"
                            onClick={onClose}
                          >
                            <ExternalLink size={14} aria-hidden />
                            {t('homeworkHistoryLinkToLesson')}
                          </Link>
                        </div>
                      )}

                      <div className="student-homework-history-modal__submission">
                        <Upload size={14} aria-hidden />
                        {hasSubmission ? (
                          <span>
                            {t('homeworkHistorySubmittedAt')}:{' '}
                            {formatDateTime(item.submission!.submittedAt, locale)}
                          </span>
                        ) : (
                          <span className="student-homework-history-modal__not-submitted">
                            {t('homeworkHistoryNotSubmitted')}
                          </span>
                        )}
                      </div>

                      {hasGrade && gradeEntry && (
                        <div className="student-homework-history-modal__grade">
                          <Award size={14} aria-hidden />
                          <span className="student-homework-history-modal__grade-points">
                            {gradeEntry.points} {t('homeworkHistoryPts')}
                          </span>
                          {gradeEntry.typeLabel && (
                            <span className="student-homework-history-modal__grade-type">
                              {gradeEntry.typeLabel}
                            </span>
                          )}
                          <span className="student-homework-history-modal__graded-at">
                            {formatDateTime(gradeEntry.gradedAt, locale)}
                          </span>
                        </div>
                      )}

                      {hasGrade && gradeEntry?.description && (
                        <div className="student-homework-history-modal__comment">
                          <MessageSquare size={14} aria-hidden />
                          <span className="student-homework-history-modal__comment-label">
                            {t('homeworkHistoryComment')}:
                          </span>
                          <p className="student-homework-history-modal__comment-text">
                            {gradeEntry.description}
                          </p>
                        </div>
                      )}

                      {submissionFiles.length > 0 && (
                        <div className="student-homework-history-modal__files">
                          <Paperclip size={14} aria-hidden />
                          <span className="student-homework-history-modal__files-label">
                            {t('homeworkHistoryAttachments')}:
                          </span>
                          <ul className="student-homework-history-modal__files-list">
                            {submissionFiles.map((f) => (
                              <li key={f.id}>
                                {f.originalName ?? f.id}
                              </li>
                            ))}
                          </ul>
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

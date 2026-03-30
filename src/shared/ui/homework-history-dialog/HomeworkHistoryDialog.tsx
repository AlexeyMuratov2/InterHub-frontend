/**
 * Dialog with full homework history for a student in an offering.
 * Design follows entity-detail (ed-*) style for use on student subject page and reusable on teacher dashboard.
 * Submitted = green accent, not submitted = red accent. Shows teacher comment and link to lesson.
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, formatDate, formatDateTime, type Locale } from '../../i18n';
import { getStudentHomeworkHistory } from '../../api';
import type {
  StudentHomeworkHistoryDto,
  StudentHomeworkHistoryItemDto,
} from '../../api';
import { Modal, Alert } from '..';
import {
  FileText,
  Calendar,
  MessageSquare,
  Award,
  Upload,
  Paperclip,
  BookOpen,
} from 'lucide-react';

export interface HomeworkHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  offeringId: string;
  /** Modal title: e.g. subject name for student, or student name for teacher */
  title: string;
  /** Base path for lesson links: student = /dashboards/student/lessons, teacher = /dashboards/teacher/lessons */
  lessonLinkBasePath?: string;
}

function lessonDateDisplay(lesson: StudentHomeworkHistoryItemDto['lesson'], locale: Locale): string {
  if (!lesson?.date) return '—';
  try {
    return formatDate(lesson.date + 'T00:00:00', locale);
  } catch {
    return lesson.date;
  }
}

export function HomeworkHistoryDialog({
  open,
  onClose,
  studentId,
  offeringId,
  title,
  lessonLinkBasePath = '/dashboards/student/lessons',
}: HomeworkHistoryDialogProps) {
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
      title={title}
      variant="default"
      modalClassName="ed-hw-dialog"
    >
      <div className="ed-hw-dialog__body">
        {error && (
          <Alert variant="error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        {loading && (
          <p className="ed-empty" style={{ margin: 0 }}>{t('loading')}</p>
        )}
        {!loading && !error && data && (
          <>
            <div className="ed-hw-dialog__hero">
              <div className="ed-hw-dialog__hero-icon">
                <FileText size={24} aria-hidden />
              </div>
              <div className="ed-hw-dialog__hero-text">
                <span className="ed-hw-dialog__hero-subject">{data.subjectName}</span>
                <span className="ed-hw-dialog__hero-meta">
                  {t('homeworkHistorySubject')} · {items.length} {items.length === 1 ? t('homeworkHistoryOneAssignment') : t('homeworkHistoryAssignmentsCount', { count: items.length })}
                </span>
              </div>
            </div>

            {!hasItems ? (
              <p className="ed-empty">{t('homeworkHistoryNoHomework')}</p>
            ) : (
              <ol className="ed-hw-dialog__list">
                {items.map((item) => {
                  const lessonId = item.lesson?.id ?? item.homework.lessonId;
                  const lessonDate = lessonDateDisplay(item.lesson, locale);
                  const hasSubmission = Boolean(item.submission);
                  const hasGrade = Boolean(item.gradeEntry);
                  const gradeEntry = item.gradeEntry;
                  const submissionFiles = item.submissionFiles ?? [];
                  const statusClass = hasSubmission ? 'ed-hw-dialog__card--submitted' : 'ed-hw-dialog__card--not-submitted';

                  return (
                    <li key={item.homework.id} className={`ed-hw-dialog__card ${statusClass}`}>
                      <div className="ed-hw-dialog__card-header">
                        <h4 className="ed-hw-dialog__card-title">
                          {item.homework.title || t('homeworkHistoryUntitled')}
                        </h4>
                        {item.homework.points != null && (
                          <span className="ed-hw-dialog__max-points">
                            {t('homeworkHistoryMaxPoints', { points: item.homework.points })}
                          </span>
                        )}
                      </div>

                      {item.homework.description && (
                        <p className="ed-hw-dialog__description">{item.homework.description}</p>
                      )}

                      <div className="ed-hw-dialog__meta-row">
                        <Calendar size={16} aria-hidden />
                        <span>{t('homeworkHistoryLessonDate')}: {lessonDate}</span>
                      </div>

                      {lessonId && (
                        <div className="ed-hw-dialog__link-row">
                          <Link
                            to={`${lessonLinkBasePath}/${lessonId}`}
                            className="ed-hw-dialog__link"
                            onClick={onClose}
                          >
                            <BookOpen size={16} aria-hidden />
                            {t('homeworkHistoryLinkToLesson')}
                          </Link>
                        </div>
                      )}

                      <div className={`ed-hw-dialog__status ${hasSubmission ? 'ed-hw-dialog__status--ok' : 'ed-hw-dialog__status--missing'}`}>
                        <Upload size={16} aria-hidden />
                        {hasSubmission ? (
                          <span>
                            {t('homeworkHistorySubmittedAt')}: {formatDateTime(item.submission!.submittedAt, locale)}
                          </span>
                        ) : (
                          <span>{t('homeworkHistoryNotSubmitted')}</span>
                        )}
                      </div>

                      {hasGrade && gradeEntry && (
                        <div className="ed-hw-dialog__grade">
                          <Award size={16} aria-hidden />
                          <span className="ed-hw-dialog__grade-points">
                            {gradeEntry.points} {t('homeworkHistoryPts')}
                          </span>
                          {gradeEntry.typeLabel && (
                            <span className="ed-hw-dialog__grade-type">{gradeEntry.typeLabel}</span>
                          )}
                          <span className="ed-hw-dialog__graded-at">
                            {formatDateTime(gradeEntry.gradedAt, locale)}
                          </span>
                        </div>
                      )}

                      {hasGrade && gradeEntry?.description && (
                        <div className="ed-hw-dialog__comment">
                          <MessageSquare size={16} aria-hidden />
                          <div className="ed-hw-dialog__comment-inner">
                            <span className="ed-hw-dialog__comment-label">{t('homeworkHistoryComment')}:</span>
                            <p className="ed-hw-dialog__comment-text">{gradeEntry.description}</p>
                          </div>
                        </div>
                      )}

                      {submissionFiles.length > 0 && (
                        <div className="ed-hw-dialog__files">
                          <Paperclip size={16} aria-hidden />
                          <div className="ed-hw-dialog__files-inner">
                            <span className="ed-hw-dialog__files-label">{t('homeworkHistoryAttachments')}:</span>
                            <ul className="ed-hw-dialog__files-list">
                              {submissionFiles.map((f) => (
                                <li key={f.id}>{f.originalName ?? f.id}</li>
                              ))}
                            </ul>
                          </div>
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

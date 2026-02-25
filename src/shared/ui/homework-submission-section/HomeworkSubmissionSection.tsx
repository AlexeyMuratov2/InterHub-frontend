/**
 * Секция отправки решений по домашним заданиям урока.
 * Стиль entity-detail (ed-submission-*), переиспользуемый на дашборде студента и преподавателя.
 */
import { useState, useCallback } from 'react';
import { Upload, Send, Trash2, FileText } from 'lucide-react';
import { useTranslation, formatDateTime } from '../../i18n';
import type { Locale } from '../../i18n';
import {
  createSubmission,
  deleteSubmission,
  uploadFile,
} from '../../api';
import type {
  CompositionHomeworkDto,
  HomeworkSubmissionDto,
  StoredFileDto,
} from '../../api/types';
import { SectionCard } from '../section-card';
import { FileUploadArea } from '../file-upload-area/FileUploadArea';
import type { FileUploadItem } from '../file-upload-area/FileUploadArea';
import { ConfirmModal } from '../ConfirmModal';
import { formatFileSize } from '../../lib/fileUtils';

export type SubmissionWithFiles = {
  submission: HomeworkSubmissionDto;
  files: StoredFileDto[];
};

export interface HomeworkSubmissionSectionProps {
  /** Домашние задания урока (отображаем форму/карточку по каждому). */
  homeworks: CompositionHomeworkDto[];
  /** По homeworkId — текущая отправка студента и метаданные файлов (из homework history). */
  submissionByHomeworkId: Record<string, SubmissionWithFiles>;
  /** Вызов после успешной отправки или удаления для перезагрузки данных. */
  onRefresh: () => void;
  /** Скачать файл по ID (открыть URL). */
  onDownloadFile: (fileId: string) => void;
  /** Локаль для форматирования дат. */
  locale: Locale;
}

export function HomeworkSubmissionSection({
  homeworks,
  submissionByHomeworkId,
  onRefresh,
  onDownloadFile,
  locale,
}: HomeworkSubmissionSectionProps) {
  const { t } = useTranslation('dashboard');

  if (homeworks.length === 0) return null;

  return (
    <SectionCard
      icon={<Upload size={18} />}
      title={t('lessonDetailsSubmitSolutionSection')}
      className="ed-submission-section"
    >
      <div className="ed-submission-list">
        {homeworks.map((hw) => (
          <HomeworkSubmissionCard
            key={hw.id}
            homework={hw}
            submissionWithFiles={submissionByHomeworkId[hw.id]}
            onRefresh={onRefresh}
            onDownloadFile={onDownloadFile}
            locale={locale}
            t={t}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function HomeworkSubmissionCard({
  homework,
  submissionWithFiles,
  onRefresh,
  onDownloadFile,
  locale,
  t,
}: {
  homework: CompositionHomeworkDto;
  submissionWithFiles?: SubmissionWithFiles | null;
  onRefresh: () => void;
  onDownloadFile: (fileId: string) => void;
  locale: Locale;
  t: (key: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [fileItems, setFileItems] = useState<FileUploadItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasSubmission = Boolean(submissionWithFiles?.submission);
  const showForm = !hasSubmission || editing;

  const handleAddFiles = useCallback((files: File[]) => {
    setFileItems((prev) => [
      ...prev,
      ...files.map((file) => ({ file, uploading: false as const })),
    ]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFileItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    const ids: string[] = [];
    const desc = description.trim() || null;

    try {
      for (const item of fileItems) {
        if (item.uploaded?.id) {
          ids.push(item.uploaded.id);
          continue;
        }
        const res = await uploadFile(item.file);
        if (res.error || !res.data?.id) {
          setError(res.error?.message ?? t('lessonDetailsSubmissionErrorCreate'));
          setSubmitting(false);
          return;
        }
        ids.push(res.data.id);
      }

      const res = await createSubmission(homework.id, {
        description: desc,
        storedFileIds: ids,
      });
      if (res.error) {
        setError(res.error.message ?? t('lessonDetailsSubmissionErrorCreate'));
        setSubmitting(false);
        return;
      }
      setEditing(false);
      setDescription('');
      setFileItems([]);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('lessonDetailsSubmissionErrorCreate'));
    }
    setSubmitting(false);
  }, [homework.id, description, fileItems, onRefresh, t]);

  const handleDelete = useCallback(async () => {
    if (!submissionWithFiles?.submission) return;
    setDeleting(true);
    setError(null);
    const res = await deleteSubmission(submissionWithFiles.submission.id);
    setDeleteConfirm(false);
    if (res.error) {
      setError(res.error.message ?? t('lessonDetailsSubmissionErrorDelete'));
    } else {
      onRefresh();
    }
    setDeleting(false);
  }, [submissionWithFiles, onRefresh, t]);

  const startReplace = useCallback(() => {
    setDescription(submissionWithFiles?.submission?.description ?? '');
    setFileItems([]);
    setEditing(true);
    setError(null);
  }, [submissionWithFiles?.submission?.description]);

  const cancelReplace = useCallback(() => {
    setEditing(false);
    setDescription('');
    setFileItems([]);
    setError(null);
  }, []);

  const displayTitle = homework.title?.trim() || t('homeworkUntitled');

  return (
    <div
      className={
        hasSubmission && !showForm
          ? 'ed-submission-card ed-submission-card--submitted'
          : 'ed-submission-card'
      }
    >
      <div className="ed-submission-card__header">
        <h3 className="ed-submission-card__title">{displayTitle}</h3>
        {homework.points != null && (
          <span className="ed-submission-card__points">
            {String(homework.points)} {t('homeworkHistoryPts')}
          </span>
        )}
      </div>

      {error && (
        <div className="ed-submission-card__error" role="alert">
          {error}
        </div>
      )}

      {showForm ? (
        <div className="ed-submission-form">
          <div className="ed-submission-form__field">
            <label className="ed-submission-form__label" htmlFor={`submission-desc-${homework.id}`}>
              {t('lessonDetailsSubmissionDescription')}
            </label>
            <textarea
              id={`submission-desc-${homework.id}`}
              className="ed-submission-form__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('lessonDetailsSubmissionDescriptionPlaceholder')}
              rows={3}
              maxLength={5000}
              disabled={submitting}
            />
          </div>
          <div className="ed-submission-form__field">
            <FileUploadArea
              items={fileItems}
              onAdd={handleAddFiles}
              onRemove={handleRemoveFile}
              multiple
              label={t('lessonDetailsSubmissionFiles')}
              dropZoneText={t('homeworkClickToUpload')}
              buttonText={t('homeworkUploadFile')}
              inputId={`submission-files-${homework.id}`}
              uploadingText={t('lessonDetailsSubmissionSubmitting')}
            />
          </div>
          <div className="ed-submission-form__actions">
            {editing && (
              <button
                type="button"
                className="ed-submission-form__btn ed-submission-form__btn--secondary"
                onClick={cancelReplace}
                disabled={submitting}
              >
                {t('cancel')}
              </button>
            )}
            <button
              type="button"
              className="ed-submission-form__btn ed-submission-form__btn--primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="ed-submission-form__spinner" aria-hidden />
                  {t('lessonDetailsSubmissionSubmitting')}
                </>
              ) : (
                <>
                  <Send size={16} aria-hidden />
                  {hasSubmission && editing
                    ? t('lessonDetailsSubmissionReplaceSolution')
                    : t('lessonDetailsSubmissionSubmit')}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="ed-submission-view">
          <div className="ed-submission-view__meta">
            <span className="ed-submission-view__label">{t('lessonDetailsSubmissionYourSolution')}</span>
            <span className="ed-submission-view__date">
              {t('lessonDetailsSubmissionSubmittedAt')}: {formatDateTime(submissionWithFiles!.submission.submittedAt, locale)}
            </span>
          </div>
          {submissionWithFiles!.submission.description?.trim() && (
            <p className="ed-submission-view__description">
              {submissionWithFiles!.submission.description.trim()}
            </p>
          )}
          {submissionWithFiles!.files && submissionWithFiles!.files.length > 0 && (
            <div className="ed-submission-view__files">
              <span className="ed-submission-view__files-label">{t('lessonDetailsSubmissionFiles')}</span>
              <ul className="ed-submission-view__files-list">
                {submissionWithFiles!.files.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="ed-submission-view__file-link"
                      onClick={() => onDownloadFile(f.id)}
                    >
                      <FileText size={14} aria-hidden />
                      {f.originalName?.trim() || t('homeworkFile')}
                      {f.size != null && (
                        <span className="ed-submission-view__file-size"> ({formatFileSize(f.size)})</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="ed-submission-view__actions">
            <button
              type="button"
              className="ed-submission-form__btn ed-submission-form__btn--secondary"
              onClick={startReplace}
            >
              {t('lessonDetailsSubmissionReplace')}
            </button>
            <button
              type="button"
              className="ed-submission-form__btn ed-submission-form__btn--danger"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 size={14} aria-hidden />
              {t('lessonDetailsSubmissionDelete')}
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          open={deleteConfirm}
          title={t('lessonDetailsSubmissionDelete')}
          message={t('lessonDetailsSubmissionDeleteConfirm')}
          cancelLabel={t('cancel')}
          confirmLabel={t('lessonDetailsSubmissionDelete')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
          confirmDisabled={deleting}
          confirmVariant="danger"
        />
      )}
    </div>
  );
}

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from '../../i18n';
import { parseFieldErrors } from '../../lib/parseFieldErrors';
import { normalizeDocumentAttachments } from '../../lib/documentAttachment';
import { Modal } from '../Modal';
import { FormActions } from '../FormActions';
import { FormGroup } from '../FormGroup';
import { Alert } from '../Alert';
import { FileUploadArea } from '../file-upload-area/FileUploadArea';
import { AttachmentStatusList } from '../attachment-status-list';
import { createHomework, updateHomework, downloadDocumentAttachment } from '../../api';
import type { DocumentAttachmentDto, HomeworkDto, UpdateHomeworkRequest } from '../../api/types';
import '../lesson-modal/lesson-modal.css';

export interface HomeworkModalProps {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  homework?: HomeworkDto | null;
  onSaved: () => void;
}

export function HomeworkModal({
  open,
  onClose,
  lessonId,
  homework,
  onSaved,
}: HomeworkModalProps) {
  const { t } = useTranslation('dashboard');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removedExistingIds, setRemovedExistingIds] = useState<Set<string>>(new Set());

  const isEditMode = !!homework;
  const existingAttachments = useMemo(() => normalizeDocumentAttachments(homework), [homework]);
  const keptExistingAttachments = useMemo(
    () => existingAttachments.filter((attachment) => !removedExistingIds.has(attachment.id)),
    [existingAttachments, removedExistingIds]
  );
  const text = useCallback(
    (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    },
    [t]
  );

  const resetForm = useCallback(() => {
    setTitle(homework?.title ?? '');
    setDescription(homework?.description ?? '');
    setPoints(homework?.points?.toString() ?? '');
    setPendingFiles([]);
    setRemovedExistingIds(new Set());
    setFormError(null);
    setFieldErrors({});
  }, [homework]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleFilesAdd = useCallback((files: File[]) => {
    setPendingFiles((current) => [...current, ...files]);
  }, []);

  const handleRemoveNewFile = useCallback((index: number) => {
    setPendingFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }, []);

  const handleRemoveExisting = useCallback((attachment: DocumentAttachmentDto) => {
    setRemovedExistingIds((current) => {
      const next = new Set(current);
      next.add(attachment.id);
      return next;
    });
  }, []);

  const handleDownloadAttachment = useCallback(
    async (attachment: DocumentAttachmentDto) => {
      const result = await downloadDocumentAttachment(attachment.id);
      if (result.error) {
        alert(result.error.message ?? t('teacherSubjectMaterialDownloadError'));
      }
    },
    [t]
  );

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setFieldErrors({ title: t('homeworkTitleRequired') });
      return;
    }
    if (trimmedTitle.length > 500) {
      setFieldErrors({ title: t('homeworkTitleTooLong') });
      return;
    }
    if (trimmedDescription.length > 5000) {
      setFieldErrors({ description: t('homeworkDescriptionTooLong') });
      return;
    }

    const parsedPoints = points.trim() ? Number(points.trim()) : null;
    if (parsedPoints !== null && (Number.isNaN(parsedPoints) || parsedPoints < 0)) {
      setFieldErrors({ points: t('homeworkPointsInvalid') });
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSaving(true);

    try {
      if (isEditMode && homework) {
        const payload: UpdateHomeworkRequest = {};
        if (trimmedTitle !== homework.title) payload.title = trimmedTitle;
        if (trimmedDescription !== (homework.description ?? '')) payload.description = trimmedDescription || null;
        if (parsedPoints !== homework.points) payload.points = parsedPoints;
        payload.clearAttachments = false;
        payload.retainAttachmentIds = keptExistingAttachments.map((attachment) => attachment.id);

        const result = await updateHomework(homework.id, payload, pendingFiles);
        if (result.error) {
          if (result.status === 403) {
            setFormError(t('homeworkPermissionDenied'));
          } else if (result.status === 404) {
            setFormError(t('homeworkNotFound'));
          } else {
            const err = result.error as { details?: Record<string, string> };
            if (err?.details && typeof err.details === 'object') {
              setFieldErrors(parseFieldErrors(err.details));
            }
            setFormError(result.error.message ?? t('homeworkSaveError'));
          }
          return;
        }
      } else {
        const result = await createHomework(
          lessonId,
          {
            title: trimmedTitle,
            description: trimmedDescription || null,
            points: parsedPoints,
          },
          pendingFiles
        );
        if (result.error) {
          if (result.status === 403) {
            setFormError(t('homeworkCreatePermissionDenied'));
          } else if (result.status === 404) {
            setFormError(t('homeworkLessonNotFound'));
          } else {
            const err = result.error as { details?: Record<string, string> };
            if (err?.details && typeof err.details === 'object') {
              setFieldErrors(parseFieldErrors(err.details));
            }
            setFormError(result.error.message ?? t('homeworkSaveError'));
          }
          return;
        }
      }

      onSaved();
      handleClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('homeworkSaveError'));
    } finally {
      setSaving(false);
    }
  }, [
    title,
    description,
    points,
    isEditMode,
    homework,
    removedExistingIds,
    keptExistingAttachments,
    lessonId,
    pendingFiles,
    t,
    onSaved,
    handleClose,
  ]);

  const modalTitle = isEditMode ? t('homeworkEditTitle') : t('homeworkCreateTitle');

  return (
    <Modal open={open} onClose={handleClose} title={modalTitle} variant="form">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        {formError && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error" role="alert">
              {formError}
            </Alert>
          </div>
        )}

        <div
          style={{
            marginBottom: '1rem',
            padding: '0.9rem 1rem',
            borderRadius: '16px',
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.05) 0%, rgba(37, 99, 235, 0.08) 100%)',
            color: '#334155',
            fontSize: '0.9rem',
            lineHeight: 1.5,
          }}
        >
          {text(
            'attachmentAsyncHint',
            'Files are uploaded together with the form and then processed in the background. They become available for download as soon as the safety checks finish.'
          )}
        </div>

        <FormGroup
          label={t('homeworkTitle')}
          htmlFor="homework-title"
          required
          error={fieldErrors.title}
        >
          <input
            id="homework-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={saving}
            placeholder={t('homeworkTitlePlaceholder')}
            maxLength={500}
          />
        </FormGroup>

        <FormGroup
          label={t('homeworkDescription')}
          htmlFor="homework-description"
          error={fieldErrors.description}
        >
          <textarea
            id="homework-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={saving}
            placeholder={t('homeworkDescriptionPlaceholder')}
            rows={4}
            maxLength={5000}
          />
        </FormGroup>

        <FormGroup
          label={t('homeworkPoints')}
          htmlFor="homework-points"
          error={fieldErrors.points}
          hint={t('homeworkPointsHint')}
        >
          <input
            id="homework-points"
            type="number"
            min="0"
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            disabled={saving}
            placeholder={t('homeworkPointsPlaceholder')}
          />
        </FormGroup>

        {isEditMode && (
          <FormGroup
            label={text('homeworkExistingAttachments', 'Existing attachments')}
            htmlFor="homework-existing-attachments"
          >
            <AttachmentStatusList
              attachments={keptExistingAttachments}
              onDownload={handleDownloadAttachment}
              onDelete={handleRemoveExisting}
              emptyText={text('homeworkNoAttachments', 'No attachments yet.')}
            />
          </FormGroup>
        )}

        <FormGroup label={t('homeworkFiles')} htmlFor="homework-files">
          <FileUploadArea
            items={pendingFiles.map((file) => ({ file }))}
            onAdd={handleFilesAdd}
            onRemove={handleRemoveNewFile}
            disabled={saving}
            multiple
            dropZoneText={t('homeworkClickToUpload')}
            buttonText={t('homeworkUploadFile')}
            inputId="homework-files"
            deleteTitle={t('remove')}
            uploadingText={t('uploading')}
          />
        </FormGroup>

        <FormActions
          submitLabel={saving ? t('saving') : isEditMode ? t('save') : t('create')}
          submitting={saving}
          cancelLabel={t('cancel')}
          onCancel={handleClose}
        />
      </form>
    </Modal>
  );
}

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
import {
  createLessonMaterial,
  addLessonMaterialAttachments,
  downloadDocumentAttachment,
} from '../../api';
import type { CompositionLessonMaterialDto, DocumentAttachmentDto } from '../../api/types';
import '../lesson-modal/lesson-modal.css';

export interface LessonMaterialModalProps {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  material?: CompositionLessonMaterialDto | null;
  onSaved: () => void;
}

export function LessonMaterialModal({
  open,
  onClose,
  lessonId,
  material,
  onSaved,
}: LessonMaterialModalProps) {
  const { t } = useTranslation('dashboard');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const isEditMode = !!material;
  const existingAttachments = useMemo(() => normalizeDocumentAttachments(material), [material]);

  const text = useCallback(
    (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    },
    [t]
  );

  const resetForm = useCallback(() => {
    setName(material?.name ?? '');
    setDescription(material?.description ?? '');
    const now = new Date();
    const fallbackDate = now.toISOString().slice(0, 16);
    setPublishedAt(material?.publishedAt ? material.publishedAt.slice(0, 16) : fallbackDate);
    setPendingFiles([]);
    setFormError(null);
    setFieldErrors({});
  }, [material]);

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

  const handleRemoveFile = useCallback((index: number) => {
    setPendingFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
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
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setFieldErrors({ name: t('lessonMaterialNameRequired') });
      return;
    }
    if (trimmedName.length > 500) {
      setFieldErrors({ name: t('lessonMaterialNameTooLong') });
      return;
    }
    if (trimmedDescription.length > 5000) {
      setFieldErrors({ description: t('lessonMaterialDescriptionTooLong') });
      return;
    }
    if (!publishedAt.trim()) {
      setFieldErrors({ publishedAt: t('lessonMaterialPublishedAtRequired') });
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSaving(true);

    try {
      if (isEditMode && material) {
        if (pendingFiles.length > 0) {
          const result = await addLessonMaterialAttachments(lessonId, material.id, pendingFiles);
          if (result.error) {
            if (result.status === 403) {
              setFormError(t('lessonMaterialPermissionDenied'));
            } else if (result.status === 404) {
              setFormError(t('lessonMaterialNotFound'));
            } else {
              setFormError(result.error.message ?? t('lessonMaterialSaveError'));
            }
            return;
          }
        }
      } else {
        const result = await createLessonMaterial(
          lessonId,
          {
            name: trimmedName,
            description: trimmedDescription || null,
            publishedAt: publishedAt.trim(),
          },
          pendingFiles
        );

        if (result.error) {
          if (result.status === 403) {
            setFormError(t('lessonMaterialCreatePermissionDenied'));
          } else if (result.status === 404) {
            setFormError(t('lessonMaterialLessonNotFound'));
          } else {
            const err = result.error as { details?: Record<string, string> };
            if (err?.details && typeof err.details === 'object') {
              setFieldErrors(parseFieldErrors(err.details));
            }
            setFormError(result.error.message ?? t('lessonMaterialSaveError'));
          }
          return;
        }
      }

      onSaved();
      handleClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('lessonMaterialSaveError'));
    } finally {
      setSaving(false);
    }
  }, [
    name,
    description,
    publishedAt,
    isEditMode,
    material,
    lessonId,
    pendingFiles,
    t,
    onSaved,
    handleClose,
  ]);

  const title = isEditMode ? t('lessonMaterialEditTitle') : t('lessonMaterialCreateTitle');

  return (
    <Modal open={open} onClose={handleClose} title={title} variant="form">
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
          label={t('lessonMaterialName')}
          htmlFor="material-name"
          required
          error={fieldErrors.name}
        >
          <input
            id="material-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={saving || isEditMode}
            placeholder={t('lessonMaterialNamePlaceholder')}
            maxLength={500}
          />
        </FormGroup>

        <FormGroup
          label={t('lessonMaterialDescription')}
          htmlFor="material-description"
          error={fieldErrors.description}
        >
          <textarea
            id="material-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={saving || isEditMode}
            placeholder={t('lessonMaterialDescriptionPlaceholder')}
            rows={4}
            maxLength={5000}
          />
        </FormGroup>

        <FormGroup
          label={t('lessonMaterialPublishedAt')}
          htmlFor="material-published-at"
          required
          error={fieldErrors.publishedAt}
        >
          <input
            id="material-published-at"
            type="datetime-local"
            value={publishedAt}
            onChange={(event) => setPublishedAt(event.target.value)}
            disabled={saving || isEditMode}
          />
        </FormGroup>

        {isEditMode && (
          <FormGroup label={t('lessonMaterialExistingFiles')} htmlFor="existing-files">
            <AttachmentStatusList
              attachments={existingAttachments}
              onDownload={handleDownloadAttachment}
              emptyText={text('lessonMaterialNoAttachments', 'No attachments yet.')}
            />
          </FormGroup>
        )}

        <FormGroup label={t('lessonMaterialFiles')} htmlFor="material-files">
          <FileUploadArea
            items={pendingFiles.map((file) => ({ file }))}
            onAdd={handleFilesAdd}
            onRemove={handleRemoveFile}
            disabled={saving}
            multiple
            dropZoneText={t('lessonMaterialClickToUpload')}
            buttonText={isEditMode ? t('lessonMaterialAddFiles') : t('lessonMaterialUploadFiles')}
            inputId="material-files"
            deleteTitle={t('delete')}
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

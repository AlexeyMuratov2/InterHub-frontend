/**
 * Модалка создания/редактирования домашнего задания.
 * Поддерживает загрузку нескольких файлов (как в контракте API: files — массив).
 */
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { parseFieldErrors } from '../../lib/parseFieldErrors';
import { formatFileSize } from '../../lib/fileUtils';
import { Modal } from '../Modal';
import { FormActions } from '../FormActions';
import { FormGroup } from '../FormGroup';
import { Alert } from '../Alert';
import { FileUploadArea } from '../file-upload-area/FileUploadArea';
import { uploadFile, getFileDownloadUrl } from '../../api/materials';
import { createHomework, updateHomework } from '../../api/homework';
import type { StoredFileDto, HomeworkDto } from '../../api/types';
import { X, Download } from 'lucide-react';
import '../lesson-modal/lesson-modal.css';

export interface HomeworkModalProps {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  homework?: HomeworkDto | null;
  onSaved: () => void;
}

interface UploadedFile {
  file: File;
  uploaded?: StoredFileDto;
  uploading?: boolean;
  error?: string;
}

/** Текущие файлы ДЗ: из ответа API (files или один file для совместимости). */
function getHomeworkFiles(homework: HomeworkDto | null | undefined): StoredFileDto[] {
  if (!homework) return [];
  if (homework.files && homework.files.length > 0) return homework.files;
  if (homework.file) return [homework.file];
  return [];
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
  const [points, setPoints] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  /** Id существующих файлов, которые пользователь снял (удалить при сохранении). */
  const [removedExistingIds, setRemovedExistingIds] = useState<Set<string>>(new Set());

  const isEditMode = !!homework;
  const existingFiles = getHomeworkFiles(homework);

  const resetForm = useCallback(() => {
    setTitle(homework?.title ?? '');
    setDescription(homework?.description ?? '');
    setPoints(homework?.points?.toString() ?? '');
    setUploadedFiles([]);
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
    setFormError(null);
    onClose();
  }, [onClose, resetForm]);

  const handleFilesAdd = useCallback((files: File[]) => {
    const newItems: UploadedFile[] = files.map((file) => ({ file }));
    setUploadedFiles((prev) => [...prev, ...newItems]);
  }, []);

  const handleRemoveNewFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveExisting = useCallback((fileId: string) => {
    setRemovedExistingIds((prev) => new Set(prev).add(fileId));
  }, []);

  const handleDownloadFile = useCallback(async (fileId: string) => {
    try {
      const res = await getFileDownloadUrl(fileId);
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        alert(res.error?.message ?? t('teacherSubjectMaterialDownloadError'));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : t('teacherSubjectMaterialDownloadError'));
    }
  }, [t]);

  const uploadAllNewFiles = useCallback(async (files: UploadedFile[]): Promise<string[]> => {
    const fileIds: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.uploaded) {
        fileIds.push(item.uploaded.id);
        continue;
      }

      setUploadedFiles((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], uploading: true, error: undefined };
        return next;
      });

      try {
        const uploadRes = await uploadFile(item.file);
        if (uploadRes.error || !uploadRes.data) {
          const msg = uploadRes.error?.message ?? t('teacherSubjectMaterialUploadError');
          setUploadedFiles((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], uploading: false, error: msg };
            return next;
          });
          throw new Error(msg);
        }
        fileIds.push(uploadRes.data.id);
        setUploadedFiles((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], uploading: false, uploaded: uploadRes.data };
          return next;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('teacherSubjectMaterialUploadError');
        setUploadedFiles((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], uploading: false, error: msg };
          return next;
        });
        throw err;
      }
    }
    return fileIds;
  }, [t]);

  const handleSave = useCallback(async () => {
    const titleTrimmed = title.trim();
    if (!titleTrimmed) {
      setFieldErrors({ title: t('homeworkTitleRequired') });
      return;
    }
    if (titleTrimmed.length > 500) {
      setFieldErrors({ title: t('homeworkTitleTooLong') });
      return;
    }
    if (description.trim().length > 5000) {
      setFieldErrors({ description: t('homeworkDescriptionTooLong') });
      return;
    }

    const pointsNum = points.trim() ? Number(points.trim()) : null;
    if (pointsNum !== null && (isNaN(pointsNum) || pointsNum < 0)) {
      setFieldErrors({ points: t('homeworkPointsInvalid') });
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSaving(true);

    try {
      let newFileIds: string[] = [];
      if (uploadedFiles.length > 0) {
        try {
          newFileIds = await uploadAllNewFiles(uploadedFiles);
        } catch (err) {
          setFormError(err instanceof Error ? err.message : t('teacherSubjectMaterialUploadError'));
          setSaving(false);
          return;
        }
      }

      if (isEditMode && homework) {
        const keptExistingIds = existingFiles
          .filter((f) => !removedExistingIds.has(f.id))
          .map((f) => f.id);
        const storedFileIds = [...keptExistingIds, ...newFileIds];

        const updateBody: import('../../api/types').UpdateHomeworkRequest = {};
        if (titleTrimmed !== homework.title) updateBody.title = titleTrimmed;
        if (description.trim() !== (homework.description ?? '')) {
          updateBody.description = description.trim() || null;
        }
        if (pointsNum !== homework.points) updateBody.points = pointsNum;
        updateBody.storedFileIds = storedFileIds;

        const result = await updateHomework(homework.id, updateBody);

        if (result.error) {
          if (result.status === 403) setFormError(t('homeworkPermissionDenied'));
          else if (result.status === 404) setFormError(t('homeworkNotFound'));
          else {
            const err = result.error as { details?: Record<string, string> };
            if (err?.details && typeof err.details === 'object') {
              setFieldErrors(parseFieldErrors(err.details));
            }
            setFormError(result.error.message ?? t('homeworkSaveError'));
          }
          setSaving(false);
          return;
        }
      } else {
        const result = await createHomework(lessonId, {
          title: titleTrimmed,
          description: description.trim() || null,
          points: pointsNum,
          storedFileIds: newFileIds.length > 0 ? newFileIds : null,
        });

        if (result.error) {
          if (result.status === 403) setFormError(t('homeworkCreatePermissionDenied'));
          else if (result.status === 404) setFormError(t('homeworkLessonNotFound'));
          else {
            const err = result.error as { details?: Record<string, string> };
            if (err?.details && typeof err.details === 'object') {
              setFieldErrors(parseFieldErrors(err.details));
            }
            setFormError(result.error.message ?? t('homeworkSaveError'));
          }
          setSaving(false);
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
    uploadedFiles,
    removedExistingIds,
    existingFiles,
    isEditMode,
    homework,
    lessonId,
    uploadAllNewFiles,
    t,
    onSaved,
    handleClose,
  ]);

  const titleText = isEditMode ? t('homeworkEditTitle') : t('homeworkCreateTitle');
  const keptExisting = existingFiles.filter((f) => !removedExistingIds.has(f.id));

  return (
    <>
      <Modal open={open} onClose={handleClose} title={titleText} variant="form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {formError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="error" role="alert">
                {formError}
              </Alert>
            </div>
          )}

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
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
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
              onChange={(e) => setPoints(e.target.value)}
              disabled={saving}
              placeholder={t('homeworkPointsPlaceholder')}
            />
          </FormGroup>

          <FormGroup label={t('homeworkFiles')} htmlFor="homework-files">
            {/* Существующие файлы (режим редактирования) */}
            {isEditMode && keptExisting.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {keptExisting.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
                        {file.originalName || t('homeworkFile')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(file.id)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem' }}
                      title={t('download')}
                      disabled={saving}
                    >
                      <Download style={{ width: '1rem', height: '1rem' }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(file.id)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                      title={t('remove')}
                      disabled={saving}
                    >
                      <X style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Уже удалённые в этой сессии (показать только если есть что восстанавливать — не показываем) */}

            {/* Новые файлы: drop zone + список */}
            <FileUploadArea
              items={uploadedFiles.map((uf) => ({
                file: uf.file,
                uploaded: uf.uploaded
                  ? { id: uf.uploaded.id, originalName: uf.uploaded.originalName, size: uf.uploaded.size }
                  : undefined,
                uploading: uf.uploading,
                error: uf.error,
              }))}
              onAdd={handleFilesAdd}
              onRemove={handleRemoveNewFile}
              onDownload={handleDownloadFile}
              disabled={saving}
              multiple
              dropZoneText={t('homeworkClickToUpload')}
              buttonText={t('homeworkUploadFile')}
              inputId="homework-files"
              downloadTitle={t('download')}
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
    </>
  );
}

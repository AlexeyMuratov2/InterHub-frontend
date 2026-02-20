/**
 * Модалка создания/редактирования домашнего задания.
 * Поддерживает загрузку одного файла или использование уже загруженного файла.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n';
import { parseFieldErrors } from '../../lib/parseFieldErrors';
import { formatFileSize } from '../../lib/fileUtils';
import { Modal } from '../Modal';
import { FormActions } from '../FormActions';
import { FormGroup } from '../FormGroup';
import { Alert } from '../Alert';
import { uploadFile, getFileDownloadUrl } from '../../api/materials';
import { createHomework, updateHomework } from '../../api/homework';
import type { StoredFileDto, HomeworkDto } from '../../api/types';
import { Upload, X, Trash2, Download } from 'lucide-react';
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
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [useExistingFileId, setUseExistingFileId] = useState<string>('');
  const [clearFile, setClearFile] = useState(false);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!homework;

  const resetForm = useCallback(() => {
    setTitle(homework?.title ?? '');
    setDescription(homework?.description ?? '');
    setPoints(homework?.points?.toString() ?? '');
    setUploadedFile(null);
    setUseExistingFileId('');
    setClearFile(false);
    setFormError(null);
    setFieldErrors({});
    setDropZoneActive(false);
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({ file });
      setUseExistingFileId('');
      setClearFile(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile({ file });
      setUseExistingFileId('');
      setClearFile(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropZoneActive(false);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setUseExistingFileId('');
    setClearFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const uploadFileIfNeeded = useCallback(async (): Promise<string | null> => {
    if (useExistingFileId.trim()) {
      return useExistingFileId.trim();
    }

    if (!uploadedFile) {
      return null;
    }

    if (uploadedFile.uploaded) {
      return uploadedFile.uploaded.id;
    }

    setUploadedFile((prev) => prev ? { ...prev, uploading: true, error: undefined } : null);

    try {
      const uploadRes = await uploadFile(uploadedFile.file);
      if (uploadRes.error || !uploadRes.data) {
        const errorMsg = uploadRes.error?.message ?? t('teacherSubjectMaterialUploadError');
        setUploadedFile((prev) => prev ? { ...prev, uploading: false, error: errorMsg } : null);
        throw new Error(errorMsg);
      }

      const fileId = uploadRes.data.id;
      setUploadedFile((prev) => prev ? { ...prev, uploading: false, uploaded: uploadRes.data } : null);
      return fileId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('teacherSubjectMaterialUploadError');
      setUploadedFile((prev) => prev ? { ...prev, uploading: false, error: errorMsg } : null);
      throw err;
    }
  }, [uploadedFile, useExistingFileId, t]);

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
      let storedFileId: string | null = null;

      // Upload file if needed
      if (uploadedFile || useExistingFileId.trim()) {
        try {
          storedFileId = await uploadFileIfNeeded();
        } catch (err) {
          setFormError(err instanceof Error ? err.message : t('teacherSubjectMaterialUploadError'));
          setSaving(false);
          return;
        }
      }

      if (isEditMode && homework) {
        // Edit mode: update homework
        const updateBody: any = {};
        
        if (titleTrimmed !== homework.title) {
          updateBody.title = titleTrimmed;
        }
        
        if (description.trim() !== (homework.description ?? '')) {
          updateBody.description = description.trim() || null;
        }
        
        if (pointsNum !== homework.points) {
          updateBody.points = pointsNum;
        }

        // Handle file changes
        if (clearFile) {
          updateBody.clearFile = true;
        } else if (storedFileId) {
          updateBody.storedFileId = storedFileId;
        }

        const result = await updateHomework(homework.id, updateBody);

        if (result.error) {
          if (result.status === 403) {
            setFormError(t('homeworkPermissionDenied'));
          } else if (result.status === 404) {
            setFormError(t('homeworkNotFound'));
          } else {
            const err = result.error as { details?: Record<string, string> };
            const details = err?.details;
            if (details && typeof details === 'object') {
              setFieldErrors(parseFieldErrors(details));
            }
            setFormError(result.error.message ?? t('homeworkSaveError'));
          }
          setSaving(false);
          return;
        }
      } else {
        // Create mode: create new homework
        const result = await createHomework(lessonId, {
          title: titleTrimmed,
          description: description.trim() || null,
          points: pointsNum,
          storedFileId: storedFileId || null,
        });

        if (result.error) {
          if (result.status === 403) {
            setFormError(t('homeworkCreatePermissionDenied'));
          } else if (result.status === 404) {
            setFormError(t('homeworkLessonNotFound'));
          } else {
            const err = result.error as { details?: Record<string, string> };
            const details = err?.details;
            if (details && typeof details === 'object') {
              setFieldErrors(parseFieldErrors(details));
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
    uploadedFile,
    useExistingFileId,
    clearFile,
    isEditMode,
    homework,
    lessonId,
    uploadFileIfNeeded,
    t,
    onSaved,
    handleClose,
  ]);

  const titleText = isEditMode ? t('homeworkEditTitle') : t('homeworkCreateTitle');
  const hasFile = uploadedFile || useExistingFileId.trim() || (homework?.file && !clearFile);

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

          {/* File upload section */}
          <FormGroup label={t('homeworkFile')} htmlFor="homework-file">
            {/* Existing file in edit mode */}
            {isEditMode && homework?.file && !clearFile && !uploadedFile && !useExistingFileId && (
              <div style={{ marginBottom: '1rem' }}>
                <div
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
                      {homework.file.originalName || t('homeworkFile')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {formatFileSize(homework.file.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(homework.file!.id)}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.5rem' }}
                    title={t('download')}
                    disabled={saving}
                  >
                    <Download style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearFile(true)}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                    title={t('remove')}
                    disabled={saving}
                  >
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              </div>
            )}

            {/* File input (hidden) */}
            <input
              ref={fileInputRef}
              id="homework-file"
              type="file"
              onChange={handleFileSelect}
              disabled={saving}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
              tabIndex={-1}
            />

            {/* Drop zone or file display */}
            {!hasFile && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1.5rem',
                  border: `2px dashed ${dropZoneActive ? '#345FE7' : '#d1d5db'}`,
                  borderRadius: '8px',
                  backgroundColor: dropZoneActive ? '#f0f4ff' : '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  minHeight: '120px',
                  marginBottom: '0.75rem',
                }}
              >
                <Upload style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  {t('homeworkClickToUpload')}
                </span>
              </div>
            )}

            {hasFile && (
              <div style={{ marginBottom: '0.75rem' }}>
                {uploadedFile && (
                  <div
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
                        {uploadedFile.file.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {formatFileSize(uploadedFile.file.size)}
                        {uploadedFile.uploading && ` • ${t('uploading')}`}
                        {uploadedFile.error && ` • ${uploadedFile.error}`}
                      </div>
                    </div>
                    {uploadedFile.uploaded && (
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(uploadedFile.uploaded!.id)}
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title={t('download')}
                        disabled={saving}
                      >
                        <Download style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={saving || uploadedFile?.uploading}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                      title={t('delete')}
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                )}
                {useExistingFileId.trim() && !uploadedFile && (
                  <div
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
                        {t('homeworkFileId')}: {useExistingFileId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={saving}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                      title={t('delete')}
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {!hasFile && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="btn-secondary"
                style={{ marginBottom: '1rem' }}
              >
                <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                {t('homeworkUploadFile')}
              </button>
            )}

            {/* Option to use existing file ID (for advanced users) */}
            {!hasFile && (
              <div style={{ marginTop: '0.5rem' }}>
                <input
                  type="text"
                  value={useExistingFileId}
                  onChange={(e) => {
                    setUseExistingFileId(e.target.value);
                    setUploadedFile(null);
                    setClearFile(false);
                  }}
                  disabled={saving}
                  placeholder={t('homeworkFileIdPlaceholder')}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {t('homeworkFileIdHint')}
                </p>
              </div>
            )}
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

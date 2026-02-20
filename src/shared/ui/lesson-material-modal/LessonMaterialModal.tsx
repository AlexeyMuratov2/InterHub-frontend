/**
 * Модалка создания/редактирования материала урока.
 * Поддерживает загрузку нескольких файлов и создание материала с ними.
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
import { createLessonMaterial, addLessonMaterialFiles } from '../../api/lessonMaterials';
import type { StoredFileDto, CompositionLessonMaterialDto } from '../../api/types';
import { Upload, X, Trash2, Download } from 'lucide-react';
import '../lesson-modal/lesson-modal.css';

export interface LessonMaterialModalProps {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  material?: CompositionLessonMaterialDto | null;
  onSaved: () => void;
}

interface UploadedFile {
  file: File;
  uploaded?: StoredFileDto;
  uploading?: boolean;
  error?: string;
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!material;

  const resetForm = useCallback(() => {
    setName(material?.name ?? '');
    setDescription(material?.description ?? '');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16);
    setPublishedAt(material?.publishedAt ? material.publishedAt.slice(0, 16) : dateStr);
    setUploadedFiles([]);
    setFormError(null);
    setFieldErrors({});
    setDropZoneActive(false);
  }, [material]);

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
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      const newFiles: UploadedFile[] = files.map((file) => ({ file }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const newFiles: UploadedFile[] = files.map((file) => ({ file }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropZoneActive(false);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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

  const uploadAllFiles = useCallback(async (files: UploadedFile[]): Promise<string[]> => {
    const fileIds: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const uploadedFile = files[i];
      if (uploadedFile.uploaded) {
        fileIds.push(uploadedFile.uploaded.id);
        continue;
      }

      setUploadedFiles((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], uploading: true, error: undefined };
        return updated;
      });

      try {
        const uploadRes = await uploadFile(uploadedFile.file);
        if (uploadRes.error || !uploadRes.data) {
          const errorMsg = uploadRes.error?.message ?? t('teacherSubjectMaterialUploadError');
          setUploadedFiles((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], uploading: false, error: errorMsg };
            return updated;
          });
          throw new Error(errorMsg);
        }

        fileIds.push(uploadRes.data.id);
        setUploadedFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploading: false, uploaded: uploadRes.data };
          return updated;
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : t('teacherSubjectMaterialUploadError');
        setUploadedFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploading: false, error: errorMsg };
          return updated;
        });
        throw err;
      }
    }

    return fileIds;
  }, [t]);

  const handleSave = useCallback(async () => {
    const nameTrimmed = name.trim();
    if (!nameTrimmed) {
      setFieldErrors({ name: t('lessonMaterialNameRequired') });
      return;
    }
    if (nameTrimmed.length > 500) {
      setFieldErrors({ name: t('lessonMaterialNameTooLong') });
      return;
    }
    if (description.trim().length > 5000) {
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
      let storedFileIds: string[] = [];

      // Upload files if any
      if (uploadedFiles.length > 0) {
        try {
          storedFileIds = await uploadAllFiles(uploadedFiles);
        } catch (err) {
          setFormError(err instanceof Error ? err.message : t('teacherSubjectMaterialUploadError'));
          setSaving(false);
          return;
        }
      }

      if (isEditMode && material) {
        // Edit mode: add files to existing material
        if (storedFileIds.length > 0) {
          const result = await addLessonMaterialFiles(lessonId, material.id, {
            storedFileIds,
          });
          if (result.error) {
            if (result.status === 403) {
              setFormError(t('lessonMaterialPermissionDenied'));
            } else if (result.status === 404) {
              setFormError(t('lessonMaterialNotFound'));
            } else {
              const err = result.error as { details?: Record<string, string> };
              const details = err?.details;
              if (details && typeof details === 'object') {
                setFieldErrors(parseFieldErrors(details));
              }
              setFormError(result.error.message ?? t('lessonMaterialSaveError'));
            }
            setSaving(false);
            return;
          }
        }
        // Note: editing name/description/publishedAt is not in the API contract,
        // so we only support adding files in edit mode
      } else {
        // Create mode: create new material
        const result = await createLessonMaterial(lessonId, {
          name: nameTrimmed,
          description: description.trim() || null,
          publishedAt: publishedAt.trim(),
          storedFileIds: storedFileIds.length > 0 ? storedFileIds : null,
        });

        if (result.error) {
          if (result.status === 403) {
            setFormError(t('lessonMaterialCreatePermissionDenied'));
          } else if (result.status === 404) {
            setFormError(t('lessonMaterialLessonNotFound'));
          } else {
            const err = result.error as { details?: Record<string, string> };
            const details = err?.details;
            if (details && typeof details === 'object') {
              setFieldErrors(parseFieldErrors(details));
            }
            setFormError(result.error.message ?? t('lessonMaterialSaveError'));
          }
          setSaving(false);
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
    uploadedFiles,
    isEditMode,
    material,
    lessonId,
    uploadAllFiles,
    t,
    onSaved,
    handleClose,
  ]);

  const title = isEditMode ? t('lessonMaterialEditTitle') : t('lessonMaterialCreateTitle');

  return (
    <>
      <Modal open={open} onClose={handleClose} title={title} variant="form">
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
            label={t('lessonMaterialName')}
            htmlFor="material-name"
            required
            error={fieldErrors.name}
          >
            <input
              id="material-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
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
              onChange={(e) => setPublishedAt(e.target.value)}
              disabled={saving || isEditMode}
            />
          </FormGroup>

          {/* File upload section */}
          {!isEditMode && (
            <FormGroup label={t('lessonMaterialFiles')} htmlFor="material-files">
              <input
                ref={fileInputRef}
                id="material-files"
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={saving}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                tabIndex={-1}
              />
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
                  {t('lessonMaterialClickToUpload')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="btn-secondary"
                style={{ marginBottom: '1rem' }}
              >
                <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                {t('lessonMaterialUploadFiles')}
              </button>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {uploadedFiles.map((uploadedFile, index) => (
                    <div
                      key={index}
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
                        >
                          <Download style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        disabled={saving || uploadedFile.uploading}
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                        title={t('delete')}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormGroup>
          )}

          {/* Existing files in edit mode */}
          {isEditMode && material && material.files.length > 0 && (
            <FormGroup label={t('lessonMaterialExistingFiles')} htmlFor="existing-files">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {material.files.map((file) => (
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
                        {file.originalName || t('lessonMaterialFile')}
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
                    >
                      <Download style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                ))}
              </div>
            </FormGroup>
          )}

          {/* Add files in edit mode */}
          {isEditMode && (
            <FormGroup label={t('lessonMaterialAddFiles')} htmlFor="add-files">
              <input
                ref={fileInputRef}
                id="add-files"
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={saving}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                tabIndex={-1}
              />
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
                  {t('lessonMaterialClickToUpload')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="btn-secondary"
                style={{ marginBottom: '1rem' }}
              >
                <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                {t('lessonMaterialUploadFiles')}
              </button>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {uploadedFiles.map((uploadedFile, index) => (
                    <div
                      key={index}
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
                        >
                          <Download style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        disabled={saving || uploadedFile.uploading}
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                        title={t('delete')}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormGroup>
          )}

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

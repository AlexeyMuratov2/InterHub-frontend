import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Plus, X } from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import {
  getTeacherSubjectDetail,
  uploadFile,
  addCourseMaterial,
  getFileDownloadUrl,
  deleteMaterial,
  getOfferingMaterials,
} from '../../../../shared/api';
import type {
  TeacherSubjectDetailDto,
  CourseMaterialDto,
  CourseMaterialInfoDto,
  GroupSubjectOfferingInfoDto,
} from '../../../../shared/api';

function mapCourseMaterialsToInfo(materials: CourseMaterialDto[]): CourseMaterialInfoDto[] {
  return materials
    .filter((m): m is CourseMaterialDto & { file: NonNullable<CourseMaterialDto['file']> } => m.file != null)
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      authorId: m.authorId,
      authorName: null,
      uploadedAt: m.uploadedAt,
      file: {
        id: m.file.id,
        originalName: m.file.originalName,
        contentType: m.file.contentType,
        size: m.file.size,
        uploadedAt: m.file.uploadedAt,
        uploadedBy: m.file.uploadedBy,
      },
    }));
}
import {
  Alert,
  BackLink,
  PageHero,
  SectionCard,
  InfoTile,
  FileCard,
  FileUploadArea,
} from '../../../../shared/ui';
import { getSubjectDisplayName } from '../../../../shared/lib';

const SUBJECTS_BACK_PATH = '/dashboards/teacher/subjects';

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [subjectDetail, setSubjectDetail] = useState<TeacherSubjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [selectedOffering, setSelectedOffering] = useState<GroupSubjectOfferingInfoDto | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const loadSubjectDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    const res = await getTeacherSubjectDetail(id);
    if (res.error) {
      if (res.error.status === 404) {
        setNotFound(true);
      } else {
        setError(res.error.message ?? tRef.current('teacherSubjectDetailErrorLoad'));
      }
      setSubjectDetail(null);
    } else {
      setSubjectDetail(res.data ?? null);
      if (res.data?.offerings?.[0]) {
        setSelectedOffering(res.data.offerings[0]);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadSubjectDetail();
  }, [loadSubjectDetail]);

  const handleFilesAdd = useCallback((files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUploadMaterial = async () => {
    if (selectedFiles.length === 0 || !selectedOffering || !materialTitle.trim()) {
      setUploadError(tRef.current('teacherSubjectMaterialValidationError'));
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const uploadRes = await uploadFile(file);
        if (uploadRes.error || !uploadRes.data) {
          setUploadError(uploadRes.error?.message ?? tRef.current('teacherSubjectMaterialUploadError'));
          setUploading(false);
          return;
        }

        const materialRes = await addCourseMaterial(selectedOffering.id, {
          storedFileId: uploadRes.data.id,
          title: materialTitle.trim() || file.name,
          description: materialDescription.trim() || null,
        });

        if (materialRes.error) {
          setUploadError(materialRes.error.message ?? tRef.current('teacherSubjectMaterialCreateError'));
          setUploading(false);
          return;
        }
      }

      await loadSubjectDetail();
      if (selectedOffering) {
        const materialsRes = await getOfferingMaterials(selectedOffering.id);
        if (materialsRes.data) {
          setSelectedOffering({
            ...selectedOffering,
            materials: mapCourseMaterialsToInfo(materialsRes.data),
          });
        }
      }

      setAddMaterialOpen(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setSelectedFiles([]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : tRef.current('teacherSubjectMaterialUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadMaterial = async (material: CourseMaterialInfoDto) => {
    try {
      const res = await getFileDownloadUrl(material.file.id);
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        alert(res.error?.message ?? tRef.current('teacherSubjectMaterialDownloadError'));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : tRef.current('teacherSubjectMaterialDownloadError'));
    }
  };

  const handleDeleteMaterial = async (material: CourseMaterialInfoDto) => {
    if (!confirm(tRef.current('teacherSubjectMaterialDeleteConfirm'))) return;

    try {
      const res = await deleteMaterial(material.id);
      if (res.error) {
        alert(res.error.message ?? tRef.current('teacherSubjectMaterialDeleteError'));
        return;
      }

      if (selectedOffering) {
        const materialsRes = await getOfferingMaterials(selectedOffering.id);
        if (materialsRes.data) {
          setSelectedOffering({
            ...selectedOffering,
            materials: mapCourseMaterialsToInfo(materialsRes.data),
          });
        }
      }
      await loadSubjectDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : tRef.current('teacherSubjectMaterialDeleteError'));
    }
  };

  if (loading) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="entity-view-card">
          <p style={{ margin: 0, color: '#6b7280' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (notFound || error) {
    return (
      <div className="entity-view-page department-form-page">
        <Alert variant="error" role="alert">
          {notFound ? t('teacherSubjectDetailNotFound') : error}
        </Alert>
        <BackLink to={SUBJECTS_BACK_PATH} icon={<ArrowLeft size={16} />}>
          {t('backToSubjects')}
        </BackLink>
      </div>
    );
  }

  if (!subjectDetail) return null;

  const { subject, curriculumSubject } = subjectDetail;
  const subjectName = getSubjectDisplayName(subject, locale);

  return (
    <div className="entity-view-page department-form-page ed-page">
      <BackLink to={SUBJECTS_BACK_PATH} icon={<ArrowLeft size={16} />}>
        {t('backToSubjects')}
      </BackLink>

      <PageHero
        icon={<BookOpen size={28} />}
        title={subjectName}
        subtitle={subject.code ?? undefined}
        meta={
          subject.departmentName
            ? curriculumSubject.credits != null
              ? `${subject.departmentName} · ${curriculumSubject.credits} ${t('credits')}`
              : subject.departmentName
            : curriculumSubject.credits != null
              ? `${curriculumSubject.credits} ${t('credits')}`
              : undefined
        }
      />

      <SectionCard
        icon={<BookOpen size={18} />}
        title={t('studentSubjectInfoSubjectTitle')}
      >
        <div className="ed-info-grid">
          {subject.departmentName && (
            <InfoTile label={t('teacherSubjectDepartment')} value={subject.departmentName} />
          )}
          {curriculumSubject.credits != null && (
            <InfoTile label={t('credits')} value={String(curriculumSubject.credits)} />
          )}
          {curriculumSubject.hoursTotal != null && (
            <InfoTile label={t('teacherSubjectTotalHours')} value={`${curriculumSubject.hoursTotal}h`} />
          )}
          {curriculumSubject.durationWeeks != null && (
            <InfoTile
              label={t('teacherSubjectDuration')}
              value={`${t('week')} ${curriculumSubject.semesterNo}-${curriculumSubject.semesterNo + curriculumSubject.durationWeeks - 1}`}
            />
          )}
          {curriculumSubject.assessmentTypeName && (
            <InfoTile
              label={t('teacherSubjectAssessmentType')}
              value={curriculumSubject.assessmentTypeName}
            />
          )}
        </div>
        {subject.description && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '0.9375rem' }}>{subject.description}</p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<FileText size={18} />}
        title={t('teacherSubjectTabCourseMaterials')}
        action={
          subjectDetail.offerings.length > 0 ? (
            <button
              type="button"
              className="ed-absence-action__btn"
              onClick={() => setAddMaterialOpen(true)}
            >
              <Plus size={18} />
              {t('teacherSubjectAddMaterial')}
            </button>
          ) : undefined
        }
      >
        {subjectDetail.offerings.length > 1 && (
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="offering-select"
              style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}
            >
              {t('teacherSubjectSelectGroup')}
            </label>
            <select
              id="offering-select"
              value={selectedOffering?.id ?? ''}
              onChange={(e) => {
                const offering = subjectDetail.offerings.find((o) => o.id === e.target.value);
                setSelectedOffering(offering ?? null);
              }}
              className="form-control"
              style={{ maxWidth: '320px' }}
            >
              {subjectDetail.offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.groupCode || offering.groupName || offering.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {addMaterialOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => {
              if (!uploading) {
                setAddMaterialOpen(false);
                setUploadError(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-labelledby="add-material-title"
              className="department-modal"
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: 0,
                maxWidth: '480px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <h3 id="add-material-title" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                  {t('teacherSubjectAddMaterial')}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (!uploading) {
                      setAddMaterialOpen(false);
                      setUploadError(null);
                    }
                  }}
                  disabled={uploading}
                  aria-label={t('lessonModalClose')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2rem',
                    height: '2rem',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    borderRadius: '6px',
                  }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {uploadError && (
                  <div style={{ marginBottom: '1rem' }}>
                    <Alert variant="error" role="alert">
                      {uploadError}
                    </Alert>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="material-title" className="form-label">
                    {t('teacherSubjectMaterialTitle')}
                  </label>
                  <input
                    id="material-title"
                    type="text"
                    className="form-control"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    disabled={uploading}
                    placeholder={t('teacherSubjectMaterialTitlePlaceholder')}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="material-description" className="form-label">
                    {t('teacherSubjectMaterialDescription')}
                  </label>
                  <textarea
                    id="material-description"
                    className="form-control"
                    value={materialDescription}
                    onChange={(e) => setMaterialDescription(e.target.value)}
                    disabled={uploading}
                    placeholder={t('teacherSubjectMaterialDescriptionPlaceholder')}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <FileUploadArea
                    items={selectedFiles.map((file) => ({ file }))}
                    onAdd={handleFilesAdd}
                    onRemove={handleFileRemove}
                    disabled={uploading}
                    multiple
                    label={t('teacherSubjectMaterialFile')}
                    dropZoneText={t('teacherSubjectClickToUploadMultiple')}
                    buttonText={t('teacherSubjectUploadFile')}
                    inputId="material-files"
                    deleteTitle={t('remove')}
                    uploadingText={t('uploading')}
                  />
                </div>

                <div className="form-actions" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setAddMaterialOpen(false);
                      setUploadError(null);
                    }}
                    disabled={uploading}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleUploadMaterial}
                    disabled={uploading || selectedFiles.length === 0 || !materialTitle.trim()}
                  >
                    {uploading ? t('uploading') : t('teacherSubjectAddMaterial')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedOffering ? (
          selectedOffering.materials.length === 0 ? (
            <p className="ed-empty">
              {t('teacherSubjectNoMaterials')}
              {subjectDetail.offerings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddMaterialOpen(true)}
                  style={{
                    marginLeft: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#2563eb',
                    background: 'transparent',
                    border: '1px solid #2563eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {t('teacherSubjectAddMaterial')}
                </button>
              )}
            </p>
          ) : (
            <div className="ed-material-list">
              {selectedOffering.materials.map((material) => (
                <FileCard
                  key={material.id}
                  title={material.title}
                  size={material.file.size}
                  uploadedAt={material.uploadedAt}
                  description={material.description}
                  onDownload={() => handleDownloadMaterial(material)}
                  onDelete={() => handleDeleteMaterial(material)}
                />
              ))}
            </div>
          )
        ) : (
          <p className="ed-empty">{t('teacherSubjectNoOfferings')}</p>
        )}
      </SectionCard>
    </div>
  );
}

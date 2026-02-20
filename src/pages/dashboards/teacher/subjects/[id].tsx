import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../../../shared/i18n';
import type { Locale } from '../../../../shared/i18n';
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
  CourseMaterialInfoDto,
  GroupSubjectOfferingInfoDto,
} from '../../../../shared/api';
import { Alert, FileCard } from '../../../../shared/ui';
import { formatFileSize } from '../../../../shared/lib';
import { BookOpen, Plus, Upload, X } from 'lucide-react';

const TAB_STUDENTS = 'students';
const TAB_COURSE_MATERIALS = 'course-materials';

function subjectDisplayNameByLocale(
  subject: TeacherSubjectDetailDto['subject'],
  locale: Locale
): string {
  if (locale === 'zh-Hans') {
    return subject.chineseName || subject.englishName || subject.code || '—';
  }
  return subject.englishName || subject.chineseName || subject.code || '—';
}

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [subjectDetail, setSubjectDetail] = useState<TeacherSubjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [activeTab, setActiveTab] = useState(TAB_STUDENTS);
  const [selectedOffering, setSelectedOffering] = useState<GroupSubjectOfferingInfoDto | null>(null);

  // Material upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Set first offering as selected for course materials tab
      if (res.data?.offerings?.[0]) {
        setSelectedOffering(res.data.offerings[0]);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadSubjectDetail();
  }, [loadSubjectDetail]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!materialTitle) {
        setMaterialTitle(file.name);
      }
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!materialTitle) {
        setMaterialTitle(file.name);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(true);
  };

  const handleDragLeave = () => {
    setDropZoneActive(false);
  };

  const handleUploadMaterial = async () => {
    if (!selectedFile || !selectedOffering || !materialTitle.trim()) {
      setUploadError(tRef.current('teacherSubjectMaterialValidationError'));
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1: Upload file
      const uploadRes = await uploadFile(selectedFile);
      if (uploadRes.error || !uploadRes.data) {
        setUploadError(uploadRes.error?.message ?? tRef.current('teacherSubjectMaterialUploadError'));
        setUploading(false);
        return;
      }

      // Step 2: Create material
      const materialRes = await addCourseMaterial(selectedOffering.id, {
        storedFileId: uploadRes.data.id,
        title: materialTitle.trim(),
        description: materialDescription.trim() || null,
      });

      if (materialRes.error) {
        setUploadError(materialRes.error.message ?? tRef.current('teacherSubjectMaterialCreateError'));
        setUploading(false);
        return;
      }

      // Success: reload subject detail and materials
      await loadSubjectDetail();
      if (selectedOffering) {
        const materialsRes = await getOfferingMaterials(selectedOffering.id);
        if (materialsRes.data) {
          setSelectedOffering({
            ...selectedOffering,
            materials: materialsRes.data,
          });
        }
      }

      // Reset form
      setAddMaterialOpen(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      // Reload materials
      if (selectedOffering) {
        const materialsRes = await getOfferingMaterials(selectedOffering.id);
        if (materialsRes.data) {
          setSelectedOffering({
            ...selectedOffering,
            materials: materialsRes.data,
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
      <section className="entity-view-card" style={{ marginTop: '1rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('loading')}</p>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="entity-view-card" style={{ marginTop: '1rem' }}>
        <h2 className="entity-view-card-title">{t('teacherSubjectDetailNotFound')}</h2>
        <p>{t('teacherSubjectDetailNotFoundMessage')}</p>
        <Link to="/dashboards/teacher/subjects" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          {t('backToSubjects')}
        </Link>
      </section>
    );
  }

  if (error || !subjectDetail) {
    return (
      <section className="entity-view-card" style={{ marginTop: '1rem' }}>
        <Alert variant="error" role="alert">
          {error ?? t('teacherSubjectDetailErrorLoad')}
        </Alert>
        <Link to="/dashboards/teacher/subjects" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          {t('backToSubjects')}
        </Link>
      </section>
    );
  }

  const { subject, curriculumSubject } = subjectDetail;

  return (
    <section className="entity-view-card" style={{ marginTop: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/dashboards/teacher/subjects" style={{ color: '#0284c7', textDecoration: 'none' }}>
          ← {t('backToSubjects')}
        </Link>
      </div>

      {/* Subject Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <BookOpen style={{ width: '2rem', height: '2rem', color: '#64748b', marginTop: '0.25rem' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, marginBottom: '0.5rem' }}>
            {subjectDisplayNameByLocale(subject, locale)}
          </h1>
          <p style={{ fontSize: '1rem', color: '#64748b', margin: 0, marginBottom: '0.25rem' }}>
            {subject.code}
          </p>
          {curriculumSubject.credits != null && (
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              {curriculumSubject.credits} {t('credits')}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {subject.description && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
          <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>{subject.description}</p>
        </div>
      )}

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {subject.departmentName && (
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              {t('teacherSubjectDepartment')}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>{subject.departmentName}</div>
          </div>
        )}
        {curriculumSubject.hoursTotal != null && (
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              {t('teacherSubjectTotalHours')}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>{curriculumSubject.hoursTotal}h</div>
          </div>
        )}
        {curriculumSubject.durationWeeks && (
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              {t('teacherSubjectDuration')}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>
              {t('week')} {curriculumSubject.semesterNo}-{curriculumSubject.semesterNo + curriculumSubject.durationWeeks - 1}
            </div>
          </div>
        )}
        {curriculumSubject.assessmentTypeName && (
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              {t('teacherSubjectAssessmentType')}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>{curriculumSubject.assessmentTypeName}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="entity-view-tabs" style={{ marginTop: '2rem' }}>
        <div role="tablist" className="entity-view-tablist" style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0' }}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === TAB_STUDENTS}
            aria-controls="panel-students"
            id="tab-students"
            className="entity-view-tab"
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              borderBottom: activeTab === TAB_STUDENTS ? '2px solid #0284c7' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === TAB_STUDENTS ? 600 : 400,
              color: activeTab === TAB_STUDENTS ? '#0284c7' : '#64748b',
            }}
            onClick={() => setActiveTab(TAB_STUDENTS)}
          >
            {t('teacherSubjectTabStudents')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === TAB_COURSE_MATERIALS}
            aria-controls="panel-course-materials"
            id="tab-course-materials"
            className="entity-view-tab"
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              borderBottom: activeTab === TAB_COURSE_MATERIALS ? '2px solid #0284c7' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === TAB_COURSE_MATERIALS ? 600 : 400,
              color: activeTab === TAB_COURSE_MATERIALS ? '#0284c7' : '#64748b',
            }}
            onClick={() => setActiveTab(TAB_COURSE_MATERIALS)}
          >
            {t('teacherSubjectTabCourseMaterials')}
          </button>
        </div>

        {/* Students Tab */}
        <div id="panel-students" role="tabpanel" aria-labelledby="tab-students" hidden={activeTab !== TAB_STUDENTS}>
          {activeTab === TAB_STUDENTS && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <p>TODO: Список студентов будет здесь</p>
            </div>
          )}
        </div>

        {/* Course Materials Tab */}
        <div id="panel-course-materials" role="tabpanel" aria-labelledby="tab-course-materials" hidden={activeTab !== TAB_COURSE_MATERIALS}>
          {activeTab === TAB_COURSE_MATERIALS && (
            <div style={{ padding: '1.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>{t('teacherSubjectTabCourseMaterials')}</h3>
                {subjectDetail.offerings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAddMaterialOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#1e40af',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus style={{ width: '1.125rem', height: '1.125rem' }} />
                    {t('teacherSubjectAddMaterial')}
                  </button>
                )}
              </div>

              {/* Offering selector */}
              {subjectDetail.offerings.length > 1 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="offering-select" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    {t('teacherSubjectSelectGroup')}:
                  </label>
                  <select
                    id="offering-select"
                    value={selectedOffering?.id ?? ''}
                    onChange={(e) => {
                      const offering = subjectDetail.offerings.find((o) => o.id === e.target.value);
                      setSelectedOffering(offering ?? null);
                    }}
                    style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', width: '100%', maxWidth: '400px' }}
                  >
                    {subjectDetail.offerings.map((offering) => (
                      <option key={offering.id} value={offering.id}>
                        {offering.groupCode || offering.groupName || offering.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Add Material Modal */}
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
                    {/* Header: title + close */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 id="add-material-title" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                        {t('teacherSubjectAddMaterial')}
                      </h3>
                      <button
                        type="button"
                        onClick={() => { if (!uploading) { setAddMaterialOpen(false); setUploadError(null); } }}
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

                      {/* Material Name */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="material-title" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                          {t('teacherSubjectMaterialTitle')}
                        </label>
                        <input
                          id="material-title"
                          type="text"
                          value={materialTitle}
                          onChange={(e) => setMaterialTitle(e.target.value)}
                          disabled={uploading}
                          placeholder={t('teacherSubjectMaterialTitlePlaceholder')}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#fff',
                            fontSize: '0.9375rem',
                            color: '#0f172a',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="material-description" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                          {t('teacherSubjectMaterialDescription')}
                        </label>
                        <textarea
                          id="material-description"
                          value={materialDescription}
                          onChange={(e) => setMaterialDescription(e.target.value)}
                          disabled={uploading}
                          placeholder={t('teacherSubjectMaterialDescriptionPlaceholder')}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#fff',
                            fontSize: '0.9375rem',
                            color: '#0f172a',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Upload File: drop zone + button */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                          {t('teacherSubjectMaterialFile')}
                        </label>
                        <input
                          ref={fileInputRef}
                          id="material-file"
                          type="file"
                          onChange={handleFileSelect}
                          disabled={uploading}
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
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
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
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            minHeight: '120px',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <Upload style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
                          <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                            {t('teacherSubjectClickToUpload')}
                          </span>
                          {selectedFile && (
                            <span style={{ fontSize: '0.875rem', color: '#345FE7', fontWeight: 500 }}>
                              {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            color: '#374151',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: uploading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Upload style={{ width: '1rem', height: '1rem' }} />
                          {t('teacherSubjectUploadFile')}
                        </button>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => { setAddMaterialOpen(false); setUploadError(null); }}
                          disabled={uploading}
                          style={{
                            padding: '0.5rem 1.25rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            color: '#374151',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            cursor: uploading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleUploadMaterial}
                          disabled={uploading || !selectedFile || !materialTitle.trim()}
                          style={{
                            padding: '0.5rem 1.25rem',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: '#345FE7',
                            color: '#fff',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            cursor: uploading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {uploading ? t('uploading') : t('teacherSubjectAddMaterial')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Materials List */}
              {selectedOffering ? (
                selectedOffering.materials.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <p>{t('teacherSubjectNoMaterials')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <p>{t('teacherSubjectNoOfferings')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

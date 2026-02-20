import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation, formatDate, formatTime } from '../../../../shared/i18n';
import { getLessonFullDetails, getFileDownloadUrl, getLesson, listRooms, deleteLessonMaterial, removeLessonMaterialFile, listLessonHomework, deleteHomework } from '../../../../shared/api';
import type {
  LessonFullDetailsDto,
  CompositionStoredFileDto,
  CompositionLessonMaterialDto,
  LessonDto,
  RoomDto,
  HomeworkDto,
} from '../../../../shared/api';
import {
  Alert,
  FileCard,
  LessonEditModal,
  LessonMaterialModal,
  ConfirmModal,
  HomeworkModal,
} from '../../../../shared/ui';
import {
  getSubjectDisplayName,
  getTeacherDisplayName,
  getLessonTypeDisplayKey,
  isNonStandardLessonStatus,
  getLessonStatusDisplayKey,
  formatCompositionRoomLine,
} from '../../../../shared/lib';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';

const LESSONS_LIST_PATH = '/dashboards/teacher/lessons';

export function LessonFullDetailsPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [data, setData] = useState<LessonFullDetailsDto | null>(null);
  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<CompositionLessonMaterialDto | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<CompositionLessonMaterialDto | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ material: CompositionLessonMaterialDto; file: CompositionStoredFileDto } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkDto | null>(null);
  const [homeworkList, setHomeworkList] = useState<HomeworkDto[]>([]);
  const [homeworkToDelete, setHomeworkToDelete] = useState<HomeworkDto | null>(null);

  const loadDetails = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    
    const [detailsRes, lessonRes, roomsRes, homeworkRes] = await Promise.all([
      getLessonFullDetails(lessonId),
      getLesson(lessonId),
      listRooms(),
      listLessonHomework(lessonId),
    ]);
    
    if (detailsRes.error) {
      if (detailsRes.status === 404 || detailsRes.error.status === 404) {
        setNotFound(true);
      } else {
        setError(detailsRes.error.message ?? tRef.current('teacherSubjectDetailErrorLoad'));
      }
      setData(null);
    } else {
      setData(detailsRes.data ?? null);
    }
    
    if (lessonRes.error) {
      if (lessonRes.status === 404 || lessonRes.error.status === 404) {
        setNotFound(true);
      }
      setLesson(null);
    } else {
      setLesson(lessonRes.data ?? null);
    }
    
    if (roomsRes.data) {
      setRooms(roomsRes.data);
    }

    if (homeworkRes.data) {
      setHomeworkList(homeworkRes.data);
    } else if (homeworkRes.error && homeworkRes.status !== 404) {
      // Ignore 404 for homework list (empty is fine)
      console.warn('Failed to load homework:', homeworkRes.error);
    }
    
    setLoading(false);
  }, [lessonId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleDownloadFile = useCallback(
    async (file: CompositionStoredFileDto) => {
      try {
        const res = await getFileDownloadUrl(file.id);
        if (res.data?.url) {
          window.open(res.data.url, '_blank');
        } else {
          alert(res.error?.message ?? tRef.current('teacherSubjectMaterialDownloadError'));
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : tRef.current('teacherSubjectMaterialDownloadError'));
      }
    },
    []
  );

  const handleEditClick = useCallback(() => {
    setEditModalOpen(true);
  }, []);

  const handleLessonUpdated = useCallback(() => {
    loadDetails();
  }, [loadDetails]);

  const handleLessonDeleted = useCallback(() => {
    navigate(LESSONS_LIST_PATH);
  }, [navigate]);

  const handleAddMaterialClick = useCallback(() => {
    setSelectedMaterial(null);
    setMaterialModalOpen(true);
  }, []);

  const handleEditMaterialClick = useCallback((material: CompositionLessonMaterialDto) => {
    setSelectedMaterial(material);
    setMaterialModalOpen(true);
  }, []);

  const handleMaterialSaved = useCallback(() => {
    loadDetails();
  }, [loadDetails]);

  const handleDeleteMaterialClick = useCallback((material: CompositionLessonMaterialDto) => {
    setMaterialToDelete(material);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteFileClick = useCallback((material: CompositionLessonMaterialDto, file: CompositionStoredFileDto) => {
    setFileToDelete({ material, file });
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!lessonId) return;
    
    setDeleting(true);
    try {
      if (materialToDelete) {
        const result = await deleteLessonMaterial(lessonId, materialToDelete.id);
        if (result.error) {
          alert(result.error.message ?? tRef.current('lessonMaterialDeleteError'));
        } else {
          await loadDetails();
        }
        setMaterialToDelete(null);
      } else if (fileToDelete) {
        const result = await removeLessonMaterialFile(lessonId, fileToDelete.material.id, fileToDelete.file.id);
        if (result.error) {
          alert(result.error.message ?? tRef.current('lessonMaterialFileDeleteError'));
        } else {
          await loadDetails();
        }
        setFileToDelete(null);
      } else if (homeworkToDelete) {
        const result = await deleteHomework(homeworkToDelete.id);
        if (result.error) {
          alert(result.error.message ?? tRef.current('homeworkDeleteError'));
        } else {
          await loadDetails();
        }
        setHomeworkToDelete(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : tRef.current('lessonMaterialDeleteError'));
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }, [lessonId, materialToDelete, fileToDelete, homeworkToDelete, loadDetails]);

  const handleAddHomeworkClick = useCallback(() => {
    setSelectedHomework(null);
    setHomeworkModalOpen(true);
  }, []);

  const handleEditHomeworkClick = useCallback((homework: HomeworkDto) => {
    setSelectedHomework(homework);
    setHomeworkModalOpen(true);
  }, []);

  const handleDeleteHomeworkClick = useCallback((homework: HomeworkDto) => {
    setHomeworkToDelete(homework);
    setDeleteConfirmOpen(true);
  }, []);

  const handleHomeworkSaved = useCallback(() => {
    loadDetails();
  }, [loadDetails]);

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
          {notFound ? t('teacherSubjectDetailNotFoundMessage') : error}
        </Alert>
        <Link to={LESSONS_LIST_PATH} className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
          {t('lessonDetailsBackToLessons')}
        </Link>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { lesson: lessonDetails, subject, room, mainTeacher, offeringSlot, materials, homework } = data;
  const subjectName = getSubjectDisplayName(subject, locale);
  const teacherDisplay = mainTeacher ? getTeacherDisplayName(mainTeacher) : '—';
  const roomDisplay = formatCompositionRoomLine(room);
  const dateTimeLine = [
    formatDate(lessonDetails.date, locale),
    lessonDetails.startTime && lessonDetails.endTime
      ? `${formatTime(`${lessonDetails.date}T${lessonDetails.startTime}`, locale)} – ${formatTime(`${lessonDetails.date}T${lessonDetails.endTime}`, locale)}`
      : `${lessonDetails.startTime?.slice(0, 5) ?? ''} – ${lessonDetails.endTime?.slice(0, 5) ?? ''}`,
  ].filter(Boolean).join(' • ');
  const showStatus = isNonStandardLessonStatus(lessonDetails.status);
  const statusKey = getLessonStatusDisplayKey(lessonDetails.status);
  const lessonTypeKey = getLessonTypeDisplayKey(offeringSlot?.lessonType ?? null);

  // Group files by material for better display
  const materialsWithFiles = materials.filter((mat) => mat.files.length > 0);

  return (
    <div className="entity-view-page department-form-page">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={LESSONS_LIST_PATH}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} aria-hidden />
          {t('lessonDetailsBackToLessons')}
        </Link>
      </div>

      {/* Lesson overview card */}
      <section
        className="entity-view-card"
        style={{
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem 1rem', marginBottom: '0.75rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {subjectName}
          </span>
          {dateTimeLine && (
            <span style={{ fontSize: '0.9375rem', color: '#475569' }}>{dateTimeLine}</span>
          )}
          {showStatus && statusKey && (
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              {t(statusKey as 'lessonModalStatusCancelled')}
            </span>
          )}
          {offeringSlot?.lessonType && (
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {t(lessonTypeKey as 'scheduleLessonTypeLecture')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem', fontSize: '0.9375rem', color: '#334155' }}>
          {roomDisplay !== '—' && (
            <span>{roomDisplay}</span>
          )}
          <span>
            {t('lessonDetailsTeacherLabel')}: {teacherDisplay}
          </span>
        </div>
        {lessonDetails.topic?.trim() && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.9375rem', color: '#475569' }}>{lessonDetails.topic.trim()}</p>
        )}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleEditClick}
            disabled={!lesson}
          >
            <Pencil style={{ width: '1rem', height: '1rem' }} aria-hidden />
            {t('lessonDetailsEditLesson')}
          </button>
        </div>
      </section>

      {/* Edit Lesson Modal */}
      {lesson && (
        <LessonEditModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          lesson={lesson}
          rooms={rooms}
          subjectName={subjectName}
          onUpdated={handleLessonUpdated}
          onDeleted={handleLessonDeleted}
        />
      )}

      {/* Lesson Material Modal */}
      {lessonId && (
        <LessonMaterialModal
          open={materialModalOpen}
          onClose={() => {
            setMaterialModalOpen(false);
            setSelectedMaterial(null);
          }}
          lessonId={lessonId}
          material={selectedMaterial}
          onSaved={handleMaterialSaved}
        />
      )}

      {/* Homework Modal */}
      {lessonId && (
        <HomeworkModal
          open={homeworkModalOpen}
          onClose={() => {
            setHomeworkModalOpen(false);
            setSelectedHomework(null);
          }}
          lessonId={lessonId}
          homework={selectedHomework}
          onSaved={handleHomeworkSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        title={
          materialToDelete
            ? t('lessonMaterialDeleteTitle')
            : fileToDelete
              ? t('lessonMaterialFileDeleteTitle')
              : homeworkToDelete
                ? t('homeworkDeleteTitle')
                : ''
        }
        message={
          materialToDelete
            ? t('lessonMaterialDeleteMessage', { name: materialToDelete.name?.trim() || t('lessonMaterialUntitled') })
            : fileToDelete
              ? t('lessonMaterialFileDeleteMessage')
              : homeworkToDelete
                ? t('homeworkDeleteMessage', { title: homeworkToDelete.title?.trim() || t('homeworkUntitled') })
                : ''
        }
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setMaterialToDelete(null);
          setFileToDelete(null);
          setHomeworkToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        cancelLabel={t('cancel')}
        confirmLabel={t('delete')}
        confirmDisabled={deleting}
      />

      {/* Two columns: Materials | Homework */}
      <div className="lesson-details-grid">
        {/* Lesson Materials */}
        <section className="entity-view-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="entity-view-card-title" style={{ margin: 0 }}>
              {t('lessonDetailsLessonMaterials')}
            </h2>
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleAddMaterialClick}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} aria-hidden />
              {t('lessonDetailsAddMaterial')}
            </button>
          </div>
          {materials.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>{t('lessonDetailsNoMaterials')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {materials.map((material) => (
                <div key={material.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                        {material.name?.trim() || t('lessonMaterialUntitled')}
                      </h3>
                      {material.description?.trim() && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                          {material.description.trim()}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem' }}
                        onClick={() => handleEditMaterialClick(material)}
                        title={t('edit')}
                      >
                        <Pencil style={{ width: '0.875rem', height: '0.875rem' }} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', color: '#dc2626' }}
                        onClick={() => handleDeleteMaterialClick(material)}
                        title={t('delete')}
                      >
                        <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} aria-hidden />
                      </button>
                    </div>
                  </div>
                  {material.files.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {material.files.map((file) => (
                        <FileCard
                          key={file.id}
                          title={file.originalName?.trim() || t('lessonMaterialFile')}
                          size={file.size}
                          uploadedAt={file.uploadedAt}
                          description={file.contentType || undefined}
                          onDownload={() => handleDownloadFile(file)}
                          onDelete={() => handleDeleteFileClick(material, file)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Homework Assignment */}
        <section className="entity-view-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="entity-view-card-title" style={{ margin: 0 }}>
              {t('lessonDetailsHomeworkAssignment')}
            </h2>
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleAddHomeworkClick}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} aria-hidden />
              {t('lessonDetailsAddHomework')}
            </button>
          </div>
          {homeworkList.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>{t('lessonDetailsNoHomework')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {homeworkList.map((hw) => (
                <div key={hw.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                        {hw.title?.trim() || t('homeworkUntitled')}
                      </h3>
                      {hw.description?.trim() && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                          {hw.description.trim()}
                        </p>
                      )}
                      {hw.points != null && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                          {t('homeworkPoints')}: {hw.points}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem' }}
                        onClick={() => handleEditHomeworkClick(hw)}
                        title={t('edit')}
                      >
                        <Pencil style={{ width: '0.875rem', height: '0.875rem' }} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', color: '#dc2626' }}
                        onClick={() => handleDeleteHomeworkClick(hw)}
                        title={t('delete')}
                      >
                        <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} aria-hidden />
                      </button>
                    </div>
                  </div>
                  {hw.file && (
                    <FileCard
                      title={hw.file.originalName || t('homeworkFile')}
                      size={hw.file.size}
                      uploadedAt={hw.file.uploadedAt}
                      description={hw.file.contentType || undefined}
                      onDownload={async () => {
                        try {
                          const res = await getFileDownloadUrl(hw.file!.id);
                          if (res.data?.url) {
                            window.open(res.data.url, '_blank');
                          } else {
                            alert(res.error?.message ?? tRef.current('teacherSubjectMaterialDownloadError'));
                          }
                        } catch (err) {
                          alert(err instanceof Error ? err.message : tRef.current('teacherSubjectMaterialDownloadError'));
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

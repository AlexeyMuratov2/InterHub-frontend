import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation, formatDate, formatTime } from '../../../../shared/i18n';
import {
  getLessonFullDetails,
  getFileDownloadUrl,
  getLesson,
  listRooms,
  deleteLessonMaterial,
  removeLessonMaterialFile,
  listLessonHomework,
  deleteHomework,
  getLessonRosterAttendance,
  putStudentAttendance,
  setLessonPoints,
} from '../../../../shared/api';
import { LessonHomeworkSubmissionsTab } from './LessonHomeworkSubmissionsTab';
import type {
  LessonFullDetailsDto,
  CompositionStoredFileDto,
  CompositionLessonMaterialDto,
  LessonDto,
  RoomDto,
  HomeworkDto,
  LessonRosterAttendanceDto,
  LessonRosterAttendanceRowDto,
  LessonRosterNoticeDto,
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
  getStudentDisplayName,
  getLessonTypeDisplayKey,
  isNonStandardLessonStatus,
  getLessonStatusDisplayKey,
  formatCompositionRoomLine,
} from '../../../../shared/lib';
import { ArrowLeft, Plus, Pencil, Trash2, Users, FileCheck } from 'lucide-react';

const LESSONS_LIST_PATH = '/dashboards/teacher/lessons';

const ATTENDANCE_STATUS_VALUES = ['', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
type AttendanceStatusValue = (typeof ATTENDANCE_STATUS_VALUES)[number];

function getAttendanceStatusLabelKey(value: string): string {
  switch (value) {
    case 'PRESENT':
      return 'attendanceStatusPresent';
    case 'ABSENT':
      return 'attendanceStatusAbsent';
    case 'LATE':
      return 'attendanceStatusLate';
    case 'EXCUSED':
      return 'attendanceStatusExcused';
    default:
      return 'attendanceStatusUnmarked';
  }
}

const ABSENCE_REQUESTS_PATH = '/dashboards/teacher/absence-requests';

interface StudentAttendanceRowProps {
  row: LessonRosterAttendanceRowDto;
  lessonDate: string;
  t: (key: string) => string;
  getAttendanceStatusLabelKey: (value: string) => string;
  isSavingAttendance: boolean;
  isSavingPoints: boolean;
  onStatusChange: (row: LessonRosterAttendanceRowDto, newStatus: AttendanceStatusValue) => void;
  onPointsBlur: (row: LessonRosterAttendanceRowDto, points: number) => void;
}

function StudentAttendanceRow({
  row,
  lessonDate,
  t,
  getAttendanceStatusLabelKey,
  isSavingAttendance,
  isSavingPoints,
  onStatusChange,
  onPointsBlur,
}: StudentAttendanceRowProps) {
  const currentStatus = (row.status || '') as AttendanceStatusValue;
  const displayName = getStudentDisplayName(row.student);
  const [localPoints, setLocalPoints] = useState(row.lessonPoints ?? 0);
  useEffect(() => {
    setLocalPoints(row.lessonPoints ?? 0);
  }, [row.lessonPoints]);

  return (
    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, color: '#0f172a' }}>{displayName}</td>
      <td style={{ padding: '0.75rem 0.5rem' }}>
        <select
          className="form-control"
          value={currentStatus}
          onChange={(e) => onStatusChange(row, e.target.value as AttendanceStatusValue)}
          disabled={isSavingAttendance}
          style={{ minWidth: '120px', padding: '0.375rem 0.5rem' }}
        >
          {ATTENDANCE_STATUS_VALUES.map((val) => (
            <option key={val || '_'} value={val}>
              {t(getAttendanceStatusLabelKey(val))}
            </option>
          ))}
        </select>
      </td>
      <td style={{ padding: '0.75rem 0.5rem' }}>
        <input
          type="number"
          min={0}
          step={0.01}
          className="form-control"
          value={localPoints}
          onChange={(e) => {
            const raw = e.target.value.trim();
            const num = raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0);
            setLocalPoints(num);
          }}
          onBlur={() => {
            const num = localPoints;
            if (num !== (row.lessonPoints ?? 0)) {
              onPointsBlur(row, num);
            }
          }}
          disabled={isSavingPoints}
          style={{ width: '4.5rem', padding: '0.375rem 0.5rem' }}
        />
      </td>
      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: '#475569' }}>
        <AbsenceNoticeCell notices={row.notices} lessonDate={lessonDate} t={t} />
      </td>
    </tr>
  );
}

function AbsenceNoticeCell({
  notices,
  lessonDate,
  t,
}: {
  notices: LessonRosterNoticeDto[];
  lessonDate: string;
  t: (key: string) => string;
}) {
  const search = new URLSearchParams();
  search.set('dateFrom', lessonDate);
  search.set('dateTo', lessonDate);
  const toLink = `${ABSENCE_REQUESTS_PATH}?${search.toString()}`;

  return (
    <Link to={toLink} style={{ color: notices?.length ? '#2563eb' : '#64748b', textDecoration: notices?.length ? 'underline' : 'none', fontWeight: notices?.length ? 500 : undefined }}>
      {!notices?.length ? t('attendanceNoNotice') : t('attendanceViewRequests') + (notices.length > 1 ? ` (${notices.length})` : '')}
    </Link>
  );
}

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

  const [activeTab, setActiveTab] = useState(0);
  const [rosterData, setRosterData] = useState<LessonRosterAttendanceDto | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [savingPointsStudentId, setSavingPointsStudentId] = useState<string | null>(null);

  const loadRoster = useCallback(async () => {
    if (!lessonId) return;
    setAttendanceLoading(true);
    setAttendanceError(null);
    const res = await getLessonRosterAttendance(lessonId, { includeCanceled: true });
    setAttendanceLoading(false);
    if (res.error) {
      setAttendanceError(res.error.message ?? tRef.current('attendanceErrorLoad'));
      setRosterData(null);
    } else {
      setRosterData(res.data ?? null);
    }
  }, [lessonId]);

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

  useEffect(() => {
    if (lessonId && data && !loading && !notFound && !error) {
      loadRoster();
    }
  }, [lessonId, data, loading, notFound, error, loadRoster]);

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

  const handleAttendanceChange = useCallback(
    async (row: LessonRosterAttendanceRowDto, newStatus: AttendanceStatusValue) => {
      if (!lessonId) return;
      setSavingStudentId(row.student.id);
      const body = {
        status: newStatus || 'PRESENT',
        minutesLate: newStatus === 'LATE' ? (row.minutesLate ?? 0) : undefined,
      };
      const res = await putStudentAttendance(lessonId, row.student.id, body);
      setSavingStudentId(null);
      if (res.error) {
        alert(res.error.message ?? tRef.current('attendanceSaveError'));
      } else {
        await loadRoster();
      }
    },
    [lessonId, loadRoster]
  );

  const handlePointsBlur = useCallback(
    async (row: LessonRosterAttendanceRowDto, points: number) => {
      if (!lessonId) return;
      setSavingPointsStudentId(row.student.id);
      const res = await setLessonPoints(lessonId, row.student.id, points);
      setSavingPointsStudentId(null);
      if (res.error) {
        alert(res.error.message ?? tRef.current('attendanceSaveError'));
      } else {
        await loadRoster();
      }
    },
    [lessonId, loadRoster]
  );

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

      {/* Carousel: Students (attendance) + future tabs */}
      <section
        className="entity-view-card"
        style={{
          marginTop: '1.5rem',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '0.25rem 0.5rem 0 0.5rem',
            gap: '0.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab(0)}
            style={{
              padding: '0.625rem 1rem',
              border: 'none',
              borderBottom: activeTab === 0 ? '2px solid #3b82f6' : '2px solid transparent',
              background: activeTab === 0 ? '#fff' : 'transparent',
              borderRadius: '8px 8px 0 0',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: activeTab === 0 ? '#1e40af' : '#64748b',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Users style={{ width: '1.125rem', height: '1.125rem' }} aria-hidden />
            {t('lessonAttendanceCarouselStudents')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            style={{
              padding: '0.625rem 1rem',
              border: 'none',
              borderBottom: activeTab === 1 ? '2px solid #3b82f6' : '2px solid transparent',
              background: activeTab === 1 ? '#fff' : 'transparent',
              borderRadius: '8px 8px 0 0',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: activeTab === 1 ? '#1e40af' : '#64748b',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <FileCheck style={{ width: '1.125rem', height: '1.125rem' }} aria-hidden />
            {t('lessonHomeworkSubmissionsTab')}
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', minHeight: '200px' }}>
          {activeTab === 0 && (
            <>
              {attendanceError && (
                <div style={{ marginBottom: '1rem' }}>
                  <Alert variant="error">{attendanceError}</Alert>
                </div>
              )}
              {attendanceLoading ? (
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>{t('loading')}</p>
              ) : rosterData?.rows && rosterData.rows.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.9375rem',
                    }}
                  >
<thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#475569' }}>
                          {t('lessonAttendanceCarouselStudents')}
                        </th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#475569', minWidth: '140px' }}>
                          {t('attendanceStatusColumn')}
                        </th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#475569', width: '100px' }}>
                          {t('homeworkPoints')}
                        </th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#475569', minWidth: '140px' }}>
                          {t('attendanceAbsenceNotice')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterData.rows.map((row) => (
                        <StudentAttendanceRow
                          key={row.student.id}
                          row={row}
                          lessonDate={rosterData.lesson.date}
                          t={t}
                          getAttendanceStatusLabelKey={getAttendanceStatusLabelKey}
                          isSavingAttendance={savingStudentId === row.student.id}
                          isSavingPoints={savingPointsStudentId === row.student.id}
                          onStatusChange={handleAttendanceChange}
                          onPointsBlur={handlePointsBlur}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>
                  {!rosterData
                    ? null
                    : rosterData.rows.length === 0
                      ? t('lessonDetailsNoStudents')
                      : t('loading')}
                </p>
              )}
            </>
          )}
          {activeTab === 1 && lessonId && (
            <LessonHomeworkSubmissionsTab lessonId={lessonId} />
          )}
        </div>
      </section>

    </div>
  );
}

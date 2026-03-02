import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../../shared/i18n';
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
  BackLink,
  PageHero,
  SectionCard,
  LessonInfoGrid,
  LessonEditModal,
  LessonMaterialModal,
  ConfirmModal,
  HomeworkModal,
  LessonMaterialItemView,
  HomeworkItemView,
  AbsenceNoticesViewDialog,
} from '../../../../shared/ui';
import { getSubjectDisplayName, getStudentDisplayName } from '../../../../shared/lib';
import { ArrowLeft, BookOpen, FileText, ClipboardList, Plus, Pencil, Trash2, Users, FileCheck } from 'lucide-react';

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

/** Только активные заявки (не отозванные студентом). */
function getActiveNotices(notices: LessonRosterNoticeDto[] | undefined): LessonRosterNoticeDto[] {
  return (notices ?? []).filter((n) => n.status !== 'CANCELED');
}

/** Подсветка кнопки заявок по типу активных заявок. */
function getNoticeButtonHighlight(notices: LessonRosterNoticeDto[] | undefined): 'absent' | 'late' | null {
  const active = getActiveNotices(notices);
  if (active.some((n) => n.type === 'ABSENT')) return 'absent';
  if (active.some((n) => n.type === 'LATE')) return 'late';
  return null;
}

function getCountLabel(
  t: (key: string, params?: Record<string, string | number>) => string,
  count: number,
  oneKey: string,
  twoFourKey: string,
  fivePlusKey: string
): string {
  if (count === 1) return t(oneKey);
  if (count >= 2 && count <= 4) return t(twoFourKey, { count });
  return t(fivePlusKey, { count });
}

function getActiveNoticesLabel(
  t: (key: string, params?: Record<string, string | number>) => string,
  activeNotices: LessonRosterNoticeDto[]
): string {
  const absentCount = activeNotices.filter((n) => n.type === 'ABSENT').length;
  const lateCount = activeNotices.filter((n) => n.type === 'LATE').length;
  if (absentCount > 0 && lateCount > 0) {
    return t('attendanceHasNoticesBoth', { absentCount, lateCount });
  }
  if (absentCount > 0) {
    return getCountLabel(
      t,
      absentCount,
      'attendanceHasNoticesAbsentOne',
      'attendanceHasNoticesAbsentTwoFour',
      'attendanceHasNoticesAbsentFivePlus'
    );
  }
  if (lateCount > 0) {
    return getCountLabel(
      t,
      lateCount,
      'attendanceHasNoticesLateOne',
      'attendanceHasNoticesLateTwoFour',
      'attendanceHasNoticesLateFivePlus'
    );
  }
  return '';
}

interface StudentAttendanceRowProps {
  row: LessonRosterAttendanceRowDto;
  t: (key: string) => string;
  getAttendanceStatusLabelKey: (value: string) => string;
  isSavingAttendance: boolean;
  isSavingPoints: boolean;
  onStatusChange: (row: LessonRosterAttendanceRowDto, newStatus: AttendanceStatusValue) => void;
  onPointsBlur: (row: LessonRosterAttendanceRowDto, points: number) => void;
  onOpenNotices: (row: LessonRosterAttendanceRowDto) => void;
}

function StudentAttendanceRow({
  row,
  t,
  getAttendanceStatusLabelKey,
  isSavingAttendance,
  isSavingPoints,
  onStatusChange,
  onPointsBlur,
  onOpenNotices,
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
        <AbsenceNoticeCell
          notices={row.notices}
          t={t}
          onOpen={() => onOpenNotices(row)}
          highlight={getNoticeButtonHighlight(row.notices)}
        />
      </td>
    </tr>
  );
}

function AbsenceNoticeCell({
  notices,
  t,
  onOpen,
  highlight,
}: {
  notices: LessonRosterNoticeDto[];
  t: (key: string) => string;
  onOpen: () => void;
  highlight: 'absent' | 'late' | null;
}) {
  const activeNotices = getActiveNotices(notices);
  const activeCount = activeNotices.length;

  if (activeCount === 0) {
    return <span style={{ color: '#94a3b8' }}>{t('attendanceNoNotice')}</span>;
  }

  const btnClass = [
    'ed-attendance-notice-btn',
    highlight ? `ed-attendance-notice-btn--${highlight}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const label = getActiveNoticesLabel(t, activeNotices);

  return (
    <button
      type="button"
      className={btnClass}
      onClick={onOpen}
      title={label}
    >
      {label}
    </button>
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
  const [noticesDialogRow, setNoticesDialogRow] = useState<LessonRosterAttendanceRowDto | null>(null);

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
    try {
      const res = await getLessonRosterAttendance(lessonId, { includeCanceled: true });
      if (res.error) {
        setAttendanceError(res.error.message ?? tRef.current('attendanceErrorLoad'));
        setRosterData(null);
      } else {
        setRosterData(res.data ?? null);
      }
    } catch (err) {
      setAttendanceError(err instanceof Error ? err.message : tRef.current('attendanceErrorLoad'));
      setRosterData(null);
    } finally {
      setAttendanceLoading(false);
    }
  }, [lessonId]);

  const loadDetails = useCallback(async () => {
    if (!lessonId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
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
        if (lessonRes.status === 404) {
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
      } else if (homeworkRes.error && homeworkRes.error.status !== 404) {
        console.warn('Failed to load homework:', homeworkRes.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tRef.current('teacherSubjectDetailErrorLoad'));
      setData(null);
      setLesson(null);
    } finally {
      setLoading(false);
    }
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

  const handleOpenNotices = useCallback((row: LessonRosterAttendanceRowDto) => {
    setNoticesDialogRow(row);
  }, []);

  const handleCloseNoticesDialog = useCallback(() => {
    setNoticesDialogRow(null);
  }, []);

  const handleNoticeFileDownload = useCallback(
    async (fileId: string) => {
      try {
        const res = await getFileDownloadUrl(fileId);
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

  if (loading) {
    return (
      <div className="entity-view-page department-form-page ed-page">
        <div className="entity-view-card ed-card">
          <p className="ed-empty" style={{ margin: 0 }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (notFound || error) {
    return (
      <div className="entity-view-page department-form-page ed-page">
        <Alert variant="error" role="alert">
          {notFound ? t('teacherSubjectDetailNotFoundMessage') : error}
        </Alert>
        <BackLink to={LESSONS_LIST_PATH} icon={<ArrowLeft size={16} />}>
          {t('lessonDetailsBackToLessons')}
        </BackLink>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { lesson: lessonDetails, subject, room, mainTeacher, offeringSlot, materials } = data;
  const subjectName = getSubjectDisplayName(subject, locale);
  const dateTimeSubtitle =
    lessonDetails.date && lessonDetails.startTime && lessonDetails.endTime
      ? `${lessonDetails.date} ${lessonDetails.startTime.slice(0, 5)} – ${lessonDetails.endTime.slice(0, 5)}`
      : lessonDetails.date ?? '';

  return (
    <div className="entity-view-page department-form-page ed-page">
      <BackLink to={LESSONS_LIST_PATH} icon={<ArrowLeft size={16} />}>
        {t('lessonDetailsBackToLessons')}
      </BackLink>

      <PageHero
        icon={<BookOpen size={28} />}
        title={subjectName}
        subtitle={dateTimeSubtitle}
      >
        <button
          type="button"
          className="btn-secondary"
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={handleEditClick}
          disabled={!lesson}
        >
          <Pencil size={16} aria-hidden />
          {t('lessonDetailsEditLesson')}
        </button>
      </PageHero>

      <SectionCard
        icon={<BookOpen size={18} />}
        title={t('groupSubjectInfoSubject')}
      >
        <LessonInfoGrid
          lesson={lessonDetails}
          subject={subject}
          room={room}
          mainTeacher={mainTeacher}
          offeringSlot={offeringSlot}
          showTeacherTile={true}
        />
      </SectionCard>

      {/* Edit Lesson Modal */}
      {lesson && (
        <LessonEditModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          lesson={lesson}
          rooms={rooms}
          subjectName={getSubjectDisplayName(subject, locale)}
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
      {/* Диалог просмотра заявок студента */}
      <AbsenceNoticesViewDialog
        open={!!noticesDialogRow}
        onClose={handleCloseNoticesDialog}
        studentDisplayName={noticesDialogRow ? getStudentDisplayName(noticesDialogRow.student) : ''}
        notices={noticesDialogRow?.notices ?? []}
        onDownloadFile={handleNoticeFileDownload}
      />

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

      <div className="ed-content-grid">
        <SectionCard
          icon={<FileText size={18} />}
          title={t('lessonDetailsLessonMaterials')}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleAddMaterialClick}
            >
              <Plus size={16} aria-hidden />
              {t('lessonDetailsAddMaterial')}
            </button>
          </div>
          {materials.length === 0 ? (
            <p className="ed-empty">{t('lessonDetailsNoMaterials')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {materials.map((material) => (
                <LessonMaterialItemView
                  key={material.id}
                  material={material}
                  onDownload={handleDownloadFile}
                  onDelete={(file) => handleDeleteFileClick(material, file)}
                  actions={
                    <>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem' }}
                        onClick={() => handleEditMaterialClick(material)}
                        title={t('edit')}
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', color: '#dc2626' }}
                        onClick={() => handleDeleteMaterialClick(material)}
                        title={t('delete')}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<ClipboardList size={18} />}
          title={t('lessonDetailsHomeworkAssignment')}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleAddHomeworkClick}
            >
              <Plus size={16} aria-hidden />
              {t('lessonDetailsAddHomework')}
            </button>
          </div>
          {homeworkList.length === 0 ? (
            <p className="ed-empty">{t('lessonDetailsNoHomework')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {homeworkList.map((hw) => (
                <HomeworkItemView
                  key={hw.id}
                  title={hw.title ?? null}
                  description={hw.description ?? null}
                  points={hw.points ?? null}
                  files={hw.files?.length ? hw.files : hw.file ? [hw.file] : []}
                  onDownload={async (file) => {
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
                  }}
                  actions={
                    <>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem' }}
                        onClick={() => handleEditHomeworkClick(hw)}
                        title={t('edit')}
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', color: '#dc2626' }}
                        onClick={() => handleDeleteHomeworkClick(hw)}
                        title={t('delete')}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        icon={<Users size={18} />}
        title={t('lessonAttendanceCarouselStudents')}
      >
        <div className="ed-lesson-tabs">
          <button
            type="button"
            className={'ed-lesson-tabs__btn' + (activeTab === 0 ? ' ed-lesson-tabs__btn--active' : '')}
            onClick={() => setActiveTab(0)}
          >
            <Users size={18} aria-hidden />
            {t('lessonAttendanceCarouselStudents')}
          </button>
          <button
            type="button"
            className={'ed-lesson-tabs__btn' + (activeTab === 1 ? ' ed-lesson-tabs__btn--active' : '')}
            onClick={() => setActiveTab(1)}
          >
            <FileCheck size={18} aria-hidden />
            {t('lessonHomeworkSubmissionsTab')}
          </button>
        </div>
        <div className="ed-lesson-tabs-content">
          {activeTab === 0 && (
            <>
              {attendanceError && (
                <div style={{ marginBottom: '1rem' }}>
                  <Alert variant="error">{attendanceError}</Alert>
                </div>
              )}
              {attendanceLoading ? (
                <p className="ed-empty" style={{ margin: 0 }}>{t('loading')}</p>
              ) : rosterData?.rows && rosterData.rows.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ed-attendance-table">
                    <thead>
                      <tr>
                        <th>{t('lessonAttendanceCarouselStudents')}</th>
                        <th style={{ minWidth: '140px' }}>{t('attendanceStatusColumn')}</th>
                        <th style={{ width: '100px' }}>{t('homeworkPoints')}</th>
                        <th style={{ minWidth: '140px' }}>{t('attendanceAbsenceNotice')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterData.rows.map((row) => (
                        <StudentAttendanceRow
                          key={row.student.id}
                          row={row}
                          t={t}
                          getAttendanceStatusLabelKey={getAttendanceStatusLabelKey}
                          isSavingAttendance={savingStudentId === row.student.id}
                          isSavingPoints={savingPointsStudentId === row.student.id}
                          onStatusChange={handleAttendanceChange}
                          onPointsBlur={handlePointsBlur}
                          onOpenNotices={handleOpenNotices}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="ed-empty" style={{ margin: 0 }}>
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
      </SectionCard>
    </div>
  );
}

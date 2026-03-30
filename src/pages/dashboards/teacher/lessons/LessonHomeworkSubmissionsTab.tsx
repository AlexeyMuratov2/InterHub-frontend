import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import {
  getLessonHomeworkSubmissions,
  getFileDownloadUrl,
  createGradeEntry,
  updateGradeEntry,
  getStudentOfferingGrades,
  downloadHomeworkSubmissionsArchive,
} from '../../../../shared/api';
import type {
  LessonHomeworkSubmissionsDto,
  StudentHomeworkRowDto,
  StudentHomeworkItemDto,
  CompositionStoredFileDto,
  CompositionHomeworkDto,
  GradeEntryDto,
} from '../../../../shared/api';
import { Alert, Modal, FileCard } from '../../../../shared/ui';
import { getStudentDisplayName, truncate } from '../../../../shared/lib';
import { FileText, Pencil, Download } from 'lucide-react';

export interface LessonHomeworkSubmissionsTabProps {
  lessonId: string;
}

export function LessonHomeworkSubmissionsTab({
  lessonId,
}: LessonHomeworkSubmissionsTabProps) {
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [data, setData] = useState<LessonHomeworkSubmissionsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [filesModalItems, setFilesModalItems] = useState<CompositionStoredFileDto[]>([]);
  const [savingPointsKey, setSavingPointsKey] = useState<string | null>(null);
  const [downloadingArchiveHomeworkId, setDownloadingArchiveHomeworkId] = useState<string | null>(null);

  /** Состояние диалога оценки: при открытии заданы контекст ячейки и данные для формы */
  const [gradeDialog, setGradeDialog] = useState<{
    open: boolean;
    studentId: string;
    studentDisplayName: string;
    homeworkId: string;
    homeworkTitle: string;
    submissionId: string;
    maxPoints: number | null;
    currentPoints: number;
    offeringId: string;
    /** Запись оценки с бэкенда (id, description и др.) — для отображения в диалоге без доп. запроса */
    gradeEntry: GradeEntryDto | null;
  } | null>(null);

  const load = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLessonHomeworkSubmissions(lessonId);
      if (res.error) {
        setError(res.error.message ?? tRef.current('attendanceErrorLoad'));
        setData(null);
      } else {
        setData(res.data ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tRef.current('attendanceErrorLoad'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

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

  const openFilesModal = useCallback((files: CompositionStoredFileDto[]) => {
    setFilesModalItems(files);
    setFilesModalOpen(true);
  }, []);

  const closeFilesModal = useCallback(() => {
    setFilesModalOpen(false);
    setFilesModalItems([]);
  }, []);

  const openGradeDialog = useCallback(
    (
      item: StudentHomeworkItemDto,
      studentId: string,
      studentDisplayName: string,
      homeworkTitle: string,
      maxPoints: number | null,
      offeringId: string
    ) => {
      if (!item.submission) return;
      setGradeDialog({
        open: true,
        studentId,
        studentDisplayName,
        homeworkId: item.homeworkId,
        homeworkTitle,
        submissionId: item.submission.id,
        maxPoints,
        currentPoints: item.points ?? 0,
        offeringId,
        gradeEntry: item.gradeEntry ?? null,
      });
    },
    []
  );

  const closeGradeDialog = useCallback(() => {
    setGradeDialog(null);
  }, []);

  const handleDownloadArchive = useCallback(
    async (homeworkId: string) => {
      if (downloadingArchiveHomeworkId) return;
      setDownloadingArchiveHomeworkId(homeworkId);
      const res = await downloadHomeworkSubmissionsArchive(homeworkId);
      setDownloadingArchiveHomeworkId(null);
      if (res.error) {
        alert(res.error.message ?? tRef.current('teacherSubjectMaterialDownloadError'));
      }
    },
    [downloadingArchiveHomeworkId]
  );

  if (loading) {
    return (
      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>{t('loading')}</p>
    );
  }

  if (error) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { homeworks, studentRows } = data;
  const hasHomeworks = homeworks.length > 0;

  return (
    <>
      {!hasHomeworks ? (
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>
          {t('lessonDetailsNoHomework')}
        </p>
      ) : studentRows.length === 0 ? (
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>
          {t('lessonDetailsNoStudents')}
        </p>
      ) : (
        <div className="app-table-scroll-region">
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9375rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#475569', minWidth: '180px' }}>
                  {t('lessonHomeworkSubmissionsStudent')}
                </th>
                {homeworks.map((hw) => (
                  <th
                    key={hw.id}
                    colSpan={3}
                    style={{
                      padding: '0.75rem 0.5rem',
                      fontWeight: 600,
                      color: '#475569',
                      borderLeft: '1px solid #e2e8f0',
                      verticalAlign: 'top',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span>{hw.title?.trim() || t('homeworkUntitled')}</span>
                      <button
                        type="button"
                        onClick={() => handleDownloadArchive(hw.id)}
                        disabled={downloadingArchiveHomeworkId !== null}
                        title={t('lessonHomeworkSubmissionsDownloadArchive')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.5rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: downloadingArchiveHomeworkId === hw.id ? '#f1f5f9' : '#f8fafc',
                          cursor: downloadingArchiveHomeworkId !== null ? 'wait' : 'pointer',
                          fontSize: '0.8125rem',
                          color: '#475569',
                        }}
                      >
                        <Download
                          style={{
                            width: '0.875rem',
                            height: '0.875rem',
                            flexShrink: 0,
                          }}
                        />
                        {t('lessonHomeworkSubmissionsDownloadArchive')}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.5rem', fontWeight: 500, color: '#64748b', fontSize: '0.8125rem' }} />
                {homeworks.flatMap((hw) => [
                  <th
                    key={`${hw.id}-files`}
                    style={{
                      padding: '0.5rem 0.5rem',
                      fontWeight: 500,
                      color: '#64748b',
                      fontSize: '0.8125rem',
                      borderLeft: '1px solid #e2e8f0',
                    }}
                  >
                    {t('lessonHomeworkSubmissionsFiles')}
                  </th>,
                  <th
                    key={`${hw.id}-points`}
                    style={{
                      padding: '0.5rem 0.5rem',
                      fontWeight: 500,
                      color: '#64748b',
                      fontSize: '0.8125rem',
                      borderLeft: '1px solid #e2e8f0',
                    }}
                  >
                    {t('homeworkPoints')}
                  </th>,
                  <th
                    key={`${hw.id}-description`}
                    style={{
                      padding: '0.5rem 0.5rem',
                      fontWeight: 500,
                      color: '#64748b',
                      fontSize: '0.8125rem',
                      borderLeft: '1px solid #e2e8f0',
                    }}
                  >
                    {t('lessonHomeworkSubmissionsDescription')}
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {studentRows.map((row) => (
                <StudentHomeworkRow
                  key={row.student.id}
                  row={row}
                  homeworks={homeworks}
                  offeringId={data.lesson.offeringId}
                  t={t}
                  locale={locale}
                  onDownloadFile={handleDownloadFile}
                  onOpenFilesModal={openFilesModal}
                  onOpenGradeDialog={openGradeDialog}
                  savingPointsKey={savingPointsKey}
                  setSavingPointsKey={setSavingPointsKey}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={filesModalOpen}
        onClose={closeFilesModal}
        title={t('lessonHomeworkSubmissionsFilesModalTitle')}
        variant="default"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filesModalItems.map((file) => (
            <FileCard
              key={file.id}
              title={file.originalName?.trim() || t('lessonMaterialFile')}
              size={file.size}
              uploadedAt={file.uploadedAt}
              description={file.contentType || undefined}
              onDownload={() => handleDownloadFile(file)}
            />
          ))}
        </div>
      </Modal>

      {gradeDialog && (
        <HomeworkGradeDialog
          open={gradeDialog.open}
          lessonId={lessonId}
          studentId={gradeDialog.studentId}
          studentDisplayName={gradeDialog.studentDisplayName}
          homeworkTitle={gradeDialog.homeworkTitle}
          submissionId={gradeDialog.submissionId}
          maxPoints={gradeDialog.maxPoints}
          initialPoints={gradeDialog.currentPoints}
          offeringId={gradeDialog.offeringId}
          initialGradeEntry={gradeDialog.gradeEntry}
          onClose={closeGradeDialog}
          onSaved={load}
          t={t}
        />
      )}
    </>
  );
}

interface StudentHomeworkRowProps {
  row: StudentHomeworkRowDto;
  homeworks: CompositionHomeworkDto[];
  offeringId: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  onDownloadFile: (file: CompositionStoredFileDto) => void;
  onOpenFilesModal: (files: CompositionStoredFileDto[]) => void;
  onOpenGradeDialog: (
    item: StudentHomeworkItemDto,
    studentId: string,
    studentDisplayName: string,
    homeworkTitle: string,
    maxPoints: number | null,
    offeringId: string
  ) => void;
  savingPointsKey: string | null;
  setSavingPointsKey: (key: string | null) => void;
}

function StudentHomeworkRow({
  row,
  homeworks,
  offeringId,
  t,
  locale,
  onDownloadFile,
  onOpenFilesModal,
  onOpenGradeDialog,
  savingPointsKey,
  setSavingPointsKey,
}: StudentHomeworkRowProps) {
  const displayName = getStudentDisplayName(row.student);
  /** UUID для API (POST /api/grades/entries и др.); бэкенд ожидает studentId = StudentDto.id */
  const studentIdForApi = row.student.id;
  const displayId = row.student.studentId;

  return (
    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
      <td
        style={{
          padding: '0.75rem 0.5rem',
          fontWeight: 500,
          color: '#0f172a',
          verticalAlign: 'top',
        }}
      >
        <div>{displayName}</div>
        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
          ID: {displayId}
        </div>
      </td>
      {row.items.map((item, idx) => (
        <HomeworkItemCells
          key={item.homeworkId}
          item={item}
          maxPoints={homeworks[idx]?.points ?? null}
          homeworkTitle={homeworks[idx]?.title?.trim() || t('homeworkUntitled')}
          offeringId={offeringId}
          studentId={studentIdForApi}
          studentDisplayName={displayName}
          t={t}
          locale={locale}
          onDownloadFile={onDownloadFile}
          onOpenFilesModal={onOpenFilesModal}
          onOpenGradeDialog={onOpenGradeDialog}
          savingPointsKey={savingPointsKey}
          setSavingPointsKey={setSavingPointsKey}
        />
      ))}
    </tr>
  );
}

interface HomeworkItemCellsProps {
  item: StudentHomeworkItemDto;
  maxPoints: number | null;
  homeworkTitle: string;
  offeringId: string;
  studentId: string;
  studentDisplayName: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  onDownloadFile: (file: CompositionStoredFileDto) => void;
  onOpenFilesModal: (files: CompositionStoredFileDto[]) => void;
  onOpenGradeDialog: (
    item: StudentHomeworkItemDto,
    studentId: string,
    studentDisplayName: string,
    homeworkTitle: string,
    maxPoints: number | null,
    offeringId: string
  ) => void;
  savingPointsKey: string | null;
  setSavingPointsKey: (key: string | null) => void;
}

const DESCRIPTION_TRUNCATE_LEN = 80;
const INTL_LOCALE_MAP: Record<string, string> = { en: 'en-US', ru: 'ru-RU', 'zh-Hans': 'zh-CN' };

function formatShortDateTime(iso: string, locale: string): string {
  try {
    const intlLocale = INTL_LOCALE_MAP[locale] ?? locale;
    return new Date(iso).toLocaleString(intlLocale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function HomeworkItemCells({
  item,
  maxPoints,
  homeworkTitle,
  offeringId,
  studentId,
  studentDisplayName,
  t,
  locale,
  onDownloadFile,
  onOpenFilesModal,
  onOpenGradeDialog,
  savingPointsKey,
  setSavingPointsKey: _setSavingPointsKey,
}: HomeworkItemCellsProps) {
  const { homeworkId, submission, points, files } = item;
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const saveKey = `${studentId}:${homeworkId}`;
  const isSaving = savingPointsKey === saveKey;
  const canOpenGradeDialog = Boolean(submission);

  const handleOpenGradeDialog = useCallback(() => {
    if (!submission || isSaving) return;
    onOpenGradeDialog(item, studentId, studentDisplayName, homeworkTitle, maxPoints, offeringId);
  }, [submission, isSaving, item, studentId, studentDisplayName, homeworkTitle, maxPoints, offeringId, onOpenGradeDialog]);

  const desc = submission?.description?.trim() ?? '';
  const isLongDesc = desc.length > DESCRIPTION_TRUNCATE_LEN;
  const displayDesc = !desc ? '—' : (descriptionExpanded ? desc : truncate(desc, DESCRIPTION_TRUNCATE_LEN));

  return (
    <>
      <td
        style={{
          padding: '0.75rem 0.5rem',
          borderLeft: '1px solid #e2e8f0',
          verticalAlign: 'top',
        }}
      >
        {files.length === 0 ? (
          <span style={{ color: '#94a3b8' }}>—</span>
        ) : files.length === 1 ? (
          <button
            type="button"
            onClick={() => onDownloadFile(files[0])}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.5rem',
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#3b82f6',
            }}
          >
            <FileText style={{ width: '1rem', height: '1rem' }} />
            {files[0].originalName?.trim() || t('lessonMaterialFile')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenFilesModal(files)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.5rem',
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#3b82f6',
            }}
          >
            <FileText style={{ width: '1rem', height: '1rem' }} />
            {t('lessonHomeworkSubmissionsFilesCount', { count: files.length })}
          </button>
        )}
      </td>
      <td
        style={{
          padding: '0.75rem 0.5rem',
          borderLeft: '1px solid #e2e8f0',
          verticalAlign: 'top',
        }}
      >
        {canOpenGradeDialog ? (
          <button
            type="button"
            onClick={handleOpenGradeDialog}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.5rem',
              minWidth: '4.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              background: points != null && points > 0 ? '#f0fdf4' : '#f8fafc',
              cursor: isSaving ? 'wait' : 'pointer',
              fontSize: '0.9375rem',
              color: submission ? '#0f172a' : '#94a3b8',
              textAlign: 'left',
            }}
            title={t('lessonHomeworkSubmissionsGradeClickToEdit')}
          >
            {points != null ? String(points) : '—'}
            <Pencil style={{ width: '0.875rem', height: '0.875rem', color: '#64748b', flexShrink: 0 }} />
          </button>
        ) : (
          <span style={{ color: submission ? '#0f172a' : '#94a3b8' }}>
            {submission ? (points != null ? String(points) : '—') : '—'}
          </span>
        )}
      </td>
      <td
        style={{
          padding: '0.75rem 0.5rem',
          borderLeft: '1px solid #e2e8f0',
          verticalAlign: 'top',
          minWidth: '140px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.25rem',
          }}
        >
          <div
            style={{
              width: '100%',
              fontSize: '0.875rem',
              color: submission ? '#334155' : '#94a3b8',
              textAlign: 'left',
              lineHeight: 1.4,
            }}
          >
            {displayDesc}
            {isLongDesc && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                style={{
                  marginLeft: '0.375rem',
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  color: '#3b82f6',
                }}
              >
                {descriptionExpanded ? t('lessonHomeworkSubmissionsShowLess') : t('lessonHomeworkSubmissionsShowFull')}
              </button>
            )}
          </div>
          {submission?.submittedAt && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}
            >
              {formatShortDateTime(submission.submittedAt, locale)}
            </span>
          )}
        </div>
      </td>
    </>
  );
}

// --- Homework grade dialog (set / edit grade with description) ---

interface HomeworkGradeDialogProps {
  open: boolean;
  lessonId: string;
  studentId: string;
  studentDisplayName: string;
  homeworkTitle: string;
  submissionId: string;
  maxPoints: number | null;
  initialPoints: number;
  offeringId: string;
  /** Запись оценки с эндпоинта homework-submissions — сразу подставляем баллы и описание в форму */
  initialGradeEntry: GradeEntryDto | null;
  onClose: () => void;
  onSaved: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function HomeworkGradeDialog({
  open,
  lessonId,
  studentId,
  studentDisplayName,
  homeworkTitle,
  submissionId,
  maxPoints,
  initialPoints,
  offeringId,
  initialGradeEntry,
  onClose,
  onSaved,
  t,
}: HomeworkGradeDialogProps) {
  const [formPoints, setFormPoints] = useState(initialPoints);
  const [formDescription, setFormDescription] = useState('');
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormPoints(initialPoints);
    setFormDescription('');
    setExistingEntryId(null);
    setError(null);
    if (!open) return;
    if (initialGradeEntry) {
      setExistingEntryId(initialGradeEntry.id);
      setFormPoints(initialGradeEntry.points ?? initialPoints);
      setFormDescription(initialGradeEntry.description ?? '');
      return;
    }
    setLoadingEntry(true);
    getStudentOfferingGrades(studentId, offeringId)
      .then((res) => {
        if (res.error || !res.data) return;
        const entry = res.data.entries.find(
          (e) => e.homeworkSubmissionId === submissionId
        );
        if (entry) {
          setExistingEntryId(entry.id);
          setFormPoints(entry.points ?? initialPoints);
          setFormDescription(entry.description ?? '');
        }
      })
      .finally(() => setLoadingEntry(false));
  }, [open, studentId, offeringId, submissionId, initialPoints, initialGradeEntry]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSaving(true);
      const points = Number(formPoints);
      const description = formDescription.trim() || null;
      if (existingEntryId) {
        const res = await updateGradeEntry(existingEntryId, {
          points,
          description,
        });
        if (res.error) {
          setError(res.error.message ?? t('attendanceSaveError'));
          setSaving(false);
          return;
        }
      } else {
        const res = await createGradeEntry({
          studentId,
          offeringId,
          points,
          typeCode: 'HOMEWORK',
          description,
          lessonSessionId: lessonId,
          homeworkSubmissionId: submissionId,
        });
        if (res.error) {
          setError(res.error.message ?? t('attendanceSaveError'));
          setSaving(false);
          return;
        }
      }
      setSaving(false);
      onSaved();
      onClose();
    },
    [
      formPoints,
      formDescription,
      existingEntryId,
      studentId,
      offeringId,
      lessonId,
      submissionId,
      onSaved,
      onClose,
      t,
    ]
  );

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('lessonHomeworkSubmissionsGradeDialogTitle')}
      variant="form"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          {studentDisplayName} · {homeworkTitle}
        </p>
        {error && (
          <Alert variant="error">{error}</Alert>
        )}
        {loadingEntry ? (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>{t('loading')}</p>
        ) : (
          <>
            <div>
              <label htmlFor="hw-grade-points" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                {t('homeworkPoints')}
                {maxPoints != null && (
                  <span style={{ fontWeight: 400, color: '#64748b', marginLeft: '0.25rem' }}>
                    ({t('lessonHomeworkSubmissionsGradeMax')} {maxPoints})
                  </span>
                )}
              </label>
              <input
                id="hw-grade-points"
                type="number"
                min={0}
                max={maxPoints ?? undefined}
                step={0.01}
                className="form-control"
                value={formPoints}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  const num = raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0);
                  setFormPoints(num);
                }}
                disabled={saving}
                style={{ width: '8rem', padding: '0.5rem' }}
              />
            </div>
            <div>
              <label htmlFor="hw-grade-desc" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                {t('lessonHomeworkSubmissionsGradeDescription')}
              </label>
              <textarea
                id="hw-grade-desc"
                className="form-control"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                disabled={saving}
                rows={3}
                maxLength={2000}
                placeholder={t('lessonHomeworkSubmissionsGradeDescriptionPlaceholder')}
                style={{ width: '100%', padding: '0.5rem', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={saving}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

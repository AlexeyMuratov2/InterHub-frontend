import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getLessonHomeworkSubmissions, getFileDownloadUrl } from '../../../../shared/api';
import type {
  LessonHomeworkSubmissionsDto,
  StudentHomeworkRowDto,
  StudentHomeworkItemDto,
  CompositionStoredFileDto,
  CompositionHomeworkDto,
} from '../../../../shared/api';
import { Alert, Modal, FileCard } from '../../../../shared/ui';
import { getStudentDisplayName } from '../../../../shared/lib';
import { FileText } from 'lucide-react';

export interface LessonHomeworkSubmissionsTabProps {
  lessonId: string;
  /** Вызов при потере фокуса поля баллов (если не передан, поле только для чтения) */
  onPointsBlur?: (
    studentId: string,
    homeworkId: string,
    submissionId: string | null,
    points: number
  ) => Promise<void>;
}

export function LessonHomeworkSubmissionsTab({
  lessonId,
  onPointsBlur,
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

  const load = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    const res = await getLessonHomeworkSubmissions(lessonId);
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? tRef.current('attendanceErrorLoad'));
      setData(null);
    } else {
      setData(res.data ?? null);
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
                    }}
                  >
                    {hw.title?.trim() || t('homeworkUntitled')}
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
                    key={`${hw.id}-submitted`}
                    style={{
                      padding: '0.5rem 0.5rem',
                      fontWeight: 500,
                      color: '#64748b',
                      fontSize: '0.8125rem',
                      borderLeft: '1px solid #e2e8f0',
                    }}
                  >
                    {t('lessonHomeworkSubmissionsSubmittedAt')}
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
                  t={t}
                  locale={locale}
                  onDownloadFile={handleDownloadFile}
                  onOpenFilesModal={openFilesModal}
                  onPointsBlur={onPointsBlur}
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
    </>
  );
}

interface StudentHomeworkRowProps {
  row: StudentHomeworkRowDto;
  homeworks: CompositionHomeworkDto[];
  t: (key: string) => string;
  locale: string;
  onDownloadFile: (file: CompositionStoredFileDto) => void;
  onOpenFilesModal: (files: CompositionStoredFileDto[]) => void;
  onPointsBlur?: (
    studentId: string,
    homeworkId: string,
    submissionId: string | null,
    points: number
  ) => Promise<void>;
  savingPointsKey: string | null;
  setSavingPointsKey: (key: string | null) => void;
}

function StudentHomeworkRow({
  row,
  homeworks,
  t,
  locale,
  onDownloadFile,
  onOpenFilesModal,
  onPointsBlur,
  savingPointsKey,
  setSavingPointsKey,
}: StudentHomeworkRowProps) {
  const displayName = getStudentDisplayName(row.student);
  const studentId = row.student.id;

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
          ID: {studentId}
        </div>
      </td>
      {row.items.map((item, idx) => (
        <HomeworkItemCells
          key={item.homeworkId}
          item={item}
          maxPoints={homeworks[idx]?.points ?? null}
          t={t}
          locale={locale}
          studentId={studentId}
          onDownloadFile={onDownloadFile}
          onOpenFilesModal={onOpenFilesModal}
          onPointsBlur={onPointsBlur}
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
  t: (key: string) => string;
  locale: string;
  studentId: string;
  onDownloadFile: (file: CompositionStoredFileDto) => void;
  onOpenFilesModal: (files: CompositionStoredFileDto[]) => void;
  onPointsBlur?: (
    studentId: string,
    homeworkId: string,
    submissionId: string | null,
    points: number
  ) => Promise<void>;
  savingPointsKey: string | null;
  setSavingPointsKey: (key: string | null) => void;
}

function HomeworkItemCells({
  item,
  maxPoints,
  t,
  locale,
  studentId,
  onDownloadFile,
  onOpenFilesModal,
  onPointsBlur,
  savingPointsKey,
  setSavingPointsKey,
}: HomeworkItemCellsProps) {
  const { homeworkId, submission, points, files } = item;
  const [localPoints, setLocalPoints] = useState(points ?? 0);

  useEffect(() => {
    setLocalPoints(points ?? 0);
  }, [points]);

  const saveKey = `${studentId}:${homeworkId}`;
  const isSaving = savingPointsKey === saveKey;
  const canEditPoints = Boolean(onPointsBlur && submission);

  const handlePointsBlur = useCallback(() => {
    if (!onPointsBlur || !submission) return;
    const num = localPoints;
    if (num === (points ?? 0)) return;
    setSavingPointsKey(saveKey);
    onPointsBlur(studentId, homeworkId, submission.id, num)
      .catch((err) => {
        alert(err?.message ?? t('attendanceSaveError'));
      })
      .finally(() => {
        setSavingPointsKey(null);
      });
  }, [onPointsBlur, submission, localPoints, points, studentId, homeworkId, saveKey, t, setSavingPointsKey]);

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
        {canEditPoints ? (
          <input
            type="number"
            min={0}
            max={maxPoints ?? undefined}
            step={0.01}
            className="form-control"
            value={localPoints}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const num = raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0);
              setLocalPoints(num);
            }}
            onBlur={handlePointsBlur}
            disabled={isSaving}
            style={{ width: '4.5rem', padding: '0.375rem 0.5rem' }}
          />
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
          fontSize: '0.875rem',
          color: '#475569',
          verticalAlign: 'top',
        }}
      >
        {submission?.submittedAt
          ? formatDateTime(submission.submittedAt, locale as 'ru' | 'en' | 'zh-Hans')
          : '—'}
      </td>
    </>
  );
}

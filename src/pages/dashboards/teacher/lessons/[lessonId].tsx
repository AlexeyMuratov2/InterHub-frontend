import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation, formatDate, formatTime } from '../../../../shared/i18n';
import { getLessonFullDetails, getFileDownloadUrl } from '../../../../shared/api';
import type {
  LessonFullDetailsDto,
  CompositionStoredFileDto,
  CompositionLessonMaterialDto,
} from '../../../../shared/api';
import {
  Alert,
  FileCard,
} from '../../../../shared/ui';
import {
  getSubjectDisplayName,
  getTeacherDisplayName,
  getLessonTypeDisplayKey,
  isNonStandardLessonStatus,
  getLessonStatusDisplayKey,
  formatCompositionRoomLine,
} from '../../../../shared/lib';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';

const LESSONS_LIST_PATH = '/dashboards/teacher/lessons';

export function LessonFullDetailsPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [data, setData] = useState<LessonFullDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    const res = await getLessonFullDetails(lessonId);
    if (res.error) {
      if (res.status === 404 || res.error.status === 404) {
        setNotFound(true);
      } else {
        setError(res.error.message ?? tRef.current('teacherSubjectDetailErrorLoad'));
      }
      setData(null);
    } else {
      setData(res.data ?? null);
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

  const { lesson, subject, room, mainTeacher, offeringSlot, materials, homework } = data;
  const subjectName = getSubjectDisplayName(subject, locale);
  const teacherDisplay = mainTeacher ? getTeacherDisplayName(mainTeacher) : '—';
  const roomDisplay = formatCompositionRoomLine(room);
  const dateTimeLine = [
    formatDate(lesson.date, locale),
    lesson.startTime && lesson.endTime
      ? `${formatTime(`${lesson.date}T${lesson.startTime}`, locale)} – ${formatTime(`${lesson.date}T${lesson.endTime}`, locale)}`
      : `${lesson.startTime?.slice(0, 5) ?? ''} – ${lesson.endTime?.slice(0, 5) ?? ''}`,
  ].filter(Boolean).join(' • ');
  const showStatus = isNonStandardLessonStatus(lesson.status);
  const statusKey = getLessonStatusDisplayKey(lesson.status);
  const lessonTypeKey = getLessonTypeDisplayKey(offeringSlot?.lessonType ?? null);

  const allFiles: { file: CompositionStoredFileDto; material: CompositionLessonMaterialDto }[] = [];
  materials.forEach((mat) => {
    mat.files.forEach((f) => allFiles.push({ file: f, material: mat }));
  });

  const firstHomework = homework[0] ?? null;

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
        {lesson.topic?.trim() && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.9375rem', color: '#475569' }}>{lesson.topic.trim()}</p>
        )}
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => {}}
          >
            <Pencil style={{ width: '1rem', height: '1rem' }} aria-hidden />
            {t('lessonDetailsEditLesson')}
          </button>
        </div>
      </section>

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
              onClick={() => {}}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} aria-hidden />
              {t('lessonDetailsAddMaterial')}
            </button>
          </div>
          {allFiles.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>{t('lessonDetailsNoMaterials')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {allFiles.map(({ file, material }) => (
                <FileCard
                  key={file.id}
                  title={file.originalName?.trim() || material.name?.trim() || 'File'}
                  size={file.size}
                  uploadedAt={file.uploadedAt}
                  onDownload={() => handleDownloadFile(file)}
                  onDelete={undefined}
                />
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
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => {}}
            >
              <Pencil style={{ width: '1rem', height: '1rem' }} aria-hidden />
              {t('lessonDetailsEditHomework')}
            </button>
          </div>
          {!firstHomework ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>{t('lessonDetailsNoHomework')}</p>
          ) : (
            <div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                {firstHomework.title?.trim() || '—'}
              </h3>
              {firstHomework.description?.trim() && (
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem', color: '#475569', lineHeight: 1.5 }}>
                  {firstHomework.description.trim()}
                </p>
              )}
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                {t('lessonDetailsDueDate')}: {formatDate(firstHomework.updatedAt, locale)}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

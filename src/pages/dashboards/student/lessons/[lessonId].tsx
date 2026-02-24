import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../../../../shared/i18n';
import { getLessonFullDetails, getFileDownloadUrl } from '../../../../shared/api';
import type { LessonFullDetailsDto, CompositionStoredFileDto } from '../../../../shared/api';
import { Alert, LessonOverviewCard, LessonMaterialItemView, HomeworkItemView } from '../../../../shared/ui';
import { ArrowLeft } from 'lucide-react';

const LESSONS_BACK_PATH = '/dashboards/student/schedule';

export function StudentLessonFullDetailsPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { t } = useTranslation('dashboard');
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

    const detailsRes = await getLessonFullDetails(lessonId);

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
        <Link
          to={LESSONS_BACK_PATH}
          className="btn-secondary"
          style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
          {t('lessonDetailsBackToLessons')}
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { lesson: lessonDetails, subject, room, mainTeacher, offeringSlot, materials, homework } = data;

  return (
    <div className="entity-view-page department-form-page">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={LESSONS_BACK_PATH}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} aria-hidden />
          {t('lessonDetailsBackToLessons')}
        </Link>
      </div>

      <LessonOverviewCard
        lesson={lessonDetails}
        subject={subject}
        room={room}
        mainTeacher={mainTeacher}
        offeringSlot={offeringSlot}
      />

      {/* Две колонки: Материалы | Домашние задания — как на странице преподавателя, только без кнопок добавления/редактирования/удаления */}
      <div className="lesson-details-grid">
        {/* Материалы урока — только скачивание */}
        <section className="entity-view-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="entity-view-card-title" style={{ margin: 0 }}>
              {t('lessonDetailsLessonMaterials')}
            </h2>
          </div>
          {materials.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>
              {t('lessonDetailsNoMaterials')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {materials.map((material) => (
                <LessonMaterialItemView
                  key={material.id}
                  material={material}
                  onDownload={handleDownloadFile}
                />
              ))}
            </div>
          )}
        </section>

        {/* Домашние задания — только просмотр и скачивание файлов */}
        <section className="entity-view-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="entity-view-card-title" style={{ margin: 0 }}>
              {t('lessonDetailsHomeworkAssignment')}
            </h2>
          </div>
          {homework.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>
              {t('lessonDetailsNoHomework')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {homework.map((hw) => (
                <HomeworkItemView
                  key={hw.id}
                  title={hw.title}
                  description={hw.description}
                  points={hw.points}
                  files={hw.files ?? []}
                  onDownload={handleDownloadFile}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

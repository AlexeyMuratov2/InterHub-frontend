import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, FileText, ClipboardList, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import { getLessonFullDetails, getFileDownloadUrl } from '../../../../shared/api';
import type { LessonFullDetailsDto, CompositionStoredFileDto } from '../../../../shared/api';
import { getSubjectDisplayName } from '../../../../shared/lib';
import {
  Alert,
  BackLink,
  PageHero,
  SectionCard,
  LessonInfoGrid,
  LessonMaterialDetailView,
  HomeworkDetailView,
} from '../../../../shared/ui';

const LESSONS_BACK_PATH = '/dashboards/student/schedule';

export function StudentLessonFullDetailsPage() {
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

  const { lesson, subject, room, mainTeacher, offeringSlot, materials, homework } = data;
  const subjectName = getSubjectDisplayName(subject, locale);
  const dateTimeSubtitle =
    lesson.date && lesson.startTime && lesson.endTime
      ? `${lesson.date} ${lesson.startTime.slice(0, 5)} – ${lesson.endTime.slice(0, 5)}`
      : lesson.date ?? '';

  return (
    <div className="entity-view-page department-form-page ed-page">
      <BackLink to={LESSONS_BACK_PATH} icon={<ArrowLeft size={16} />}>
        {t('lessonDetailsBackToLessons')}
      </BackLink>

      <PageHero
        icon={<BookOpen size={28} />}
        title={subjectName}
        subtitle={dateTimeSubtitle}
      />

      <SectionCard
        icon={<BookOpen size={18} />}
        title={t('groupSubjectInfoSubject')}
      >
        <LessonInfoGrid
          lesson={lesson}
          subject={subject}
          room={room}
          mainTeacher={mainTeacher}
          offeringSlot={offeringSlot}
        />
      </SectionCard>

      <div className="ed-content-grid">
        <SectionCard
          icon={<FileText size={18} />}
          title={t('lessonDetailsLessonMaterials')}
        >
          {materials.length === 0 ? (
            <p className="ed-empty">{t('lessonDetailsNoMaterials')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {materials.map((material) => (
                <LessonMaterialDetailView
                  key={material.id}
                  material={material}
                  onDownload={handleDownloadFile}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<ClipboardList size={18} />}
          title={t('lessonDetailsHomeworkAssignment')}
        >
          {homework.length === 0 ? (
            <p className="ed-empty">{t('lessonDetailsNoHomework')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {homework.map((hw) => (
                <HomeworkDetailView
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
        </SectionCard>
      </div>
    </div>
  );
}

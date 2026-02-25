import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, FileText, ClipboardList, ArrowLeft, UserRound } from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import type { Locale } from '../../../../shared/i18n';
import { getLessonFullDetails, getFileDownloadUrl } from '../../../../shared/api';
import type {
  LessonFullDetailsDto,
  CompositionStoredFileDto,
  StudentSubjectTeacherItemDto,
  CompositionTeacherDto,
} from '../../../../shared/api';
import { getSubjectDisplayName, getTeacherDisplayName } from '../../../../shared/lib';
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

function getTeacherRoleKey(role: string | null): string {
  switch (role) {
    case 'MAIN':
      return 'studentSubjectInfoTeacherRoleMain';
    case 'LECTURE':
      return 'studentSubjectInfoTeacherRoleLecture';
    case 'PRACTICE':
      return 'studentSubjectInfoTeacherRolePractice';
    case 'LAB':
      return 'studentSubjectInfoTeacherRoleLab';
    case 'SEMINAR':
      return 'studentSubjectInfoTeacherRoleSeminar';
    default:
      return 'studentSubjectInfoTeacherRoleMain';
  }
}

function getTeacherName(
  item: StudentSubjectTeacherItemDto,
  _locale: Locale,
): string {
  if (item.user) {
    const parts = [item.user.firstName, item.user.lastName].filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return getTeacherDisplayName({
    englishName: item.teacher.englishName,
    teacherId: item.teacher.teacherId,
  });
}

function LessonTeacherCard({
  item,
  t,
  locale,
}: {
  item: StudentSubjectTeacherItemDto;
  t: (key: string) => string;
  locale: Locale;
}) {
  const name = getTeacherName(item, locale);
  const roleKey = getTeacherRoleKey(item.role);
  return (
    <div className="ed-teacher-card">
      <div className="ed-teacher-avatar">
        <UserRound size={20} />
      </div>
      <div className="ed-teacher-info">
        <span className="ed-teacher-name">{name}</span>
        <span className="ed-teacher-role">{t(roleKey)}</span>
        {item.teacher.position && (
          <span className="ed-teacher-position">{item.teacher.position}</span>
        )}
      </div>
    </div>
  );
}

/** Список преподавателей для отображения: teachers из API или один элемент из mainTeacher. */
function getTeachersToShow(data: LessonFullDetailsDto): StudentSubjectTeacherItemDto[] {
  if (data.teachers?.length) return data.teachers;
  if (data.mainTeacher) {
    return [
      {
        teacher: data.mainTeacher as CompositionTeacherDto,
        user: null,
        role: 'MAIN',
      },
    ];
  }
  return [];
}

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
  const teachersToShow = getTeachersToShow(data);

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
          showTeacherTile={false}
        />
      </SectionCard>

      <SectionCard
        icon={<UserRound size={18} />}
        title={t('studentSubjectInfoTeachersTitle')}
      >
        {teachersToShow.length === 0 ? (
          <p className="ed-empty">{t('studentSubjectInfoNoTeachers')}</p>
        ) : (
          <div className="ed-teachers-list">
            {teachersToShow.map((item) => (
              <LessonTeacherCard
                key={item.teacher.id}
                item={item}
                t={t}
                locale={locale}
              />
            ))}
          </div>
        )}
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

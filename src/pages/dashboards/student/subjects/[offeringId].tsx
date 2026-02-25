import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  FileText,
  BarChart3,
  UserRound,
} from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import type { Locale } from '../../../../shared/i18n';
import { getStudentSubjectInfo, getFileDownloadUrl } from '../../../../shared/api';
import type {
  StudentSubjectInfoDto,
  StudentSubjectTeacherItemDto,
  GroupSubjectOfferingSlotDto,
} from '../../../../shared/api';
import {
  Alert,
  BackLink,
  PageHero,
  SectionCard,
  InfoTile,
  DetailMaterialRow,
  StatCard,
} from '../../../../shared/ui';
import {
  getSubjectDisplayName,
  getTeacherDisplayName,
} from '../../../../shared/lib';

const SUBJECTS_BACK_PATH = '/dashboards/student/subjects';

const DAY_KEYS = [
  '', // 0 unused
  'studentSubjectInfoDayMon',
  'studentSubjectInfoDayTue',
  'studentSubjectInfoDayWed',
  'studentSubjectInfoDayThu',
  'studentSubjectInfoDayFri',
  'studentSubjectInfoDaySat',
  'studentSubjectInfoDaySun',
] as const;

function formatSlotTime(start: string, end: string): string {
  return `${start.slice(0, 5)}–${end.slice(0, 5)}`;
}

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

function getFormatKey(format: string | null): string | null {
  switch (format) {
    case 'OFFLINE':
      return 'studentSubjectInfoFormatOffline';
    case 'ONLINE':
      return 'studentSubjectInfoFormatOnline';
    case 'MIXED':
      return 'studentSubjectInfoFormatMixed';
    default:
      return null;
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

export function StudentSubjectInfoPage() {
  const { offeringId } = useParams<{ offeringId: string }>();
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [data, setData] = useState<StudentSubjectInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!offeringId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    const res = await getStudentSubjectInfo(offeringId);
    if (res.error) {
      if (res.status === 404 || res.error.status === 404) {
        setNotFound(true);
      } else {
        setError(res.error.message ?? tRef.current('studentSubjectInfoErrorLoad'));
      }
      setData(null);
    } else {
      setData(res.data ?? null);
    }
    setLoading(false);
  }, [offeringId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownloadFile = useCallback(async (fileId: string) => {
    try {
      const res = await getFileDownloadUrl(fileId);
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch {
      /* noop */
    }
  }, []);

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
          {notFound ? t('studentSubjectInfoNotFound') : error}
        </Alert>
        <BackLink to={SUBJECTS_BACK_PATH} icon={<ArrowLeft size={16} />}>
          {t('studentSubjectInfoBackToSubjects')}
        </BackLink>
      </div>
    );
  }

  if (!data) return null;

  const subjectName = getSubjectDisplayName(data.subject, locale);
  const cs = data.curriculumSubject;
  const formatKey = getFormatKey(data.offering.format);

  return (
    <div className="entity-view-page department-form-page ed-page">
      <BackLink to={SUBJECTS_BACK_PATH} icon={<ArrowLeft size={16} />}>
        {t('studentSubjectInfoBackToSubjects')}
      </BackLink>

      <PageHero
        icon={<GraduationCap size={28} />}
        title={subjectName}
        subtitle={data.subject.code ?? undefined}
        meta={data.departmentName ?? undefined}
      />

      <SectionCard
        icon={<BookOpen size={18} />}
        title={t('studentSubjectInfoSubjectTitle')}
      >
        <div className="ed-info-grid">
          <InfoTile
            label={t('studentSubjectInfoSemester')}
            value={String(cs.semesterNo)}
          />
          {cs.courseYear != null && (
            <InfoTile
              label={t('studentSubjectInfoCourseYear')}
              value={String(cs.courseYear)}
            />
          )}
          <InfoTile
            label={t('studentSubjectInfoDurationWeeks')}
            value={t('studentSubjectInfoWeeks', { count: cs.durationWeeks })}
          />
          {cs.credits != null && (
            <InfoTile
              label={t('studentSubjectInfoCredits')}
              value={String(cs.credits)}
            />
          )}
          {cs.hoursTotal != null && (
            <InfoTile
              label={t('studentSubjectInfoTotalHours')}
              value={String(cs.hoursTotal)}
            />
          )}
          {formatKey && (
            <InfoTile
              label={t('studentSubjectInfoFormat')}
              value={t(formatKey)}
            />
          )}
        </div>
      </SectionCard>

      <SectionCard
        icon={<UserRound size={18} />}
        title={t('studentSubjectInfoTeachersTitle')}
      >
        {data.teachers.length === 0 ? (
          <p className="ed-empty">{t('studentSubjectInfoNoTeachers')}</p>
        ) : (
          <div className="ed-teachers-list">
            {data.teachers.map((item) => (
              <TeacherCard key={item.teacher.id} item={item} t={t} locale={locale} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<Calendar size={18} />}
        title={t('studentSubjectInfoScheduleTitle')}
      >
        {data.slots.length === 0 ? (
          <p className="ed-empty">{t('studentSubjectInfoNoSlots')}</p>
        ) : (
          <div className="ed-slots-list">
            {sortSlots(data.slots).map((slot) => (
              <div key={slot.id} className="ed-slot-chip">
                <span className="ed-slot-day">
                  {t(DAY_KEYS[slot.dayOfWeek] ?? 'studentSubjectInfoDayMon')}
                </span>
                <Clock size={14} />
                <span className="ed-slot-time">
                  {formatSlotTime(slot.startTime, slot.endTime)}
                </span>
                {slot.lessonType && (
                  <span className="ed-slot-type">{slot.lessonType}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<FileText size={18} />}
        title={t('studentSubjectInfoMaterialsTitle')}
      >
        {data.materials.length === 0 ? (
          <p className="ed-empty">{t('studentSubjectInfoNoMaterials')}</p>
        ) : (
          <div className="ed-material-list">
            {data.materials.map((mat) => (
              <DetailMaterialRow
                key={mat.id}
                title={mat.title}
                description={mat.description ?? undefined}
                fileMeta={mat.file?.originalName ?? undefined}
                onDownload={mat.file ? () => handleDownloadFile(mat.file.id) : undefined}
                downloadLabel={t('download')}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<BarChart3 size={18} />}
        title={t('studentSubjectInfoStatsTitle')}
      >
        <div className="ed-stats-grid">
          <StatCard
            label={t('studentSubjectInfoAttendance')}
            value={
              data.stats.attendancePercent != null
                ? `${data.stats.attendancePercent.toFixed(0)}%`
                : t('studentSubjectInfoNoAttendanceData')
            }
            accent={getAttendanceAccent(data.stats.attendancePercent)}
          />
          <StatCard
            label={t('studentSubjectInfoHomework')}
            value={`${data.stats.submittedHomeworkCount} / ${data.stats.totalHomeworkCount}`}
            accent={getHomeworkAccent(
              data.stats.submittedHomeworkCount,
              data.stats.totalHomeworkCount,
            )}
          />
          <StatCard
            label={t('studentSubjectInfoTotalPoints')}
            value={String(data.stats.totalPoints)}
            accent="blue"
          />
        </div>
      </SectionCard>
    </div>
  );
}

function TeacherCard({
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

function getAttendanceAccent(percent: number | null): string {
  if (percent == null) return 'neutral';
  if (percent >= 80) return 'green';
  if (percent >= 50) return 'amber';
  return 'red';
}

function getHomeworkAccent(submitted: number, total: number): string {
  if (total === 0) return 'neutral';
  const ratio = submitted / total;
  if (ratio >= 0.8) return 'green';
  if (ratio >= 0.5) return 'amber';
  return 'red';
}

function sortSlots(slots: GroupSubjectOfferingSlotDto[]): GroupSubjectOfferingSlotDto[] {
  return [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });
}

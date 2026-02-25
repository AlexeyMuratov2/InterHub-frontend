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
  Download,
} from 'lucide-react';
import { useTranslation } from '../../../../shared/i18n';
import type { Locale } from '../../../../shared/i18n';
import { getStudentSubjectInfo, getFileDownloadUrl } from '../../../../shared/api';
import type {
  StudentSubjectInfoDto,
  StudentSubjectTeacherItemDto,
  GroupSubjectOfferingSlotDto,
  CourseMaterialDto,
} from '../../../../shared/api';
import { Alert } from '../../../../shared/ui';
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
        <Link to={SUBJECTS_BACK_PATH} className="ssi-back-link">
          <ArrowLeft size={16} />
          {t('studentSubjectInfoBackToSubjects')}
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const subjectName = getSubjectDisplayName(data.subject, locale);
  const cs = data.curriculumSubject;
  const formatKey = getFormatKey(data.offering.format);

  return (
    <div className="entity-view-page department-form-page ssi-page">
      <Link to={SUBJECTS_BACK_PATH} className="ssi-back-link">
        <ArrowLeft size={16} />
        {t('studentSubjectInfoBackToSubjects')}
      </Link>

      {/* ===== Header ===== */}
      <div className="ssi-hero">
        <div className="ssi-hero-icon">
          <GraduationCap size={28} />
        </div>
        <div className="ssi-hero-text">
          <h1 className="ssi-hero-title">{subjectName}</h1>
          {data.subject.code && (
            <span className="ssi-hero-code">{data.subject.code}</span>
          )}
          {data.departmentName && (
            <span className="ssi-hero-department">{data.departmentName}</span>
          )}
        </div>
      </div>

      {/* ===== Subject info grid ===== */}
      <section className="entity-view-card ssi-card">
        <h2 className="entity-view-card-title ssi-section-title">
          <BookOpen size={18} />
          {t('studentSubjectInfoSubjectTitle')}
        </h2>
        <div className="ssi-info-grid">
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
      </section>

      {/* ===== Teachers ===== */}
      <section className="entity-view-card ssi-card">
        <h2 className="entity-view-card-title ssi-section-title">
          <UserRound size={18} />
          {t('studentSubjectInfoTeachersTitle')}
        </h2>
        {data.teachers.length === 0 ? (
          <p className="ssi-empty">{t('studentSubjectInfoNoTeachers')}</p>
        ) : (
          <div className="ssi-teachers-list">
            {data.teachers.map((item) => (
              <TeacherCard key={item.teacher.id} item={item} t={t} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Schedule ===== */}
      <section className="entity-view-card ssi-card">
        <h2 className="entity-view-card-title ssi-section-title">
          <Calendar size={18} />
          {t('studentSubjectInfoScheduleTitle')}
        </h2>
        {data.slots.length === 0 ? (
          <p className="ssi-empty">{t('studentSubjectInfoNoSlots')}</p>
        ) : (
          <div className="ssi-slots-list">
            {sortSlots(data.slots).map((slot) => (
              <div key={slot.id} className="ssi-slot-chip">
                <span className="ssi-slot-day">
                  {t(DAY_KEYS[slot.dayOfWeek] ?? 'studentSubjectInfoDayMon')}
                </span>
                <Clock size={14} />
                <span className="ssi-slot-time">
                  {formatSlotTime(slot.startTime, slot.endTime)}
                </span>
                {slot.lessonType && (
                  <span className="ssi-slot-type">{slot.lessonType}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Materials ===== */}
      <section className="entity-view-card ssi-card">
        <h2 className="entity-view-card-title ssi-section-title">
          <FileText size={18} />
          {t('studentSubjectInfoMaterialsTitle')}
        </h2>
        {data.materials.length === 0 ? (
          <p className="ssi-empty">{t('studentSubjectInfoNoMaterials')}</p>
        ) : (
          <div className="ssi-materials-list">
            {data.materials.map((mat) => (
              <MaterialRow
                key={mat.id}
                material={mat}
                onDownload={handleDownloadFile}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {/* ===== Statistics ===== */}
      <section className="entity-view-card ssi-card">
        <h2 className="entity-view-card-title ssi-section-title">
          <BarChart3 size={18} />
          {t('studentSubjectInfoStatsTitle')}
        </h2>
        <div className="ssi-stats-grid">
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
      </section>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="ssi-info-tile">
      <span className="ssi-info-tile-label">{label}</span>
      <span className="ssi-info-tile-value">{value}</span>
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
    <div className="ssi-teacher-card">
      <div className="ssi-teacher-avatar">
        <UserRound size={20} />
      </div>
      <div className="ssi-teacher-info">
        <span className="ssi-teacher-name">{name}</span>
        <span className="ssi-teacher-role">{t(roleKey)}</span>
        {item.teacher.position && (
          <span className="ssi-teacher-position">{item.teacher.position}</span>
        )}
      </div>
    </div>
  );
}

function MaterialRow({
  material,
  onDownload,
  t,
}: {
  material: CourseMaterialDto;
  onDownload: (fileId: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="ssi-material-row">
      <div className="ssi-material-icon">
        <FileText size={18} />
      </div>
      <div className="ssi-material-info">
        <span className="ssi-material-title">{material.title}</span>
        {material.description && (
          <span className="ssi-material-desc">{material.description}</span>
        )}
        {material.file && (
          <span className="ssi-material-file-name">
            {material.file.originalName}
          </span>
        )}
      </div>
      {material.file && (
        <button
          type="button"
          className="ssi-material-download"
          onClick={() => onDownload(material.file.id)}
          title={t('download')}
        >
          <Download style={{ width: '1.25rem', height: '1.25rem' }} aria-hidden />
          <span className="ssi-material-download-text">{t('download')}</span>
        </button>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className={`ssi-stat-card ssi-stat-card--${accent}`}>
      <span className="ssi-stat-value">{value}</span>
      <span className="ssi-stat-label">{label}</span>
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

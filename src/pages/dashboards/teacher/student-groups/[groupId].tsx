import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../../../../shared/i18n';
import { getTeacherStudentGroups, getGroupSubjectInfo } from '../../../../shared/api';
import type {
  TeacherStudentGroupItemDto,
  TeacherStudentGroupSubjectDto,
  GroupSubjectInfoDto,
  GroupSubjectStudentItemDto,
  GroupSubjectLeaderDto,
} from '../../../../shared/api';
import {
  Alert,
  BackLink,
  PageHero,
  SectionCard,
  InfoTile,
  HomeworkHistoryDialog,
  StudentAttendanceHistoryDialog,
  StudentGradeHistoryDialog,
} from '../../../../shared/ui';
import { ArrowLeft, UserCheck, BookOpen, GraduationCap, BarChart3 } from 'lucide-react';

const STUDENT_GROUPS_PATH = '/dashboards/teacher/student-groups';

function subjectDisplayName(subj: TeacherStudentGroupSubjectDto, locale: string): string {
  if (locale === 'zh-Hans' && subj.chineseName) return subj.chineseName;
  return subj.englishName || subj.chineseName || subj.code || subj.id;
}

function curatorDisplayName(item: TeacherStudentGroupItemDto): string {
  const c = item.curatorUser;
  if (!c) return '—';
  const parts = [c.firstName, c.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ').trim() : (c.email ?? '—');
}

function groupDisplayName(item: TeacherStudentGroupItemDto): string {
  const g = item.group;
  const parts = [g.code, g.name].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : g.id;
}

/** Current course (year of study) from start year; 1-based. */
function currentCourse(startYear: number, graduationYear: number | null): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Academic year often starts in September
  const academicYear = month >= 8 ? year + 1 : year;
  const course = academicYear - startYear;
  if (course < 1) return 1;
  if (graduationYear != null && course > graduationYear - startYear) {
    return Math.max(1, graduationYear - startYear);
  }
  return course;
}

function getLeaderRoleForStudent(
  studentId: string,
  leaders: GroupSubjectLeaderDto[]
): 'headman' | 'deputy' | null {
  const found = leaders.find((l) => l.studentId === studentId);
  return found ? (found.role as 'headman' | 'deputy') : null;
}

function studentEnglishName(user: GroupSubjectStudentItemDto['user']): string {
  if (!user) return '—';
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ').trim() : (user.email ?? '—');
}

/** Returns accent for stat buttons: high (>85%)=green, medium (>65%)=amber, low=red. */
function getProgressAccent(percent: number | null): 'green' | 'amber' | 'red' | null {
  if (percent == null || percent < 0) return null;
  if (percent > 85) return 'green';
  if (percent > 65) return 'amber';
  return 'red';
}

export function GroupSubjectInfoPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t, locale } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [groupItem, setGroupItem] = useState<TeacherStudentGroupItemDto | null>(null);
  const [subjectsForGroup, setSubjectsForGroup] = useState<TeacherStudentGroupSubjectDto[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectInfo, setSubjectInfo] = useState<GroupSubjectInfoDto | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** When set, the grade history modal is open for this student. */
  const [gradeHistoryStudent, setGradeHistoryStudent] = useState<{
    studentId: string;
    offeringId: string;
    studentDisplayName: string;
  } | null>(null);
  /** When set, the attendance history modal is open for this student. */
  const [attendanceHistoryStudent, setAttendanceHistoryStudent] = useState<{
    studentId: string;
    offeringId: string;
    studentDisplayName: string;
  } | null>(null);
  /** When set, the homework history modal is open for this student. */
  const [homeworkHistoryStudent, setHomeworkHistoryStudent] = useState<{
    studentId: string;
    offeringId: string;
    studentDisplayName: string;
  } | null>(null);

  // Load teacher student groups and find this group (only when groupId changes)
  useEffect(() => {
    if (!groupId) {
      setLoadingGroups(false);
      return;
    }
    setLoadingGroups(true);
    setError(null);
    getTeacherStudentGroups()
      .then((res) => {
        if (res.error) {
          setError(res.error.message ?? tRef.current('teacherStudentGroupsErrorLoad'));
          setGroupItem(null);
          setSubjectsForGroup([]);
          return;
        }
        const data = res.data;
        const groupsList = data?.groups ?? [];
        const item = groupsList.find((g) => g.group.id === groupId) ?? null;
        setGroupItem(item);
        if (item && data?.subjects?.length) {
          const subs = data.subjects.filter((s) => item.subjectIds.includes(s.id));
          setSubjectsForGroup(subs);
          setSelectedSubjectId(subs.length > 0 ? subs[0].id : null);
        } else {
          setSubjectsForGroup([]);
          setSelectedSubjectId(null);
        }
      })
      .catch((err) => {
        setError(err?.message ?? tRef.current('teacherStudentGroupsErrorLoad'));
        setGroupItem(null);
        setSubjectsForGroup([]);
        setSelectedSubjectId(null);
      })
      .finally(() => setLoadingGroups(false));
  }, [groupId]);

  // When subject selected, load group subject info (only when groupId or selectedSubjectId changes)
  const loadSubjectInfo = useCallback(async () => {
    if (!groupId || !selectedSubjectId) {
      setSubjectInfo(null);
      return;
    }
    setLoadingInfo(true);
    setError(null);
    const res = await getGroupSubjectInfo(groupId, selectedSubjectId);
    if (res.error) {
      setError(res.error.message ?? tRef.current('groupSubjectInfoErrorLoad'));
      setSubjectInfo(null);
    } else {
      setSubjectInfo(res.data ?? null);
    }
    setLoadingInfo(false);
  }, [groupId, selectedSubjectId]);

  useEffect(() => {
    loadSubjectInfo();
  }, [loadSubjectInfo]);

  const selectedSubject = useMemo(
    () => subjectsForGroup.find((s) => s.id === selectedSubjectId) ?? null,
    [subjectsForGroup, selectedSubjectId]
  );

  if (!groupId) {
    return (
      <div className="entity-view-page department-form-page">
        <Alert variant="error" role="alert">
          {t('groupSubjectInfoNotFound')}
        </Alert>
        <BackLink to={STUDENT_GROUPS_PATH} icon={<ArrowLeft size={16} />}>
          {t('groupSubjectInfoBackToGroups')}
        </BackLink>
      </div>
    );
  }

  if (loadingGroups) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="entity-view-card">
          <p style={{ margin: 0, color: '#6b7280' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!groupItem) {
    return (
      <div className="entity-view-page department-form-page">
        <Alert variant="error" role="alert">
          {t('groupSubjectInfoGroupNotFound')}
        </Alert>
        <BackLink to={STUDENT_GROUPS_PATH} icon={<ArrowLeft size={16} />}>
          {t('groupSubjectInfoBackToGroups')}
        </BackLink>
      </div>
    );
  }

  const course = currentCourse(groupItem.group.startYear, groupItem.group.graduationYear ?? null);
  const hasMultipleSubjects = subjectsForGroup.length > 1;
  const hasNoSubjects = subjectsForGroup.length === 0;
  const programName = groupItem.program.name ?? groupItem.program.code ?? '—';
  const yearsOfStudy =
    `${groupItem.group.startYear}${groupItem.group.graduationYear != null ? ` – ${groupItem.group.graduationYear}` : '+'}`;

  return (
    <div className="entity-view-page department-form-page ed-page">
      <BackLink to={STUDENT_GROUPS_PATH} icon={<ArrowLeft size={16} />}>
        {t('groupSubjectInfoBackToGroups')}
      </BackLink>

      <PageHero
        icon={<GraduationCap size={28} />}
        title={groupDisplayName(groupItem)}
        subtitle={groupItem.group.code ?? undefined}
        meta={programName}
      />

      <SectionCard
        icon={<BookOpen size={18} />}
        title={t('groupSubjectInfoPageTitle')}
      >
        <div className="ed-info-grid">
          <InfoTile
            label={t('teacherStudentGroupsProgram')}
            value={programName}
          />
          <InfoTile
            label={t('groupSubjectInfoYearsOfStudy')}
            value={yearsOfStudy}
          />
          <InfoTile
            label={t('groupSubjectInfoCurrentCourse')}
            value={String(course)}
          />
          <InfoTile
            label={t('teacherStudentGroupsCurriculum')}
            value={groupItem.curriculum.version ?? '—'}
          />
          <InfoTile
            label={t('teacherStudentGroupsCurator')}
            value={curatorDisplayName(groupItem)}
          />
          {groupItem.studentCount != null && (
            <InfoTile
              label={t('teacherStudentGroupsStudentsCount')}
              value={String(groupItem.studentCount)}
            />
          )}
        </div>
      </SectionCard>

      <SectionCard
        icon={<BookOpen size={18} />}
        title={t('groupSubjectInfoSubject')}
      >
        {hasNoSubjects ? (
          <p className="ed-empty">{t('groupSubjectInfoNoSubjects')}</p>
        ) : hasMultipleSubjects ? (
          <div className="ed-chip-list">
            {subjectsForGroup.map((subj) => (
              <button
                key={subj.id}
                type="button"
                className={`ed-chip ${selectedSubjectId === subj.id ? 'ed-chip--active' : ''}`}
                onClick={() => setSelectedSubjectId(subj.id)}
              >
                {subjectDisplayName(subj, locale)}
              </button>
            ))}
          </div>
        ) : (
          selectedSubject && (
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
              {subjectDisplayName(selectedSubject, locale)}
            </p>
          )
        )}
      </SectionCard>

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="error" role="alert">{error}</Alert>
        </div>
      )}

      {!hasNoSubjects && (
      <SectionCard
        icon={<BarChart3 size={18} />}
        title={t('groupSubjectInfoStudents')}
      >
          {loadingInfo ? (
            <p className="ed-empty" style={{ margin: 0 }}>{t('loading')}</p>
          ) : subjectInfo ? (
            <>
              <div className="ed-section-header" style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {subjectInfo.semester.name ?? `${t('academicSemesterNumber')} ${subjectInfo.semester.number}`}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {t('groupSubjectInfoTotalHomework')}: {subjectInfo.totalHomeworkCount}
                </span>
              </div>
              <div className="ed-data-table-wrapper">
                <table className="ed-data-table" role="table">
                  <thead>
                    <tr>
                      <th>{t('groupSubjectInfoStudentNameEn')}</th>
                      <th>{t('groupSubjectInfoStudentNameCn')}</th>
                      <th>{t('groupSubjectInfoStudentId')}</th>
                      <th>{t('groupSubjectInfoPoints')}</th>
                      <th>{t('groupSubjectInfoAttendance')}</th>
                      <th>{t('groupSubjectInfoHomeworkSubmitted')}</th>
                      <th>{t('groupSubjectInfoRole')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectInfo.students.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="ed-cell-empty">
                          {t('groupSubjectInfoNoStudents')}
                        </td>
                      </tr>
                    ) : (
                      subjectInfo.students.map((row) => {
                        const leaderRole = getLeaderRoleForStudent(row.student.id, subjectInfo.leaders);
                        const attendanceAccent = getProgressAccent(row.attendancePercent ?? null);
                        const totalHw = subjectInfo.totalHomeworkCount ?? 0;
                        const homeworkPercent =
                          totalHw > 0 ? (row.submittedHomeworkCount / totalHw) * 100 : null;
                        const homeworkAccent = getProgressAccent(homeworkPercent);
                        return (
                          <tr key={row.student.id}>
                            <td>{studentEnglishName(row.user)}</td>
                            <td>{row.student.chineseName ?? '—'}</td>
                            <td className="ed-cell-mono">{row.student.studentId ?? '—'}</td>
                            <td>
                              <button
                                type="button"
                                className="ed-table-stat-btn ed-table-stat-btn--blue"
                                onClick={() =>
                                  setGradeHistoryStudent({
                                    studentId: row.student.id,
                                    offeringId: subjectInfo.offering.id,
                                    studentDisplayName: studentEnglishName(row.user),
                                  })
                                }
                                title={t('groupSubjectInfoPoints')}
                              >
                                {row.totalPoints}
                              </button>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={
                                  attendanceAccent
                                    ? `ed-table-stat-btn ed-table-stat-btn--${attendanceAccent}`
                                    : 'ed-table-stat-btn'
                                }
                                onClick={() =>
                                  setAttendanceHistoryStudent({
                                    studentId: row.student.id,
                                    offeringId: subjectInfo.offering.id,
                                    studentDisplayName: studentEnglishName(row.user),
                                  })
                                }
                                title={t('groupSubjectInfoAttendance')}
                              >
                                {row.attendancePercent != null ? `${Math.round(row.attendancePercent)}%` : '—'}
                              </button>
                            </td>
                            <td>
                              {totalHw > 0 ? (
                                <button
                                  type="button"
                                  className={
                                    homeworkAccent
                                      ? `ed-table-stat-btn ed-table-stat-btn--${homeworkAccent}`
                                      : 'ed-table-stat-btn'
                                  }
                                  onClick={() =>
                                    setHomeworkHistoryStudent({
                                      studentId: row.student.id,
                                      offeringId: subjectInfo.offering.id,
                                      studentDisplayName: studentEnglishName(row.user),
                                    })
                                  }
                                  title={t('groupSubjectInfoHomeworkSubmitted')}
                                >
                                  {row.submittedHomeworkCount} / {totalHw}
                                  <span className="ed-table-stat-percent">
                                    {' '}({Math.round(homeworkPercent ?? 0)}%)
                                  </span>
                                </button>
                              ) : (
                                <span className="ed-table-stat-btn" style={{ cursor: 'default' }}>
                                  {row.submittedHomeworkCount} / 0
                                </span>
                              )}
                            </td>
                            <td>
                              {leaderRole ? (
                                <span
                                  className={`ed-leader-badge ed-leader-badge--${leaderRole}`}
                                  title={leaderRole === 'headman' ? t('groupSubjectInfoHeadman') : t('groupSubjectInfoDeputy')}
                                >
                                  <UserCheck size={14} />
                                  {leaderRole === 'headman' ? t('groupSubjectInfoHeadman') : t('groupSubjectInfoDeputy')}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            selectedSubjectId && !loadingInfo && (
              <p className="ed-empty" style={{ margin: 0 }}>{t('groupSubjectInfoNoData')}</p>
            )
          )}
        </SectionCard>
      )}

      {gradeHistoryStudent && (
        <StudentGradeHistoryDialog
          open={true}
          onClose={() => setGradeHistoryStudent(null)}
          studentId={gradeHistoryStudent.studentId}
          offeringId={gradeHistoryStudent.offeringId}
          title={gradeHistoryStudent.studentDisplayName}
          lessonLinkBasePath="/dashboards/teacher/lessons"
        />
      )}
      {attendanceHistoryStudent && (
        <StudentAttendanceHistoryDialog
          open={true}
          onClose={() => setAttendanceHistoryStudent(null)}
          studentId={attendanceHistoryStudent.studentId}
          offeringId={attendanceHistoryStudent.offeringId}
          title={attendanceHistoryStudent.studentDisplayName}
          lessonLinkBasePath="/dashboards/teacher/lessons"
        />
      )}
      {homeworkHistoryStudent && (
        <HomeworkHistoryDialog
          open={true}
          onClose={() => setHomeworkHistoryStudent(null)}
          studentId={homeworkHistoryStudent.studentId}
          offeringId={homeworkHistoryStudent.offeringId}
          title={homeworkHistoryStudent.studentDisplayName}
          lessonLinkBasePath="/dashboards/teacher/lessons"
        />
      )}
    </div>
  );
}

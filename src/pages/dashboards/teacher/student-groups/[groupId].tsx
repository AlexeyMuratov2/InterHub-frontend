import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../../../../shared/i18n';
import { getTeacherStudentGroups, getGroupSubjectInfo } from '../../../../shared/api';
import type {
  TeacherStudentGroupItemDto,
  TeacherStudentGroupSubjectDto,
  GroupSubjectInfoDto,
  GroupSubjectStudentItemDto,
  GroupSubjectLeaderDto,
} from '../../../../shared/api';
import { Alert, StudentGradeHistoryModal } from '../../../../shared/ui';
import { ArrowLeft, UserCheck, BookOpen } from 'lucide-react';

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

/** Returns CSS class for progress/attendance: high (>85%), medium (>65%), low (≤65%). */
function getProgressStatusClass(percent: number | null): 'high' | 'medium' | 'low' | null {
  if (percent == null || percent < 0) return null;
  if (percent > 85) return 'high';
  if (percent > 65) return 'medium';
  return 'low';
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
      <section className="entity-view-card" style={{ marginTop: '1rem' }}>
        <Alert variant="error">{t('groupSubjectInfoNotFound')}</Alert>
        <Link to={STUDENT_GROUPS_PATH} className="group-subject-info-back-link">
          <ArrowLeft size={18} /> {t('groupSubjectInfoBackToGroups')}
        </Link>
      </section>
    );
  }

  if (loadingGroups) {
    return (
      <section className="entity-view-card group-subject-info-page" style={{ marginTop: '1rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('loading')}</p>
      </section>
    );
  }

  if (!groupItem) {
    return (
      <section className="entity-view-card" style={{ marginTop: '1rem' }}>
        <Alert variant="error">{t('groupSubjectInfoGroupNotFound')}</Alert>
        <Link to={STUDENT_GROUPS_PATH} className="group-subject-info-back-link">
          <ArrowLeft size={18} /> {t('groupSubjectInfoBackToGroups')}
        </Link>
      </section>
    );
  }

  const course = currentCourse(groupItem.group.startYear, groupItem.group.graduationYear ?? null);
  const hasMultipleSubjects = subjectsForGroup.length > 1;
  const hasNoSubjects = subjectsForGroup.length === 0;

  return (
    <section className="entity-view-card group-subject-info-page" style={{ marginTop: '1rem' }}>
      <Link to={STUDENT_GROUPS_PATH} className="group-subject-info-back-link">
        <ArrowLeft size={18} /> {t('groupSubjectInfoBackToGroups')}
      </Link>

      <header className="group-subject-info-header">
        <h1 className="group-subject-info-title">{groupDisplayName(groupItem)}</h1>
        <div className="group-subject-info-meta">
          <div className="group-subject-info-meta-grid">
            <div className="group-subject-info-meta-item">
              <span className="group-subject-info-meta-label">{t('teacherStudentGroupsProgram')}</span>
              <span className="group-subject-info-meta-value">
                {groupItem.program.name ?? groupItem.program.code ?? '—'}
              </span>
            </div>
            <div className="group-subject-info-meta-item">
              <span className="group-subject-info-meta-label">{t('groupSubjectInfoYearsOfStudy')}</span>
              <span className="group-subject-info-meta-value">
                {groupItem.group.startYear}
                {groupItem.group.graduationYear != null ? ` – ${groupItem.group.graduationYear}` : '+'}
              </span>
            </div>
            <div className="group-subject-info-meta-item">
              <span className="group-subject-info-meta-label">{t('groupSubjectInfoCurrentCourse')}</span>
              <span className="group-subject-info-meta-value">{course}</span>
            </div>
            <div className="group-subject-info-meta-item">
              <span className="group-subject-info-meta-label">{t('teacherStudentGroupsCurriculum')}</span>
              <span className="group-subject-info-meta-value">
                {groupItem.curriculum.version ?? '—'}
              </span>
            </div>
            <div className="group-subject-info-meta-item">
              <span className="group-subject-info-meta-label">{t('teacherStudentGroupsCurator')}</span>
              <span className="group-subject-info-meta-value">{curatorDisplayName(groupItem)}</span>
            </div>
            {groupItem.studentCount != null && (
              <div className="group-subject-info-meta-item">
                <span className="group-subject-info-meta-label">{t('teacherStudentGroupsStudentsCount')}</span>
                <span className="group-subject-info-meta-value">{groupItem.studentCount}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Subject carousel / single subject */}
      <div className="group-subject-info-subjects-section">
        <h2 className="group-subject-info-section-title">
          <BookOpen size={20} /> {t('groupSubjectInfoSubject')}
        </h2>
        {hasNoSubjects ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{t('groupSubjectInfoNoSubjects')}</p>
        ) : hasMultipleSubjects ? (
          <div className="group-subject-info-carousel">
            <div className="group-subject-info-carousel-track">
              {subjectsForGroup.map((subj) => (
                <button
                  key={subj.id}
                  type="button"
                  className={`group-subject-info-carousel-card ${selectedSubjectId === subj.id ? 'active' : ''}`}
                  onClick={() => setSelectedSubjectId(subj.id)}
                >
                  {subjectDisplayName(subj, locale)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          selectedSubject && (
            <div className="group-subject-info-single-subject">
              {subjectDisplayName(selectedSubject, locale)}
            </div>
          )
        )}
      </div>

      {error && (
        <Alert variant="error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      {/* Students table for selected subject */}
      {!hasNoSubjects && (
      <div className="group-subject-info-students-section">
        <h2 className="group-subject-info-section-title">{t('groupSubjectInfoStudents')}</h2>
        {loadingInfo ? (
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('loading')}</p>
        ) : subjectInfo ? (
          <>
            <div className="group-subject-info-semester-bar">
              <span className="group-subject-info-semester-name">
                {subjectInfo.semester.name ?? `${t('academicSemesterNumber')} ${subjectInfo.semester.number}`}
              </span>
              <span className="group-subject-info-homework-count">
                {t('groupSubjectInfoTotalHomework')}: {subjectInfo.totalHomeworkCount}
              </span>
            </div>
            <div className="group-subject-info-table-wrapper">
              <table className="group-subject-info-table" role="table">
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
                      <td colSpan={7} className="group-subject-info-empty-cell">
                        {t('groupSubjectInfoNoStudents')}
                      </td>
                    </tr>
                  ) : (
                    subjectInfo.students.map((row) => {
                      const leaderRole = getLeaderRoleForStudent(row.student.id, subjectInfo.leaders);
                      const attendanceStatus = getProgressStatusClass(row.attendancePercent ?? null);
                      const totalHw = subjectInfo.totalHomeworkCount ?? 0;
                      const homeworkPercent =
                        totalHw > 0 ? (row.submittedHomeworkCount / totalHw) * 100 : null;
                      const homeworkStatus = getProgressStatusClass(homeworkPercent);
                      return (
                        <tr key={row.student.id}>
                          <td>{studentEnglishName(row.user)}</td>
                          <td>{row.student.chineseName ?? '—'}</td>
                          <td className="group-subject-info-cell-id">{row.student.studentId ?? '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="group-subject-info-points-button"
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
                            {row.attendancePercent != null ? (
                              <span
                                className={
                                  attendanceStatus
                                    ? `group-subject-info-stat group-subject-info-stat-${attendanceStatus}`
                                    : 'group-subject-info-stat'
                                }
                                title={t('groupSubjectInfoAttendance')}
                              >
                                {Math.round(row.attendancePercent)}%
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {totalHw > 0 ? (
                              <span
                                className={
                                  homeworkStatus
                                    ? `group-subject-info-stat group-subject-info-stat-${homeworkStatus}`
                                    : 'group-subject-info-stat'
                                }
                                title={`${t('groupSubjectInfoHomeworkSubmitted')}: ${Math.round(homeworkPercent ?? 0)}%`}
                              >
                                {row.submittedHomeworkCount} / {totalHw}
                                <span className="group-subject-info-stat-percent">
                                  {' '}({Math.round(homeworkPercent ?? 0)}%)
                                </span>
                              </span>
                            ) : (
                              <span className="group-subject-info-stat">{row.submittedHomeworkCount} / 0</span>
                            )}
                          </td>
                          <td>
                            {leaderRole ? (
                              <span
                                className={`group-subject-info-leader-badge ${leaderRole}`}
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
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('groupSubjectInfoNoData')}</p>
          )
        )}
      </div>
      )}

      {gradeHistoryStudent && (
        <StudentGradeHistoryModal
          open={true}
          onClose={() => setGradeHistoryStudent(null)}
          studentId={gradeHistoryStudent.studentId}
          offeringId={gradeHistoryStudent.offeringId}
          studentDisplayName={gradeHistoryStudent.studentDisplayName}
        />
      )}
    </section>
  );
}

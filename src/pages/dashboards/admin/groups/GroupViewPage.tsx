import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchGroupById,
  fetchGroupMembers,
  fetchGroupLeaders,
  addGroupLeader,
  deleteGroupLeader,
  addGroupMembersBulk,
  removeGroupMember,
  type StudentGroupDto,
  type GroupMemberDto,
  type GroupLeaderDetailDto,
} from '../../../../entities/group';
import { fetchProgramById } from '../../../../entities/program';
import { fetchCurriculumById } from '../../../../entities/curriculum';
import { getUser, listStudents } from '../../../../shared/api';
import type { StudentProfileItem } from '../../../../shared/api';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getDisplayName } from '../../../../shared/lib';
import { EntityViewLayout } from '../../../../widgets/entity-view-layout';
import { Alert, ConfirmModal, FormActions, FormGroup, Modal } from '../../../../shared/ui';

function memberDisplayName(m: GroupMemberDto): string {
  const n = getDisplayName(m.user.firstName, m.user.lastName, m.user.email ?? '');
  return (n || (m.student.chineseName ?? '—'));
}

export function GroupViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [group, setGroup] = useState<StudentGroupDto | null>(null);
  const [programName, setProgramName] = useState<string | null>(null);
  const [curriculumLabel, setCurriculumLabel] = useState<string | null>(null);
  const [curatorName, setCuratorName] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [leaders, setLeaders] = useState<GroupLeaderDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Assign leader dialog (modal)
  const [assignLeaderMember, setAssignLeaderMember] = useState<GroupMemberDto | null>(null);
  const [assignLeaderRole, setAssignLeaderRole] = useState<'' | 'headman' | 'deputy'>('headman');
  const [assignLeaderFromDate, setAssignLeaderFromDate] = useState('');
  const [assignLeaderToDate, setAssignLeaderToDate] = useState('');
  const [assignLeaderSubmitting, setAssignLeaderSubmitting] = useState(false);
  const [assignLeaderError, setAssignLeaderError] = useState<string | null>(null);

  // Student management state
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentProfileItem[]>([]);
  const [studentsNextCursor, setStudentsNextCursor] = useState<string | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [removeStudentId, setRemoveStudentId] = useState<string | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGroupById(id).then(({ data: g, error: err }) => {
      if (cancelled) return;
      if (err) {
        setLoading(false);
        if (err.status === 404) setNotFound(true);
        else setError(err.message ?? t('groupErrorLoad'));
        return;
      }
      if (!g) {
        setLoading(false);
        setNotFound(true);
        return;
      }
      setGroup(g);
      fetchProgramById(g.programId).then(({ data: p }) => {
        if (!cancelled) setProgramName(p?.name ?? null);
      });
      fetchCurriculumById(g.curriculumId).then(({ data: c }) => {
        if (!cancelled && c) setCurriculumLabel(`${c.version} (${c.startYear}–${c.endYear ?? '…'})`);
      });
      if (g.curatorUserId) {
        getUser(g.curatorUserId).then(({ data: u }) => {
          if (!cancelled && u?.user) {
            const user = u.user;
            setCuratorName(getDisplayName(user.firstName, user.lastName, user.email ?? ''));
          }
        });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchGroupMembers(id).then(({ data, error: err }) => {
      if (cancelled) return;
      if (!err && data) setMembers(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchGroupLeaders(id).then(({ data, error: err }) => {
      if (cancelled) return;
      if (!err && data) setLeaders(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Map studentId -> role label(s) for table column
  const memberRoleByStudentId = useMemo(() => {
    const map: Record<string, string> = {};
    leaders.forEach((l) => {
      const label = l.role === 'headman' ? t('headman') : t('deputy');
      map[l.studentId] = map[l.studentId] ? `${map[l.studentId]}, ${label}` : label;
    });
    return map;
  }, [leaders, t]);

  // studentId -> leader records (for removal in modal)
  const leadersByStudentId = useMemo(() => {
    const map: Record<string, GroupLeaderDetailDto[]> = {};
    leaders.forEach((l) => {
      if (!map[l.studentId]) map[l.studentId] = [];
      map[l.studentId].push(l);
    });
    return map;
  }, [leaders]);

  const handleAssignLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !assignLeaderMember) return;
    setAssignLeaderSubmitting(true);
    setAssignLeaderError(null);

    if (assignLeaderRole === '') {
      // Снять роль: удалить все записи старосты для этого студента
      const records = leadersByStudentId[assignLeaderMember.student.id];
      if (!records?.length) {
        setAssignLeaderError(t('groupLeadersEmpty'));
        setAssignLeaderSubmitting(false);
        return;
      }
      for (const record of records) {
        const { error: err } = await deleteGroupLeader(record.id);
        if (err) {
          setAssignLeaderError(err.message ?? t('groupErrorRemoveLeader'));
          setAssignLeaderSubmitting(false);
          return;
        }
      }
      const { data: list } = await fetchGroupLeaders(id);
      if (list) setLeaders(list);
      setAssignLeaderMember(null);
      setAssignLeaderRole('headman');
      setAssignLeaderFromDate('');
      setAssignLeaderToDate('');
      setAssignLeaderSubmitting(false);
      return;
    }

    const { error: err } = await addGroupLeader(id, {
      studentId: assignLeaderMember.student.id,
      role: assignLeaderRole,
      fromDate: assignLeaderFromDate.trim() || undefined,
      toDate: assignLeaderToDate.trim() || undefined,
    });
    setAssignLeaderSubmitting(false);
    if (err) {
      setAssignLeaderError(err.status === 409 ? t('groupErrorLeaderExists') : (err.message ?? t('groupErrorValidation')));
      return;
    }
    setAssignLeaderMember(null);
    setAssignLeaderRole('headman');
    setAssignLeaderFromDate('');
    setAssignLeaderToDate('');
    fetchGroupLeaders(id).then(({ data: list }) => {
      if (list) setLeaders(list);
    });
  };

  // Load students for adding to group
  const loadStudents = useCallback(async (cursor?: string) => {
    setLoadingStudents(true);
    const { data, error: err } = await listStudents({ cursor, limit: 30 });
    setLoadingStudents(false);
    if (err) {
      setAddStudentError(err.message ?? t('groupErrorAddStudent'));
      return;
    }
    if (data) {
      setAllStudents((prev) => cursor ? [...prev, ...data.items] : data.items);
      setStudentsNextCursor(data.nextCursor);
    }
  }, [t]);

  // Filter out students already in the group
  const availableStudents = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.student.id));
    return allStudents.filter((s) => !memberIds.has(s.profile.id));
  }, [allStudents, members]);

  const handleOpenAddStudent = () => {
    setAddStudentOpen(true);
    setAddStudentError(null);
    setSelectedStudentIds([]);
    if (allStudents.length === 0) {
      loadStudents();
    }
  };

  const handleLoadMoreStudents = () => {
    if (studentsNextCursor && !loadingStudents) {
      loadStudents(studentsNextCursor);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || selectedStudentIds.length === 0) {
      setAddStudentError(t('groupStudentRequired'));
      return;
    }
    setAddingStudents(true);
    setAddStudentError(null);
    const { error: err } = await addGroupMembersBulk(id, selectedStudentIds);
    setAddingStudents(false);
    if (err) {
      setAddStudentError(err.message ?? t('groupErrorAddStudent'));
      return;
    }
    // Reload members and leaders from DB so the table shows actual roles
    const [membersRes, leadersRes] = await Promise.all([
      fetchGroupMembers(id),
      fetchGroupLeaders(id),
    ]);
    if (membersRes.data) setMembers(membersRes.data);
    if (leadersRes.data) setLeaders(leadersRes.data);
    setAddStudentOpen(false);
    setSelectedStudentIds([]);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!id) return;
    setRemovingStudent(true);
    setError(null);
    const { error: err } = await removeGroupMember(id, studentId);
    setRemovingStudent(false);
    if (err) {
      setError(err.message ?? t('groupErrorRemoveStudent'));
      setRemoveStudentId(null);
      return;
    }
    // Reload members and leaders from DB so the table reflects actual state
    const [membersRes, leadersRes] = await Promise.all([
      fetchGroupMembers(id),
      fetchGroupLeaders(id),
    ]);
    if (membersRes.data) setMembers(membersRes.data);
    if (leadersRes.data) setLeaders(leadersRes.data);
    setRemoveStudentId(null);
  };

  const title = group ? (group.name ? t('groupViewPageTitle', { name: group.name }) : group.code) : '';

  return (
    <>
      <EntityViewLayout
        loading={loading}
        notFound={notFound}
        error={error}
        notFoundMessage={t('groupNotFound')}
        errorMessage={error ?? t('dataNotLoaded')}
        backTo="/dashboards/admin/groups"
        backLabel={t('groupBackToGroups')}
        viewOnly={!canEdit}
        viewOnlyMessage={t('viewOnlyNotice')}
        title={title}
        onEditClick={canEdit && id ? () => navigate(`/dashboards/admin/groups/${id}/edit`) : undefined}
        editLabel={t('editTitle')}
        loadingMessage={t('loadingList')}
      >
        {group && (
          <>
            {group.name && (
              <p className="entity-view-subtitle" style={{ marginTop: 0, color: '#6b7280', fontSize: '0.95rem' }}>
                {group.code}
              </p>
            )}
            <div className="entity-view-card">
              <h2 className="entity-view-card-title">{t('groupInfoTitle')}</h2>
              <dl className="entity-view-dl entity-view-dl--two-cols">
                <dt>{t('code')}</dt>
                <dd>{group.code}</dd>
                <dt>{t('name')}</dt>
                <dd>{group.name ?? tCommon('noData')}</dd>
                <dt>{t('description')}</dt>
                <dd>{group.description ?? tCommon('noData')}</dd>
                <dt>{t('groupProgram')}</dt>
                <dd>{programName ?? '—'}</dd>
                <dt>{t('groupStudyPlanLink')}</dt>
                <dd>
                  <Link
                    to={`/dashboards/admin/programs/${group.programId}`}
                    className="department-table-link"
                  >
                    {curriculumLabel ?? group.curriculumId}
                  </Link>
                </dd>
                <dt>{t('implementationLinkFromGroup')}</dt>
                <dd>
                  <Link
                    to={`/dashboards/admin/implementation?groupId=${group.id}`}
                    className="department-table-link"
                  >
                    {t('implementationLinkFromGroup')}
                  </Link>
                </dd>
                <dt>{t('groupStartYear')}</dt>
                <dd>{group.startYear}</dd>
                <dt>{t('groupGraduationYear')}</dt>
                <dd>{group.graduationYear ?? '—'}</dd>
                <dt>{t('groupCurator')}</dt>
                <dd>{group.curatorUserId ? curatorName ?? '—' : t('groupCuratorNone')}</dd>
                <dt>{t('createdAt')}</dt>
                <dd>{formatDateTime(group.createdAt, locale)}</dd>
              </dl>
            </div>

            <section className="entity-view-card">
              <h2 className="entity-view-card-title">{t('groupStudentsSection')}</h2>
              {canEdit && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="department-page-create"
                    onClick={handleOpenAddStudent}
                  >
                    + {t('groupAddStudent')}
                  </button>
                </div>
              )}
              {addStudentOpen && canEdit && (
                <form
                  onSubmit={handleAddStudents}
                  className="department-form"
                  style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: 8 }}
                >
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>{t('groupAddStudentTitle')}</h3>
                  {addStudentError && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <Alert variant="error" role="alert">
                        {addStudentError}
                      </Alert>
                    </div>
                  )}
                  <FormGroup label={t('groupSelectStudent')} htmlFor="select-students">
                    {loadingStudents && allStudents.length === 0 ? (
                      <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>{t('groupLoadingStudents')}</p>
                    ) : availableStudents.length === 0 ? (
                      <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>{t('groupNoStudentsToAdd')}</p>
                    ) : (
                      <div
                        id="select-students"
                        style={{
                          maxHeight: 200,
                          overflowY: 'auto',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          padding: '0.5rem',
                        }}
                      >
                        {availableStudents.map((s) => (
                          <label
                            key={s.profile.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.25rem 0',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(s.profile.id)}
                              onChange={() => handleToggleStudent(s.profile.id)}
                            />
                            <span>{s.displayName}</span>
                            {s.profile.studentId && (
                              <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                ({s.profile.studentId})
                              </span>
                            )}
                          </label>
                        ))}
                        {studentsNextCursor && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ marginTop: '0.5rem', width: '100%' }}
                            onClick={handleLoadMoreStudents}
                            disabled={loadingStudents}
                          >
                            {loadingStudents ? t('loading') : t('groupLoadMoreStudents')}
                          </button>
                        )}
                      </div>
                    )}
                  </FormGroup>
                  {selectedStudentIds.length > 0 && (
                    <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#374151' }}>
                      {t('groupStudentsSelected', { count: selectedStudentIds.length })}
                    </p>
                  )}
                  <FormActions
                    submitLabel={addingStudents ? tCommon('submitting') : tCommon('save')}
                    submitting={addingStudents}
                    cancelLabel={tCommon('cancel')}
                    onCancel={() => {
                      setAddStudentOpen(false);
                      setAddStudentError(null);
                      setSelectedStudentIds([]);
                    }}
                  />
                </form>
              )}
              {members.length === 0 ? (
                <p className="department-empty">{t('groupStudentsEmpty')}</p>
              ) : (
                <div className="department-table-wrap">
                  <table className="department-table">
                    <thead>
                      <tr>
                        <th>{t('name')}</th>
                        <th>{t('groupEmailOrId')}</th>
                        <th>{t('groupRoleInGroup')}</th>
                        {canEdit && <th>{t('actions')}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.student.id}>
                          <td>{memberDisplayName(m)}</td>
                          <td>{m.user.email ?? m.student.studentId ?? '—'}</td>
                          <td>{memberRoleByStudentId[m.student.id] ?? '—'}</td>
                          {canEdit && (
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                className="btn-action-sm"
                                style={{ marginRight: '0.35rem' }}
                                onClick={() => {
                                  setAssignLeaderMember(m);
                                  setAssignLeaderError(null);
                                  setAssignLeaderRole('headman');
                                  setAssignLeaderFromDate('');
                                  setAssignLeaderToDate('');
                                }}
                              >
                                {t('groupAssignAsLeader')}
                              </button>
                              <button
                                type="button"
                                className="department-table-btn department-table-btn--danger btn-action-sm"
                                onClick={() => setRemoveStudentId(m.student.id)}
                                title={t('groupRemoveStudent')}
                                aria-label={t('groupRemoveStudent')}
                              >
                                🗑
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </EntityViewLayout>

      {/* Assign leader dialog */}
      <Modal
        open={assignLeaderMember != null}
        onClose={() => {
          if (!assignLeaderSubmitting) {
            setAssignLeaderMember(null);
            setAssignLeaderError(null);
          }
        }}
        title={`${t('groupAssignLeaderModalTitle')}: ${assignLeaderMember ? memberDisplayName(assignLeaderMember) : ''}`}
        titleId="assign-leader-modal-title"
        variant="form"
      >
        <form onSubmit={handleAssignLeader}>
          {assignLeaderError && (
            <div style={{ marginBottom: '0.75rem' }}>
              <Alert variant="error" role="alert">
                {assignLeaderError}
              </Alert>
            </div>
          )}
          <FormGroup label={t('groupLeaderRoleRequired')} htmlFor="assign-leader-role">
            <select
              id="assign-leader-role"
              value={assignLeaderRole}
              onChange={(e) => setAssignLeaderRole(e.target.value as '' | 'headman' | 'deputy')}
            >
              <option value="">{t('groupRoleNone')}</option>
              <option value="headman">{t('headman')}</option>
              <option value="deputy">{t('deputy')}</option>
            </select>
          </FormGroup>
          <FormGroup label={t('groupLeaderFromDate')} htmlFor="assign-leader-from">
            <input
              id="assign-leader-from"
              type="date"
              value={assignLeaderFromDate}
              onChange={(e) => setAssignLeaderFromDate(e.target.value)}
            />
          </FormGroup>
          <FormGroup label={t('groupLeaderToDate')} htmlFor="assign-leader-to">
            <input
              id="assign-leader-to"
              type="date"
              value={assignLeaderToDate}
              onChange={(e) => setAssignLeaderToDate(e.target.value)}
            />
          </FormGroup>
          <FormActions
            submitLabel={assignLeaderSubmitting ? tCommon('submitting') : tCommon('save')}
            submitting={assignLeaderSubmitting}
            cancelLabel={tCommon('cancel')}
            onCancel={() => {
              setAssignLeaderMember(null);
              setAssignLeaderError(null);
            }}
          />
        </form>
      </Modal>

      <ConfirmModal
        open={removeStudentId != null}
        title={t('groupRemoveStudent')}
        message={t('groupRemoveStudentConfirm')}
        onCancel={() => setRemoveStudentId(null)}
        onConfirm={() => removeStudentId != null && handleRemoveStudent(removeStudentId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={removingStudent ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={removingStudent}
      />
    </>
  );
}

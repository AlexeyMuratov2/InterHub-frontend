import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchGroupById,
  fetchGroupMembers,
  fetchGroupLeaders,
  addGroupLeader,
  deleteGroupLeader,
  type StudentGroupDto,
  type GroupMemberDto,
  type GroupLeaderDto,
} from '../../../../entities/group';
import { fetchProgramById } from '../../../../entities/program';
import { fetchCurriculumById } from '../../../../entities/curriculum';
import { getUser } from '../../../../shared/api';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDate, formatDateTime } from '../../../../shared/i18n';
import { EntityViewLayout } from '../../../../widgets/entity-view-layout';
import { Alert, ConfirmModal, FormGroup } from '../../../../shared/ui';

function memberDisplayName(m: GroupMemberDto): string {
  return (m.fullName ?? m.chineseName ?? m.email ?? m.id) ?? '—';
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
  const [leaders, setLeaders] = useState<GroupLeaderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [addLeaderOpen, setAddLeaderOpen] = useState(false);
  const [addLeaderStudentId, setAddLeaderStudentId] = useState('');
  const [addLeaderRole, setAddLeaderRole] = useState<'headman' | 'deputy'>('headman');
  const [addLeaderFromDate, setAddLeaderFromDate] = useState('');
  const [addLeaderToDate, setAddLeaderToDate] = useState('');
  const [addLeaderSubmitting, setAddLeaderSubmitting] = useState(false);
  const [addLeaderError, setAddLeaderError] = useState<string | null>(null);
  const [deleteLeaderId, setDeleteLeaderId] = useState<string | null>(null);
  const [deletingLeader, setDeletingLeader] = useState(false);

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
            const name = user.firstName || user.lastName ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : user.email;
            setCuratorName(name || user.email);
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

  const membersById = useMemo(() => {
    const m: Record<string, GroupMemberDto> = {};
    members.forEach((mem) => (m[mem.id] = mem));
    return m;
  }, [members]);

  const handleAddLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !addLeaderStudentId || !addLeaderRole) {
      setAddLeaderError(t('groupLeaderStudentRequired'));
      return;
    }
    setAddLeaderSubmitting(true);
    setAddLeaderError(null);
    const { data, error: err } = await addGroupLeader(id, {
      studentId: addLeaderStudentId,
      role: addLeaderRole,
      fromDate: addLeaderFromDate.trim() || undefined,
      toDate: addLeaderToDate.trim() || undefined,
    });
    setAddLeaderSubmitting(false);
    if (err) {
      setAddLeaderError(err.status === 409 ? t('groupErrorLeaderExists') : (err.message ?? t('groupErrorValidation')));
      return;
    }
    if (data) {
      setLeaders((prev) => [...prev, data]);
      setAddLeaderOpen(false);
      setAddLeaderStudentId('');
      setAddLeaderRole('headman');
      setAddLeaderFromDate('');
      setAddLeaderToDate('');
    }
  };

  const handleDeleteLeader = async (leaderId: string) => {
    setDeletingLeader(true);
    setError(null);
    const { error: err } = await deleteGroupLeader(leaderId);
    setDeletingLeader(false);
    if (err) {
      setError(err.message ?? t('groupErrorLoad'));
      return;
    }
    setLeaders((prev) => prev.filter((l) => l.id !== leaderId));
    setDeleteLeaderId(null);
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
              {members.length === 0 ? (
                <p className="department-empty">{t('groupStudentsEmpty')}</p>
              ) : (
                <div className="department-table-wrap">
                  <table className="department-table">
                    <thead>
                      <tr>
                        <th>{t('name')}</th>
                        <th>Email / ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id}>
                          <td>{memberDisplayName(m)}</td>
                          <td>{m.email ?? m.studentId ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="entity-view-card">
              <h2 className="entity-view-card-title">{t('groupLeadersSection')}</h2>
              {canEdit && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="department-page-create"
                    onClick={() => {
                      setAddLeaderOpen(true);
                      setAddLeaderError(null);
                    }}
                  >
                    + {t('groupAddLeader')}
                  </button>
                </div>
              )}
              {addLeaderOpen && canEdit && (
                <form
                  onSubmit={handleAddLeader}
                  className="department-form"
                  style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: 8 }}
                >
                  {addLeaderError && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <Alert variant="error" role="alert">
                        {addLeaderError}
                      </Alert>
                    </div>
                  )}
                  <FormGroup label={t('groupLeaderStudentRequired')} htmlFor="add-leader-student">
                    <select
                      id="add-leader-student"
                      value={addLeaderStudentId}
                      onChange={(e) => setAddLeaderStudentId(e.target.value)}
                      required
                    >
                      <option value="">— {t('groupLeaderStudentRequired')} —</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {memberDisplayName(m)}
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                  <FormGroup label={t('groupLeaderRoleRequired')} htmlFor="add-leader-role">
                    <select
                      id="add-leader-role"
                      value={addLeaderRole}
                      onChange={(e) => setAddLeaderRole(e.target.value as 'headman' | 'deputy')}
                    >
                      <option value="headman">{t('headman')}</option>
                      <option value="deputy">{t('deputy')}</option>
                    </select>
                  </FormGroup>
                  <FormGroup label="From date" htmlFor="add-leader-from">
                    <input
                      id="add-leader-from"
                      type="date"
                      value={addLeaderFromDate}
                      onChange={(e) => setAddLeaderFromDate(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup label="To date" htmlFor="add-leader-to">
                    <input
                      id="add-leader-to"
                      type="date"
                      value={addLeaderToDate}
                      onChange={(e) => setAddLeaderToDate(e.target.value)}
                    />
                  </FormGroup>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="submit" className="btn-primary" disabled={addLeaderSubmitting}>
                      {addLeaderSubmitting ? tCommon('submitting') : tCommon('save')}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setAddLeaderOpen(false);
                        setAddLeaderError(null);
                      }}
                    >
                      {tCommon('cancel')}
                    </button>
                  </div>
                </form>
              )}
              {leaders.length === 0 ? (
                <p className="department-empty">{t('groupLeadersEmpty')}</p>
              ) : (
                <div className="department-table-wrap">
                  <table className="department-table">
                    <thead>
                      <tr>
                        <th>{t('name')}</th>
                        <th>{t('headman')} / {t('deputy')}</th>
                        <th>From – To</th>
                        {canEdit && <th>{t('actions')}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {leaders.map((l) => (
                        <tr key={l.id}>
                          <td>{memberDisplayName(membersById[l.studentId] ?? { id: l.studentId })}</td>
                          <td>{l.role === 'headman' ? t('headman') : t('deputy')}</td>
                          <td>
                            {l.fromDate && l.toDate
                              ? `${formatDate(l.fromDate, locale)} – ${formatDate(l.toDate, locale)}`
                              : l.fromDate
                                ? formatDate(l.fromDate, locale)
                                : '—'}
                          </td>
                          {canEdit && (
                            <td>
                              <button
                                type="button"
                                className="department-table-btn department-table-btn--danger"
                                onClick={() => setDeleteLeaderId(l.id)}
                                title={t('groupRemoveLeader')}
                                aria-label={t('groupRemoveLeader')}
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

      <ConfirmModal
        open={deleteLeaderId != null}
        title={t('groupRemoveLeader')}
        message={t('groupDeleteConfirmText')}
        onCancel={() => setDeleteLeaderId(null)}
        onConfirm={() => deleteLeaderId != null && handleDeleteLeader(deleteLeaderId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={deletingLeader ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deletingLeader}
      />
    </>
  );
}

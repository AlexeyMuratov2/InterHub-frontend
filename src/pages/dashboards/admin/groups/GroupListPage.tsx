import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchGroups,
  deleteGroup,
  type StudentGroupDto,
} from '../../../../entities/group';
import { fetchPrograms, type ProgramDto } from '../../../../entities/program';
import { fetchCurriculumById } from '../../../../entities/curriculum';
import { listTeachers } from '../../../../shared/api';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDate } from '../../../../shared/i18n';
import { truncate } from '../../../../shared/lib';
import { EntityListLayout } from '../../../../widgets/entity-list-layout';
import { ConfirmModal } from '../../../../shared/ui';

export function GroupListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const [actionUnavailableNotice, setActionUnavailableNotice] = useState(
    (location.state as { actionUnavailable?: boolean })?.actionUnavailable ?? false
  );
  const [list, setList] = useState<StudentGroupDto[]>([]);
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [curriculumNames, setCurriculumNames] = useState<Record<string, string>>({});
  const [curatorNames, setCuratorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchGroups(), fetchPrograms()]).then(([groupsRes, programsRes]) => {
      if (cancelled) return;
      if (groupsRes.error) {
        setError(groupsRes.error.message ?? t('groupErrorLoadList'));
        setList([]);
        setLoading(false);
        return;
      }
      if (programsRes.error) {
        setError(programsRes.error.message ?? t('groupErrorLoadList'));
        setList([]);
        setLoading(false);
        return;
      }
      const groups = groupsRes.data ?? [];
      const programList = programsRes.data ?? [];
      setList(groups);
      setPrograms(programList);
      const curriculumIds = [...new Set(groups.map((g) => g.curriculumId))];
      Promise.all(curriculumIds.map((id) => fetchCurriculumById(id))).then((results) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        results.forEach((r, i) => {
          if (r.data) map[curriculumIds[i]] = r.data.version;
        });
        setCurriculumNames(map);
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const buildCuratorMap = async () => {
      const map: Record<string, string> = {};
      let cursor: string | null = null;
      do {
        const res = await listTeachers({ cursor: cursor ?? undefined, limit: 30 });
        if (cancelled) return;
        if (res.data?.items) {
          for (const item of res.data.items) {
            map[item.profile.userId] = item.displayName;
          }
          cursor = res.data.nextCursor ?? null;
        } else break;
      } while (cursor);
      if (!cancelled) setCuratorNames(map);
    };
    buildCuratorMap();
    return () => {
      cancelled = true;
    };
  }, []);

  const programById = useMemo(() => {
    const m: Record<string, ProgramDto> = {};
    programs.forEach((p) => (m[p.id] = p));
    return m;
  }, [programs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (g) =>
        g.code.toLowerCase().includes(q) ||
        (g.name ?? '').toLowerCase().includes(q) ||
        (g.description ?? '').toLowerCase().includes(q)
    );
  }, [list, search]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setError(null);
    const { error: err } = await deleteGroup(id);
    setDeleting(false);
    if (err) {
      setError(err.message ?? t('groupErrorDelete', { status: String(err.status ?? 'unknown') }));
      return;
    }
    setList((prev) => prev.filter((g) => g.id !== id));
    setDeleteId(null);
    setSuccess(t('groupSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const openDeleteModal = (id: string) => setDeleteId(id);
  const closeDeleteModal = () => setDeleteId(null);

  const { t: tCommon } = useTranslation('common');

  useEffect(() => {
    if (actionUnavailableNotice) {
      const id = setTimeout(() => setActionUnavailableNotice(false), 5000);
      return () => clearTimeout(id);
    }
  }, [actionUnavailableNotice]);

  return (
    <EntityListLayout
      title={t('groupManagement')}
      subtitle={t('groupSubtitle')}
      viewOnly={!canEdit}
      viewOnlyMessage={t('viewOnlyNotice')}
      actionUnavailable={actionUnavailableNotice}
      actionUnavailableMessage={t('actionUnavailableForRole')}
      error={error}
      success={success}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('groupSearchGroups')}
      searchAriaLabel={t('groupSearchGroups')}
      createTo="/dashboards/admin/groups/new"
      createLabel={t('groupCreateGroup')}
      showCreate={canEdit}
    >
      <div className="department-table-wrap">
        {loading ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="department-empty">
            <p>{list.length === 0 ? t('groupNoGroups') : t('noResults')}</p>
            {list.length === 0 && canEdit && (
              <Link to="/dashboards/admin/groups/new" className="department-page-create">
                {t('groupCreateGroup')}
              </Link>
            )}
          </div>
        ) : (
          <table className="department-table">
            <thead>
              <tr>
                <th>{t('code')}</th>
                <th>{t('name')}</th>
                <th>{t('groupProgram')}</th>
                <th>{t('groupCurriculum')}</th>
                <th>{t('groupCurator')}</th>
                <th>{t('groupStartYear')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr
                  key={g.id}
                  className="department-table-row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboards/admin/groups/${g.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboards/admin/groups/${g.id}`);
                    }
                  }}
                  aria-label={t('viewTitle')}
                >
                  <td>
                    <Link
                      to={`/dashboards/admin/groups/${g.id}`}
                      className="department-table-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {g.code}
                    </Link>
                  </td>
                  <td title={g.name ?? undefined}>{truncate(g.name, 40)}</td>
                  <td>{programById[g.programId]?.name ?? '—'}</td>
                  <td>{curriculumNames[g.curriculumId] ?? '—'}</td>
                  <td>{g.curatorUserId ? curatorNames[g.curatorUserId] ?? '—' : '—'}</td>
                  <td>{g.startYear}</td>
                  <td>{formatDate(g.createdAt, locale)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="department-table-actions">
                      <button
                        type="button"
                        className="department-table-btn"
                        onClick={() => navigate(`/dashboards/admin/groups/${g.id}`)}
                        title={t('viewTitle')}
                        aria-label={t('viewTitle')}
                      >
                        👁
                      </button>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="department-table-btn"
                            onClick={() => navigate(`/dashboards/admin/groups/${g.id}/edit`)}
                            title={t('editTitle')}
                            aria-label={t('editTitle')}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="department-table-btn department-table-btn--danger"
                            onClick={() => openDeleteModal(g.id)}
                            title={t('deleteTitle')}
                            aria-label={t('deleteTitle')}
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={deleteId != null}
        title={t('groupDeleteConfirmTitle')}
        message={t('groupDeleteConfirmText')}
        onCancel={closeDeleteModal}
        onConfirm={() => deleteId != null && handleDelete(deleteId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={deleting ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deleting}
      />
    </EntityListLayout>
  );
}

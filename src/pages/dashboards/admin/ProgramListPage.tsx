import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchPrograms,
  deleteProgram,
  type ProgramDto,
} from '../../../entities/program';
import {
  fetchCurriculaByProgramId,
  deleteCurriculum,
  type CurriculumDto,
} from '../../../entities/curriculum';
import { useCanEditInAdmin } from '../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDate } from '../../../shared/i18n';
import { truncate } from '../../../shared/lib';
import { EntityListLayout } from '../../../widgets/entity-list-layout';
import { Alert, ConfirmModal } from '../../../shared/ui';

type CurriculumWithProgram = CurriculumDto & { programName: string; programCode: string };

export function ProgramListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const [actionUnavailableNotice, setActionUnavailableNotice] = useState(
    (location.state as { actionUnavailable?: boolean })?.actionUnavailable ?? false
  );
  const [list, setList] = useState<ProgramDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [curricula, setCurricula] = useState<CurriculumWithProgram[]>([]);
  const [curriculaLoading, setCurriculaLoading] = useState(false);
  const [curriculaError, setCurriculaError] = useState<string | null>(null);
  const [curriculumSearch, setCurriculumSearch] = useState('');
  const [deleteCurriculumId, setDeleteCurriculumId] = useState<string | null>(null);
  const [deletingCurriculum, setDeletingCurriculum] = useState(false);
  const [addCurriculumProgramId, setAddCurriculumProgramId] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchPrograms();
    setLoading(false);
    if (err) {
      const msg =
        err.status === 401
          ? t('programErrorUnauthorized')
          : err.status === 403
            ? t('programErrorForbidden')
            : err.message ?? t('programErrorLoadList');
      setError(msg);
      setList([]);
      return;
    }
    setList(data ?? []);
  };

  const loadCurricula = async (programs: ProgramDto[]) => {
    if (programs.length === 0) {
      setCurricula([]);
      setCurriculaLoading(false);
      return;
    }
    setCurriculaLoading(true);
    setCurriculaError(null);
    const results = await Promise.all(
      programs.map((p) => fetchCurriculaByProgramId(p.id).then((r) => ({ program: p, ...r })))
    );
    setCurriculaLoading(false);
    const flat: CurriculumWithProgram[] = [];
    for (const { program, data: items } of results) {
      if (items) {
        for (const c of items) {
          flat.push({
            ...c,
            programName: program.name,
            programCode: program.code,
          });
        }
      }
    }
    setCurricula(flat);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (list.length === 0) {
      setCurricula([]);
      return;
    }
    loadCurricula(list);
  }, [list]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.degreeLevel ?? '').toLowerCase().includes(q)
    );
  }, [list, search]);

  const filteredCurricula = useMemo(() => {
    if (!curriculumSearch.trim()) return curricula;
    const q = curriculumSearch.trim().toLowerCase();
    return curricula.filter(
      (c) =>
        c.programCode.toLowerCase().includes(q) ||
        c.programName.toLowerCase().includes(q) ||
        c.version.toLowerCase().includes(q) ||
        (c.notes ?? '').toLowerCase().includes(q)
    );
  }, [curricula, curriculumSearch]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setError(null);
    const { error: err } = await deleteProgram(id);
    setDeleting(false);
    if (err) {
      const msg =
        err.status === 403
          ? t('programErrorForbidden')
          : err.status === 404
            ? t('programNotFoundOrDeleted')
            : err.message ?? t('programErrorDelete', { status: String(err.status ?? 'unknown') });
      setError(msg);
      return;
    }
    setList((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    setSuccess(t('programSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const openDeleteModal = (id: string) => setDeleteId(id);
  const closeDeleteModal = () => setDeleteId(null);

  const handleDeleteCurriculum = async (curriculumId: string) => {
    setDeletingCurriculum(true);
    setCurriculaError(null);
    const { error: err } = await deleteCurriculum(curriculumId);
    setDeletingCurriculum(false);
    if (err) {
      const msg =
        err.status === 403
          ? t('programErrorForbidden')
          : err.status === 404
            ? t('curriculumNotFoundOrDeleted')
            : err.message ?? t('curriculumErrorDelete', { status: String(err.status ?? 'unknown') });
      setCurriculaError(msg);
      return;
    }
    setCurricula((prev) => prev.filter((c) => c.id !== curriculumId));
    setDeleteCurriculumId(null);
    setSuccess(t('curriculumSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const openDeleteCurriculumModal = (id: string) => setDeleteCurriculumId(id);
  const closeDeleteCurriculumModal = () => setDeleteCurriculumId(null);

  const { t: tCommon } = useTranslation('common');

  useEffect(() => {
    if (actionUnavailableNotice) {
      const id = setTimeout(() => setActionUnavailableNotice(false), 5000);
      return () => clearTimeout(id);
    }
  }, [actionUnavailableNotice]);

  return (
    <EntityListLayout
      title={t('programManagement')}
      subtitle={t('programSubtitle')}
      viewOnly={!canEdit}
      viewOnlyMessage={t('viewOnlyNotice')}
      actionUnavailable={actionUnavailableNotice}
      actionUnavailableMessage={t('actionUnavailableForRole')}
      error={error}
      success={success}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('programSearch')}
      searchAriaLabel={t('programSearch')}
      createTo="/dashboards/admin/programs/new"
      createLabel={t('programCreate')}
      showCreate={canEdit}
    >
      <div className="department-table-wrap">
        {loading ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="department-empty">
            <p>{list.length === 0 ? t('programNoPrograms') : t('noResults')}</p>
            {list.length === 0 && canEdit && (
              <Link to="/dashboards/admin/programs/new" className="department-page-create">
                {t('programAdd')}
              </Link>
            )}
          </div>
        ) : (
          <table className="department-table">
            <thead>
              <tr>
                <th>{t('code')}</th>
                <th>{t('name')}</th>
                <th>{t('description')}</th>
                <th>{t('programDegreeLevel')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="department-table-row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboards/admin/programs/${p.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboards/admin/programs/${p.id}`);
                    }
                  }}
                  aria-label={t('viewTitle')}
                >
                  <td>{p.code}</td>
                  <td>{p.name}</td>
                  <td title={p.description ?? undefined}>{truncate(p.description, 60)}</td>
                  <td>{p.degreeLevel ?? '—'}</td>
                  <td>{formatDate(p.createdAt, locale)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="department-table-actions">
                      <button
                        type="button"
                        className="department-table-btn"
                        onClick={() => navigate(`/dashboards/admin/programs/${p.id}`)}
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
                            onClick={() => navigate(`/dashboards/admin/programs/${p.id}/edit`)}
                            title={t('editTitle')}
                            aria-label={t('editTitle')}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="department-table-btn department-table-btn--danger"
                            onClick={() => openDeleteModal(p.id)}
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
        title={t('programDeleteConfirmTitle')}
        message={t('programDeleteConfirmText')}
        onCancel={closeDeleteModal}
        onConfirm={() => deleteId != null && handleDelete(deleteId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={deleting ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deleting}
      />

      {/* Секция «Учебные планы»: заголовок и тулбар вне карточки, как на странице программ */}
      <section style={{ marginTop: '2.5rem' }} aria-labelledby="curriculum-section-title">
        <h2 id="curriculum-section-title" className="department-page-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {t('curriculumSectionTitle')}
        </h2>
        <p className="department-page-subtitle" style={{ marginBottom: '1rem' }}>
          {t('curriculumSectionSubtitle')}
        </p>
        {curriculaError != null && curriculaError !== '' && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error" role="alert">
              {curriculaError}
            </Alert>
          </div>
        )}
        <div className="department-page-toolbar">
          <div className="department-page-search-wrap">
            <input
              type="search"
              className="department-page-search"
              placeholder={t('curriculumSearchPlaceholder')}
              value={curriculumSearch}
              onChange={(e) => setCurriculumSearch(e.target.value)}
              aria-label={t('curriculumSearchPlaceholder')}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canEdit && (
              <>
                <select
                  value={addCurriculumProgramId}
                  onChange={(e) => setAddCurriculumProgramId(e.target.value)}
                  className="department-form select-inline"
                  style={{ width: 'auto', minWidth: '180px', padding: '0.5rem 0.75rem' }}
                  aria-label={t('curriculumSelectProgram')}
                >
                  <option value="">{t('curriculumSelectProgram')}</option>
                  {list.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                <Link
                  to={
                    addCurriculumProgramId
                      ? `/dashboards/admin/programs/${addCurriculumProgramId}/curricula/new`
                      : '#'
                  }
                  className="department-page-create"
                  style={{ pointerEvents: addCurriculumProgramId ? undefined : 'none', opacity: addCurriculumProgramId ? 1 : 0.6 }}
                  aria-disabled={!addCurriculumProgramId}
                >
                  <span>+</span>
                  {t('curriculumAdd')}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="department-table-wrap">
        {curriculaLoading ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : filteredCurricula.length === 0 ? (
          <div className="department-empty">
            <p>
              {curricula.length === 0 ? t('curriculumNoCurriculaOnPage') : t('noResults')}
            </p>
            {list.length > 0 && (
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{t('curriculumAddHint')}</p>
            )}
          </div>
        ) : (
          <table className="department-table">
            <thead>
              <tr>
                <th>{t('curriculumProgram')}</th>
                <th>{t('curriculumVersion')}</th>
                <th>{t('curriculumStartYear')}</th>
                <th>{t('curriculumEndYear')}</th>
                <th>{t('curriculumIsActive')}</th>
                <th>{t('curriculumStatus')}</th>
                <th>{t('curriculumNotes')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCurricula.map((c) => (
                <tr
                  key={c.id}
                  className="department-table-row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboards/admin/programs/${c.programId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboards/admin/programs/${c.programId}`);
                    }
                  }}
                  aria-label={t('viewTitle')}
                >
                  <td>
                    <Link
                      to={`/dashboards/admin/programs/${c.programId}`}
                      style={{ color: '#2563eb', textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.programName} ({c.programCode})
                    </Link>
                  </td>
                  <td>{c.version}</td>
                  <td>{c.startYear}</td>
                  <td>{c.endYear ?? '—'}</td>
                  <td>{c.isActive ? t('curriculumActiveYes') : t('curriculumActiveNo')}</td>
                  <td>{c.status}</td>
                  <td title={c.notes ?? undefined}>
                    {truncate(c.notes, 40)}
                  </td>
                  <td>{formatDate(c.createdAt, locale)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="department-table-actions">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="department-table-btn"
                            onClick={() => navigate(`/dashboards/admin/programs/curricula/${c.id}/edit`)}
                            title={t('editTitle')}
                            aria-label={t('editTitle')}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="department-table-btn department-table-btn--danger"
                            onClick={() => openDeleteCurriculumModal(c.id)}
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
      </section>

      <ConfirmModal
        open={deleteCurriculumId != null}
        title={t('curriculumDeleteConfirmTitle')}
        message={t('curriculumDeleteConfirmText')}
        onCancel={closeDeleteCurriculumModal}
        onConfirm={() => deleteCurriculumId != null && handleDeleteCurriculum(deleteCurriculumId)}
        cancelLabel={tCommon('cancel')}
        confirmLabel={deletingCurriculum ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deletingCurriculum}
      />
    </EntityListLayout>
  );
}

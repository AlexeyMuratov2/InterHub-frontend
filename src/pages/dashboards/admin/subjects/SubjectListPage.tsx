import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchSubjects,
  fetchAssessmentTypes,
  deleteSubject,
  deleteAssessmentType,
  type SubjectDto,
  type AssessmentTypeDto,
} from '../../../../entities/subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDate } from '../../../../shared/i18n';
import { getAssessmentTypeDisplayName } from './utils';

function truncate(str: string | null, max: number): string {
  if (!str) return '—';
  return str.length <= max ? str : str.slice(0, max) + '…';
}

export function SubjectListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const [actionUnavailableNotice, setActionUnavailableNotice] = useState(
    (location.state as { actionUnavailable?: boolean })?.actionUnavailable ?? false
  );

  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentTypeDto[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [deletingType, setDeletingType] = useState(false);

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    setError(null);
    const { data, error: err } = await fetchSubjects();
    setLoadingSubjects(false);
    if (err) {
      setError(err.message ?? t('subjectErrorLoadList'));
      setSubjects([]);
      return;
    }
    setSubjects(data ?? []);
  };

  const loadAssessmentTypes = async () => {
    setLoadingTypes(true);
    setError(null);
    const { data, error: err } = await fetchAssessmentTypes();
    setLoadingTypes(false);
    if (err) {
      setError(err.message ?? t('subjectAssessmentTypeErrorLoadList'));
      setAssessmentTypes([]);
      return;
    }
    setAssessmentTypes(data ?? []);
  };

  useEffect(() => {
    loadSubjects();
  }, []);
  useEffect(() => {
    loadAssessmentTypes();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const q = subjectSearch.trim().toLowerCase();
    return subjects.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        (s.chineseName ?? '').toLowerCase().includes(q) ||
        (s.englishName ?? '').toLowerCase().includes(q)
    );
  }, [subjects, subjectSearch]);

  const filteredTypes = useMemo(() => {
    if (!typeSearch.trim()) return assessmentTypes;
    const q = typeSearch.trim().toLowerCase();
    return assessmentTypes.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        (a.chineseName ?? '').toLowerCase().includes(q) ||
        (a.englishName ?? '').toLowerCase().includes(q)
    );
  }, [assessmentTypes, typeSearch]);

  const handleDeleteSubject = async (id: string) => {
    setDeletingSubject(true);
    setError(null);
    const { error: err } = await deleteSubject(id);
    setDeletingSubject(false);
    if (err) {
      setError(err.message ?? t('subjectErrorDelete', { status: String(err.status ?? 'unknown') }));
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setDeleteSubjectId(null);
    setSuccess(t('subjectSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteType = async (id: string) => {
    setDeletingType(true);
    setError(null);
    const { error: err } = await deleteAssessmentType(id);
    setDeletingType(false);
    if (err) {
      setError(err.message ?? t('subjectAssessmentTypeErrorDelete', { status: String(err.status ?? 'unknown') }));
      return;
    }
    setAssessmentTypes((prev) => prev.filter((a) => a.id !== id));
    setDeleteTypeId(null);
    setSuccess(t('subjectAssessmentTypeSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
  };

  useEffect(() => {
    if (actionUnavailableNotice) {
      const id = setTimeout(() => setActionUnavailableNotice(false), 5000);
      return () => clearTimeout(id);
    }
  }, [actionUnavailableNotice]);

  const tCommon = useTranslation('common').t;

  return (
    <div className="department-page subject-page">
      <h1 className="department-page-title">{t('subjectManagement')}</h1>
      <p className="department-page-subtitle">{t('subjectSubtitle')}</p>

      {!canEdit && (
        <div className="department-alert department-alert--info" role="status">
          {t('viewOnlyNotice')}
        </div>
      )}
      {actionUnavailableNotice && (
        <div className="department-alert department-alert--info" role="alert">
          {t('actionUnavailableForRole')}
        </div>
      )}
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="department-alert department-alert--success" role="status">
          {success}
        </div>
      )}

      {/* ——— Disciplines (Subjects) ——— */}
      <section className="department-table-wrap" style={{ marginBottom: '2.5rem' }}>
        <h2 className="department-page-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {t('subjectSectionDisciplines')}
        </h2>
        <p className="department-page-subtitle" style={{ marginBottom: '1rem' }}>
          {t('subjectSectionDisciplinesHint')}
        </p>
        <div className="department-page-toolbar">
          <div className="department-page-search-wrap">
            <input
              type="search"
              className="department-page-search"
              placeholder={t('subjectSearchPlaceholder')}
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              aria-label={t('subjectSearchPlaceholder')}
            />
          </div>
          {canEdit && (
            <Link to="/dashboards/admin/subjects/new" className="department-page-create">
              <span>+</span>
              {t('subjectCreate')}
            </Link>
          )}
        </div>
        {loadingSubjects ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="department-empty">
            <p>
              {subjects.length === 0 ? t('subjectNoItems') : t('noResults')}
            </p>
            {subjects.length === 0 && canEdit && (
              <Link to="/dashboards/admin/subjects/new" className="department-page-create">
                {t('subjectAddFirst')}
              </Link>
            )}
          </div>
        ) : (
          <table className="department-table">
            <thead>
              <tr>
                <th>{t('code')}</th>
                <th>{t('subjectChineseName')}</th>
                <th>{t('subjectEnglishName')}</th>
                <th>{t('description')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((s) => (
                <tr
                  key={s.id}
                  className="department-table-row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboards/admin/subjects/${s.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboards/admin/subjects/${s.id}`);
                    }
                  }}
                  aria-label={t('viewTitle')}
                >
                  <td>{s.code}</td>
                  <td>{s.chineseName}</td>
                  <td>{s.englishName ?? '—'}</td>
                  <td title={s.description ?? undefined}>{truncate(s.description, 40)}</td>
                  <td>{formatDate(s.createdAt, locale)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="department-table-actions">
                      <button
                        type="button"
                        className="department-table-btn"
                        onClick={() => navigate(`/dashboards/admin/subjects/${s.id}`)}
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
                            onClick={() => navigate(`/dashboards/admin/subjects/${s.id}/edit`)}
                            title={t('editTitle')}
                            aria-label={t('editTitle')}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="department-table-btn department-table-btn--danger"
                            onClick={() => setDeleteSubjectId(s.id)}
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
      </section>

      {/* ——— Assessment types ——— */}
      <section className="department-table-wrap">
        <h2 className="department-page-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {t('subjectSectionAssessmentTypes')}
        </h2>
        <p className="department-page-subtitle" style={{ marginBottom: '1rem' }}>
          {t('subjectSectionAssessmentTypesHint')}
        </p>
        <div className="department-page-toolbar">
          <div className="department-page-search-wrap">
            <input
              type="search"
              className="department-page-search"
              placeholder={t('subjectAssessmentTypeSearchPlaceholder')}
              value={typeSearch}
              onChange={(e) => setTypeSearch(e.target.value)}
              aria-label={t('subjectAssessmentTypeSearchPlaceholder')}
            />
          </div>
          {canEdit && (
            <Link to="/dashboards/admin/subjects/assessment-types/new" className="department-page-create">
              <span>+</span>
              {t('subjectAssessmentTypeCreate')}
            </Link>
          )}
        </div>
        {loadingTypes ? (
          <div className="department-empty">
            <p>{t('loadingList')}</p>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="department-empty">
            <p>
              {assessmentTypes.length === 0 ? t('subjectAssessmentTypeNoItems') : t('noResults')}
            </p>
            {assessmentTypes.length === 0 && canEdit && (
              <Link to="/dashboards/admin/subjects/assessment-types/new" className="department-page-create">
                {t('subjectAssessmentTypeAddFirst')}
              </Link>
            )}
          </div>
        ) : (
          <table className="department-table">
            <thead>
              <tr>
                <th>{t('code')}</th>
                <th>{t('name')}</th>
                <th>{t('subjectAssessmentTypeIsGraded')}</th>
                <th>{t('subjectAssessmentTypeIsFinal')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map((a) => (
                <tr
                  key={a.id}
                  className="department-table-row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboards/admin/subjects/assessment-types/${a.id}/edit`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboards/admin/subjects/assessment-types/${a.id}/edit`);
                    }
                  }}
                  aria-label={t('editTitle')}
                >
                  <td>{a.code}</td>
                  <td>{getAssessmentTypeDisplayName(a.code, t, { chineseName: a.chineseName, englishName: a.englishName })}</td>
                  <td>{a.isGraded ? t('curriculumActiveYes') : t('curriculumActiveNo')}</td>
                  <td>{a.isFinal ? t('curriculumActiveYes') : t('curriculumActiveNo')}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="department-table-actions">
                      <button
                        type="button"
                        className="department-table-btn"
                        onClick={() => navigate(`/dashboards/admin/subjects/assessment-types/${a.id}/edit`)}
                        title={t('editTitle')}
                        aria-label={t('editTitle')}
                      >
                        ✎
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          className="department-table-btn department-table-btn--danger"
                          onClick={() => setDeleteTypeId(a.id)}
                          title={t('deleteTitle')}
                          aria-label={t('deleteTitle')}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Delete subject modal */}
      {deleteSubjectId && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeleteSubjectId(null)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('subjectDeleteConfirmTitle')}</h3>
            <p>{t('subjectDeleteConfirmText')}</p>
            <div className="department-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setDeleteSubjectId(null)}>
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className="btn-delete"
                disabled={deletingSubject}
                onClick={() => handleDeleteSubject(deleteSubjectId)}
              >
                {deletingSubject ? tCommon('submitting') : tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete assessment type modal */}
      {deleteTypeId && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeleteTypeId(null)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('subjectAssessmentTypeDeleteConfirmTitle')}</h3>
            <p>{t('subjectAssessmentTypeDeleteConfirmText')}</p>
            <div className="department-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setDeleteTypeId(null)}>
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className="btn-delete"
                disabled={deletingType}
                onClick={() => handleDeleteType(deleteTypeId)}
              >
                {deletingType ? tCommon('submitting') : tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchAcademicYearById,
  fetchSemestersByYear,
  deleteAcademicYear,
  createSemester,
  updateSemester,
  deleteSemester,
  type AcademicYearDto,
  type SemesterDto,
} from '../../../../../entities/academic';
import { useCanEditInAdmin } from '../../../../../app/hooks/useCanEditInAdmin';
import { useCanDeleteInAdmin } from '../../../../../app/hooks/useCanDeleteInAdmin';
import { useTranslation, formatDate } from '../../../../../shared/i18n';
import { EntityViewLayout } from '../../../../../widgets/entity-view-layout';
import { Alert, ConfirmModal, FormGroup, FormActions, Modal } from '../../../../../shared/ui';
import { parseFieldErrors } from '../../../../../shared/lib';
import type { ErrorResponse } from '../../../../../shared/api/types';

export function AcademicYearViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const canDelete = useCanDeleteInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const [year, setYear] = useState<AcademicYearDto | null>(null);
  const [semesters, setSemesters] = useState<SemesterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [deleteYearId, setDeleteYearId] = useState<string | null>(null);
  const [deletingYear, setDeletingYear] = useState(false);
  const [deleteSemesterId, setDeleteSemesterId] = useState<string | null>(null);
  const [deletingSemester, setDeletingSemester] = useState(false);

  const [createSemesterOpen, setCreateSemesterOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<SemesterDto | null>(null);
  const [semesterForm, setSemesterForm] = useState({
    number: '',
    name: '',
    startDate: '',
    endDate: '',
    examStartDate: '',
    examEndDate: '',
    weekCount: '16',
    isCurrent: false,
  });
  const [semesterSubmitting, setSemesterSubmitting] = useState(false);
  const [semesterError, setSemesterError] = useState<string | null>(null);
  const [semesterFieldErrors, setSemesterFieldErrors] = useState<Record<string, string>>({});

  const loadSemesters = useCallback(() => {
    if (!id) return;
    fetchSemestersByYear(id).then(({ data, error: err }) => {
      if (!err && data) setSemesters(data);
    });
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAcademicYearById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err || !data) {
        setNotFound(true);
        setYear(null);
        return;
      }
      setYear(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchSemestersByYear(id).then(({ data, error: err }) => {
      if (cancelled) return;
      if (!err && data) setSemesters(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDeleteYear = async () => {
    if (!id || !deleteYearId) return;
    setDeletingYear(true);
    setError(null);
    const { error: err } = await deleteAcademicYear(id);
    setDeletingYear(false);
    setDeleteYearId(null);
    if (err) {
      setError(err.message ?? t('academicErrorDeleteYear', { status: String(err.status ?? '') }) ?? null);
      return;
    }
    setSuccess(t('academicSuccessYearDeleted'));
    setTimeout(() => setSuccess(null), 3000);
    navigate('/dashboards/admin/settings', { replace: true });
  };

  const handleDeleteSemester = async () => {
    if (!deleteSemesterId) return;
    setDeletingSemester(true);
    setError(null);
    const { error: err } = await deleteSemester(deleteSemesterId);
    setDeletingSemester(false);
    setDeleteSemesterId(null);
    if (err) {
      setError(err.message ?? t('academicErrorDeleteSemester', { status: String(err.status ?? '') }));
      return;
    }
    setSuccess(t('academicSuccessSemesterDeleted'));
    setTimeout(() => setSuccess(null), 3000);
    loadSemesters();
  };

  const openCreateSemester = () => {
    setSemesterForm({
      number: '',
      name: '',
      startDate: year?.startDate ?? '',
      endDate: year?.endDate ?? '',
      examStartDate: '',
      examEndDate: '',
      weekCount: '16',
      isCurrent: false,
    });
    setSemesterError(null);
    setSemesterFieldErrors({});
    setCreateSemesterOpen(true);
  };

  const openEditSemester = (s: SemesterDto) => {
    setEditSemester(s);
    setSemesterForm({
      number: String(s.number),
      name: s.name ?? '',
      startDate: s.startDate,
      endDate: s.endDate,
      examStartDate: s.examStartDate ?? '',
      examEndDate: s.examEndDate ?? '',
      weekCount: String(s.weekCount),
      isCurrent: s.isCurrent,
    });
    setSemesterError(null);
    setSemesterFieldErrors({});
  };

  const closeSemesterModal = () => {
    setCreateSemesterOpen(false);
    setEditSemester(null);
  };

  const validateSemesterForm = (): boolean => {
    const err: Record<string, string> = {};
    const num = parseInt(semesterForm.number, 10);
    if (!semesterForm.number.trim() || isNaN(num) || num < 1) err.number = t('academicErrorNumberMin');
    const wc = parseInt(semesterForm.weekCount, 10);
    if (semesterForm.weekCount.trim() && (isNaN(wc) || wc < 1 || wc > 52)) err.weekCount = t('academicErrorWeekCountRange');
    if (semesterForm.startDate && semesterForm.endDate && semesterForm.endDate < semesterForm.startDate) err.endDate = t('academicErrorEndBeforeStart');
    setSemesterFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSemesterError(null);
    setSemesterFieldErrors({});
    if (!validateSemesterForm()) return;
    setSemesterSubmitting(true);
    const num = parseInt(semesterForm.number, 10);
    const weekCount = semesterForm.weekCount.trim() ? parseInt(semesterForm.weekCount, 10) : 16;
    const { data, error: err } = await createSemester(id, {
      number: num,
      name: semesterForm.name.trim() || null,
      startDate: semesterForm.startDate,
      endDate: semesterForm.endDate,
      examStartDate: semesterForm.examStartDate.trim() || null,
      examEndDate: semesterForm.examEndDate.trim() || null,
      weekCount,
      isCurrent: semesterForm.isCurrent || undefined,
    });
    setSemesterSubmitting(false);
    if (err) {
      if (err.status === 409) setSemesterError(t('academicErrorSemesterExists'));
      else if (typeof (err as ErrorResponse).details === 'object') {
        setSemesterFieldErrors(parseFieldErrors((err as ErrorResponse).details));
        setSemesterError(t('academicErrorValidation'));
      } else setSemesterError(err.message ?? t('academicErrorCreateSemester'));
      return;
    }
    if (data) {
      closeSemesterModal();
      loadSemesters();
    }
  };

  const handleUpdateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSemester) return;
    setSemesterError(null);
    setSemesterFieldErrors({});
    if (!validateSemesterForm()) return;
    setSemesterSubmitting(true);
    const weekCount = semesterForm.weekCount.trim() ? parseInt(semesterForm.weekCount, 10) : undefined;
    const { error: err } = await updateSemester(editSemester.id, {
      name: semesterForm.name.trim() || null,
      startDate: semesterForm.startDate || undefined,
      endDate: semesterForm.endDate || undefined,
      examStartDate: semesterForm.examStartDate.trim() || null,
      examEndDate: semesterForm.examEndDate.trim() || null,
      weekCount,
      isCurrent: semesterForm.isCurrent,
    });
    setSemesterSubmitting(false);
    if (err) {
      if (typeof (err as ErrorResponse).details === 'object') {
        setSemesterFieldErrors(parseFieldErrors((err as ErrorResponse).details));
        setSemesterError(t('academicErrorValidation'));
      } else setSemesterError(err.message ?? t('academicErrorUpdateSemester'));
      return;
    }
    closeSemesterModal();
    loadSemesters();
  };

  return (
    <>
      <EntityViewLayout
        loading={loading}
        notFound={notFound}
        error={error}
        notFoundMessage={t('academicYearNotFound')}
        errorMessage={error ?? undefined}
        backTo="/dashboards/admin/settings"
        backLabel={t('academicBackToSettings')}
        viewOnly={!canEdit}
        viewOnlyMessage={t('viewOnlyNotice')}
        title={year ? t('academicYearViewTitle', { name: year.name }) : ''}
        onEditClick={canEdit ? () => navigate(`/dashboards/admin/settings/years/${id}/edit`) : undefined}
        editLabel={t('editTitle')}
        extraActions={
          canDelete && year ? (
            <button
              type="button"
              className="department-table-btn department-table-btn--danger"
              onClick={() => setDeleteYearId(id ?? null)}
              title={t('deleteTitle')}
              aria-label={t('deleteTitle')}
            >
              🗑
            </button>
          ) : null
        }
      >
        {year && (
          <>
            {success && (
              <div className="academic-view-message">
                <Alert variant="success" role="status">
                  {success}
                </Alert>
              </div>
            )}

            <div className="academic-year-info">
              <div className="academic-year-info-row">
                <span className="academic-year-info-label">{t('academicStartDate')}</span>
                <span className="academic-year-info-value">{formatDate(year.startDate, locale)}</span>
              </div>
              <div className="academic-year-info-row">
                <span className="academic-year-info-label">{t('academicEndDate')}</span>
                <span className="academic-year-info-value">{formatDate(year.endDate, locale)}</span>
              </div>
              <div className="academic-year-info-row">
                <span className="academic-year-info-label">{t('academicIsCurrent')}</span>
                <span className="academic-year-info-value">{year.isCurrent ? '✓' : '—'}</span>
              </div>
            </div>

            <h2 className="academic-semesters-heading">{t('academicSemestersSection')}</h2>
            <p className="academic-semesters-subtitle">{t('academicSemestersSubtitle')}</p>
            {canEdit && (
              <div className="academic-semesters-toolbar">
                <button
                  type="button"
                  className="department-table-btn department-table-btn--primary"
                  onClick={openCreateSemester}
                >
                  + {t('academicAddSemester')}
                </button>
              </div>
            )}
            <div className="department-table-wrap">
              {semesters.length === 0 ? (
                <p className="department-empty" style={{ padding: '1rem' }}>{t('academicNoSemesters')}</p>
              ) : (
                <table className="department-table">
                  <thead>
                    <tr>
                      <th>{t('academicSemesterNumber')}</th>
                      <th>{t('academicSemesterName')}</th>
                      <th>{t('academicStartDate')}</th>
                      <th>{t('academicEndDate')}</th>
                      <th>{t('academicWeekCount')}</th>
                      <th>{t('academicExamPeriod')}</th>
                      <th>{t('academicIsCurrent')}</th>
                      {canEdit && <th>{t('actions')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {semesters.map((s) => (
                      <tr key={s.id}>
                        <td>{s.number}</td>
                        <td>{s.name ?? '—'}</td>
                        <td>{formatDate(s.startDate, locale)}</td>
                        <td>{formatDate(s.endDate, locale)}</td>
                        <td>{s.weekCount}</td>
                        <td>
                          {s.examStartDate && s.examEndDate
                            ? `${formatDate(s.examStartDate, locale)} – ${formatDate(s.examEndDate, locale)}`
                            : '—'}
                        </td>
                        <td>{s.isCurrent ? '✓' : '—'}</td>
                        {canEdit && (
                          <td>
                            <div className="department-table-actions">
                              <button
                                type="button"
                                className="department-table-btn"
                                onClick={() => openEditSemester(s)}
                                title={t('editTitle')}
                                aria-label={t('editTitle')}
                              >
                                ✎
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  className="department-table-btn department-table-btn--danger"
                                  onClick={() => setDeleteSemesterId(s.id)}
                                  title={t('deleteTitle')}
                                  aria-label={t('deleteTitle')}
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </EntityViewLayout>

      <ConfirmModal
        open={deleteYearId != null}
        title={t('academicDeleteYearConfirmTitle')}
        message={t('academicDeleteYearConfirmText')}
        onCancel={() => setDeleteYearId(null)}
        onConfirm={handleDeleteYear}
        cancelLabel={tCommon('cancelButton')}
        confirmLabel={deletingYear ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deletingYear}
        confirmVariant="danger"
      />

      <ConfirmModal
        open={deleteSemesterId != null}
        title={t('academicDeleteSemesterConfirmTitle')}
        message={t('academicDeleteSemesterConfirmText')}
        onCancel={() => setDeleteSemesterId(null)}
        onConfirm={handleDeleteSemester}
        cancelLabel={tCommon('cancelButton')}
        confirmLabel={deletingSemester ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deletingSemester}
        confirmVariant="danger"
      />

      <Modal
        open={createSemesterOpen}
        onClose={closeSemesterModal}
        title={t('academicCreateSemesterTitle')}
        variant="form"
        modalClassName="academic-semester-modal"
      >
        <form className="department-form" onSubmit={handleCreateSemester}>
          {semesterError && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <Alert variant="error" role="alert">
                {semesterError}
              </Alert>
            </div>
          )}
          <FormGroup label={t('academicSemesterNumberRequired')} htmlFor="sem-number" error={semesterFieldErrors.number}>
            <input
              id="sem-number"
              type="number"
              min={1}
              value={semesterForm.number}
              onChange={(e) => setSemesterForm((p) => ({ ...p, number: e.target.value }))}
              placeholder={t('academicSemesterNumberPlaceholder')}
              aria-invalid={!!semesterFieldErrors.number}
            />
          </FormGroup>
          <FormGroup label={t('academicSemesterName')} htmlFor="sem-name">
            <input
              id="sem-name"
              type="text"
              value={semesterForm.name}
              onChange={(e) => setSemesterForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t('academicSemesterNamePlaceholder')}
            />
          </FormGroup>
          <div className="form-row form-row--2">
            <FormGroup label={t('academicStartDateRequired')} htmlFor="sem-start" error={semesterFieldErrors.startDate}>
              <input
                id="sem-start"
                type="date"
                value={semesterForm.startDate}
                onChange={(e) => setSemesterForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label={t('academicEndDateRequired')} htmlFor="sem-end" error={semesterFieldErrors.endDate}>
              <input
                id="sem-end"
                type="date"
                value={semesterForm.endDate}
                onChange={(e) => setSemesterForm((p) => ({ ...p, endDate: e.target.value }))}
              />
            </FormGroup>
          </div>
          <FormGroup label={t('academicExamPeriod')} htmlFor="sem-exam-start">
            <div className="form-row form-row--2">
              <div className="form-group">
                <label htmlFor="sem-exam-start">{t('academicStartDate')}</label>
                <input
                  id="sem-exam-start"
                  type="date"
                  value={semesterForm.examStartDate}
                  onChange={(e) => setSemesterForm((p) => ({ ...p, examStartDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="sem-exam-end">{t('academicEndDate')}</label>
                <input
                  id="sem-exam-end"
                  type="date"
                  value={semesterForm.examEndDate}
                  onChange={(e) => setSemesterForm((p) => ({ ...p, examEndDate: e.target.value }))}
                />
              </div>
            </div>
          </FormGroup>
          <FormGroup label={t('academicWeekCount')} htmlFor="sem-weeks" error={semesterFieldErrors.weekCount} hint={t('academicWeekCountHint')}>
            <input
              id="sem-weeks"
              type="number"
              min={1}
              max={52}
              value={semesterForm.weekCount}
              onChange={(e) => setSemesterForm((p) => ({ ...p, weekCount: e.target.value }))}
              placeholder={t('academicWeekCountPlaceholder')}
            />
          </FormGroup>
          <FormGroup label={t('academicIsCurrent')} htmlFor="sem-current">
            <div className="form-check">
              <input
                id="sem-current"
                type="checkbox"
                checked={semesterForm.isCurrent}
                onChange={(e) => setSemesterForm((p) => ({ ...p, isCurrent: e.target.checked }))}
              />
              <span className="form-check-label">{semesterForm.isCurrent ? '✓' : '—'}</span>
            </div>
          </FormGroup>
          <FormActions
            submitLabel={semesterSubmitting ? t('academicCreating') : tCommon('create')}
            submitting={semesterSubmitting}
            onCancel={closeSemesterModal}
            cancelLabel={tCommon('cancelButton')}
          />
        </form>
      </Modal>

      <Modal
        open={editSemester != null}
        onClose={closeSemesterModal}
        title={t('academicEditSemesterTitle')}
        variant="form"
        modalClassName="academic-semester-modal"
      >
        <form className="department-form" onSubmit={handleUpdateSemester}>
          {semesterError && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <Alert variant="error" role="alert">
                {semesterError}
              </Alert>
            </div>
          )}
          <FormGroup label={t('academicSemesterNumberRequired')} htmlFor="edit-sem-number" hint={t('academicSemesterNumberReadOnly')}>
            <input
              id="edit-sem-number"
              type="number"
              min={1}
              value={semesterForm.number}
              readOnly
              className="read-only"
              aria-readonly="true"
            />
          </FormGroup>
          <FormGroup label={t('academicSemesterName')} htmlFor="edit-sem-name">
            <input
              id="edit-sem-name"
              type="text"
              value={semesterForm.name}
              onChange={(e) => setSemesterForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t('academicSemesterNamePlaceholder')}
            />
          </FormGroup>
          <div className="form-row form-row--2">
            <FormGroup label={t('academicStartDateRequired')} htmlFor="edit-sem-start" error={semesterFieldErrors.startDate}>
              <input
                id="edit-sem-start"
                type="date"
                value={semesterForm.startDate}
                onChange={(e) => setSemesterForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label={t('academicEndDateRequired')} htmlFor="edit-sem-end" error={semesterFieldErrors.endDate}>
              <input
                id="edit-sem-end"
                type="date"
                value={semesterForm.endDate}
                onChange={(e) => setSemesterForm((p) => ({ ...p, endDate: e.target.value }))}
              />
            </FormGroup>
          </div>
          <FormGroup label={t('academicExamPeriod')} htmlFor="edit-sem-exam-start">
            <div className="form-row form-row--2">
              <div className="form-group">
                <label htmlFor="edit-sem-exam-start">{t('academicStartDate')}</label>
                <input
                  id="edit-sem-exam-start"
                  type="date"
                  value={semesterForm.examStartDate}
                  onChange={(e) => setSemesterForm((p) => ({ ...p, examStartDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-sem-exam-end">{t('academicEndDate')}</label>
                <input
                  id="edit-sem-exam-end"
                  type="date"
                  value={semesterForm.examEndDate}
                  onChange={(e) => setSemesterForm((p) => ({ ...p, examEndDate: e.target.value }))}
                />
              </div>
            </div>
          </FormGroup>
          <FormGroup label={t('academicWeekCount')} htmlFor="edit-sem-weeks" error={semesterFieldErrors.weekCount} hint={t('academicWeekCountHint')}>
            <input
              id="edit-sem-weeks"
              type="number"
              min={1}
              max={52}
              value={semesterForm.weekCount}
              onChange={(e) => setSemesterForm((p) => ({ ...p, weekCount: e.target.value }))}
              placeholder={t('academicWeekCountPlaceholder')}
            />
          </FormGroup>
          <FormGroup label={t('academicIsCurrent')} htmlFor="edit-sem-current">
            <div className="form-check">
              <input
                id="edit-sem-current"
                type="checkbox"
                checked={semesterForm.isCurrent}
                onChange={(e) => setSemesterForm((p) => ({ ...p, isCurrent: e.target.checked }))}
              />
              <span className="form-check-label">{semesterForm.isCurrent ? '✓' : '—'}</span>
            </div>
          </FormGroup>
          <FormActions
            submitLabel={semesterSubmitting ? t('academicSaving') : tCommon('save')}
            submitting={semesterSubmitting}
            onCancel={closeSemesterModal}
            cancelLabel={tCommon('cancelButton')}
          />
        </form>
      </Modal>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CURRICULUM_STATUS,
  fetchCurriculumById,
  updateCurriculum,
  type CurriculumStatus,
  type UpdateCurriculumRequest,
} from '../../../../entities/curriculum';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { parseFieldErrors } from '../../../../shared/lib';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../shared/ui';

const VERSION_MAX = 50;
const DURATION_YEARS_MIN = 1;
const DURATION_YEARS_MAX = 10;

export function CurriculumEditPage() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const id = curriculumId;
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [version, setVersion] = useState('');
  const [durationYears, setDurationYears] = useState<number | ''>(4);
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState<CurriculumStatus>(CURRICULUM_STATUS.DRAFT);
  const [notes, setNotes] = useState('');
  const [programId, setProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/programs', { replace: true, state: { actionUnavailable: true } });
    }
  }, [canEdit, navigate]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCurriculumById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404) setNotFound(true);
        else setError(err.status === 403 ? t('programErrorForbidden') : err.message ?? t('curriculumErrorLoad'));
        return;
      }
      if (data) {
        setVersion(data.version);
        setDurationYears(data.durationYears);
        setIsActive(data.isActive);
        setStatus(data.status);
        setNotes(data.notes ?? '');
        setProgramId(data.programId);
      } else {
        setNotFound(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (version.trim().length > VERSION_MAX) err.version = t('errorCodeMax', { max: VERSION_MAX });
    
    const duration = typeof durationYears === 'number' ? durationYears : parseInt(String(durationYears), 10);
    if (Number.isNaN(duration)) err.durationYears = t('curriculumErrorDurationYearsRange');
    else if (duration < DURATION_YEARS_MIN || duration > DURATION_YEARS_MAX)
      err.durationYears = t('curriculumErrorDurationYearsRange');
    
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    const duration = typeof durationYears === 'number' ? durationYears : parseInt(String(durationYears), 10);
    if (Number.isNaN(duration) || duration < DURATION_YEARS_MIN || duration > DURATION_YEARS_MAX) return;
    setSubmitting(true);
    const body: UpdateCurriculumRequest = {
      durationYears: duration,
      isActive,
      status,
      notes: notes.trim() || null,
    };
    const versionTrim = version.trim();
    if (versionTrim) body.version = versionTrim;
    const { data, error: err } = await updateCurriculum(id, body);
    setSubmitting(false);
    if (err) {
      if (err.status === 404) {
        setNotFound(true);
        return;
      }
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(parseFieldErrors(err.details));
        setError(err.message ?? t('curriculumErrorValidation'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('programErrorInvalidData'));
      } else {
        setError(err.message ?? t('curriculumErrorUpdate'));
      }
      return;
    }
    if (data?.programId) {
      navigate(`/dashboards/admin/programs/${data.programId}`, { replace: true });
      return;
    }
    if (programId) {
      navigate(`/dashboards/admin/programs/${programId}`, { replace: true });
      return;
    }
    navigate('/dashboards/admin/programs', { replace: true });
  };

  const { t: tCommon } = useTranslation('common');
  const backUrl = programId ? `/dashboards/admin/programs/${programId}` : '/dashboards/admin/programs';

  if (!canEdit) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (loading) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('curriculumNotFoundOrDeleted')}
        backTo={programId ? `/dashboards/admin/programs/${programId}` : '/dashboards/admin/programs'}
        backLabel={programId ? t('curriculumBackToProgram') : tCommon('back')}
      />
    );
  }

  return (
    <FormPageLayout
      title={t('curriculumEditPageTitle')}
      error={error}
      onSubmit={handleSubmit}
    >
      <FormGroup label={t('curriculumVersion')} htmlFor="curriculum-edit-version" error={fieldErrors.version}>
        <input
          id="curriculum-edit-version"
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          maxLength={VERSION_MAX}
          placeholder={t('curriculumVersionPlaceholder')}
          aria-invalid={!!fieldErrors.version}
        />
      </FormGroup>
      <FormGroup label={t('curriculumDurationYearsRequired')} htmlFor="curriculum-edit-durationYears" error={fieldErrors.durationYears}>
        <input
          id="curriculum-edit-durationYears"
          type="number"
          min={DURATION_YEARS_MIN}
          max={DURATION_YEARS_MAX}
          value={durationYears === '' ? '' : durationYears}
          onChange={(e) => {
            const v = e.target.value;
            setDurationYears(v === '' ? '' : parseInt(v, 10));
          }}
          required
          aria-invalid={!!fieldErrors.durationYears}
        />
      </FormGroup>
      <FormGroup label={t('curriculumIsActive')} htmlFor="curriculum-edit-isActive">
        <label className="form-check">
          <input
            id="curriculum-edit-isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            aria-label={t('curriculumIsActive')}
          />
          <span>{t('curriculumIsActive')}</span>
        </label>
      </FormGroup>
      <FormGroup label={t('curriculumStatus')} htmlFor="curriculum-edit-status">
        <select
          id="curriculum-edit-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as CurriculumStatus)}
        >
          <option value={CURRICULUM_STATUS.DRAFT}>{t('curriculumStatusDraft')}</option>
          <option value={CURRICULUM_STATUS.UNDER_REVIEW}>{t('curriculumStatusUnderReview')}</option>
          <option value={CURRICULUM_STATUS.APPROVED}>{t('curriculumStatusApproved')}</option>
          <option value={CURRICULUM_STATUS.ARCHIVED}>{t('curriculumStatusArchived')}</option>
        </select>
      </FormGroup>
      <FormGroup label={t('curriculumNotes')} htmlFor="curriculum-edit-notes">
        <textarea
          id="curriculum-edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('curriculumNotesPlaceholder')}
          rows={4}
        />
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('saving') : tCommon('save')}
        submitting={submitting}
        cancelTo={backUrl}
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}

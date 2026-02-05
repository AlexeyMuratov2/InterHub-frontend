import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  CURRICULUM_STATUS,
  fetchCurriculumById,
  updateCurriculum,
  type CurriculumStatus,
  type UpdateCurriculumRequest,
} from '../../../entities/curriculum';
import { useCanEditInAdmin } from '../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../shared/i18n';

const VERSION_MAX = 50;
const START_YEAR_MIN = 1900;
const START_YEAR_MAX = 2100;
const END_YEAR_MIN = 1900;
const END_YEAR_MAX = 2100;

function parseFieldErrors(details: Record<string, string> | string[] | undefined): Record<string, string> {
  if (!details) return {};
  if (Array.isArray(details)) return {};
  return details as Record<string, string>;
}

export function CurriculumEditPage() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const id = curriculumId;
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [version, setVersion] = useState('');
  const [startYear, setStartYear] = useState<number | ''>(2024);
  const [endYear, setEndYear] = useState<number | ''>('');
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
        setStartYear(data.startYear);
        setEndYear(data.endYear ?? '');
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
    const year = typeof startYear === 'number' ? startYear : parseInt(String(startYear), 10);
    if (Number.isNaN(year)) err.startYear = t('curriculumErrorStartYearRange');
    else if (year < START_YEAR_MIN || year > START_YEAR_MAX)
      err.startYear = t('curriculumErrorStartYearRange');

    const end = typeof endYear === 'number' ? endYear : endYear === '' ? null : parseInt(String(endYear), 10);
    if (end !== null) {
      if (Number.isNaN(end)) err.endYear = t('curriculumErrorEndYearRange');
      else if (end < END_YEAR_MIN || end > END_YEAR_MAX) err.endYear = t('curriculumErrorEndYearRange');
      else if (!Number.isNaN(year) && end < year) err.endYear = t('curriculumErrorEndYearGteStartYear');
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    const year = typeof startYear === 'number' ? startYear : parseInt(String(startYear), 10);
    if (Number.isNaN(year) || year < START_YEAR_MIN || year > START_YEAR_MAX) return;
    const end =
      typeof endYear === 'number' ? endYear : endYear === '' ? null : parseInt(String(endYear), 10);
    if (end !== null) {
      if (Number.isNaN(end) || end < END_YEAR_MIN || end > END_YEAR_MAX) return;
      if (end < year) return;
    }
    setSubmitting(true);
    const body: UpdateCurriculumRequest = {
      startYear: year,
      endYear: end,
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

  if (!canEdit) {
    return (
      <div className="department-form-page">
        <p>{t('loadingList')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="department-form-page">
        <p>{t('loadingList')}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="department-form-page">
        <div className="department-alert department-alert--error">{t('curriculumNotFoundOrDeleted')}</div>
        {programId ? (
          <Link to={`/dashboards/admin/programs/${programId}`} className="btn-secondary">
            {t('curriculumBackToProgram')}
          </Link>
        ) : (
          <Link to="/dashboards/admin/programs" className="btn-secondary">
            {tCommon('back')}
          </Link>
        )}
      </div>
    );
  }

  const backUrl = programId ? `/dashboards/admin/programs/${programId}` : '/dashboards/admin/programs';

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('curriculumEditPageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="curriculum-edit-version">{t('curriculumVersion')}</label>
          <input
            id="curriculum-edit-version"
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            maxLength={VERSION_MAX}
            placeholder={t('curriculumVersionPlaceholder')}
            aria-invalid={!!fieldErrors.version}
          />
          {fieldErrors.version && <div className="field-error">{fieldErrors.version}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="curriculum-edit-startYear">{t('curriculumStartYearRequired')}</label>
          <input
            id="curriculum-edit-startYear"
            type="number"
            min={START_YEAR_MIN}
            max={START_YEAR_MAX}
            value={startYear === '' ? '' : startYear}
            onChange={(e) => {
              const v = e.target.value;
              setStartYear(v === '' ? '' : parseInt(v, 10));
            }}
            aria-invalid={!!fieldErrors.startYear}
          />
          {fieldErrors.startYear && <div className="field-error">{fieldErrors.startYear}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="curriculum-edit-endYear">{t('curriculumEndYear')}</label>
          <input
            id="curriculum-edit-endYear"
            type="number"
            min={END_YEAR_MIN}
            max={END_YEAR_MAX}
            value={endYear === '' ? '' : endYear}
            onChange={(e) => {
              const v = e.target.value;
              setEndYear(v === '' ? '' : parseInt(v, 10));
            }}
            aria-invalid={!!fieldErrors.endYear}
          />
          {fieldErrors.endYear && <div className="field-error">{fieldErrors.endYear}</div>}
        </div>
        <div className="form-group">
          <label className="form-check">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              aria-label={t('curriculumIsActive')}
            />
            <span>{t('curriculumIsActive')}</span>
          </label>
        </div>
        <div className="form-group">
          <label htmlFor="curriculum-edit-status">{t('curriculumStatus')}</label>
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
        </div>
        <div className="form-group">
          <label htmlFor="curriculum-edit-notes">{t('curriculumNotes')}</label>
          <textarea
            id="curriculum-edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('curriculumNotesPlaceholder')}
            rows={4}
          />
        </div>
        <div className="department-form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('saving') : tCommon('save')}
          </button>
          <Link to={backUrl} className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}

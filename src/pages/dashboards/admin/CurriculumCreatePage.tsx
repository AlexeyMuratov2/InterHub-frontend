import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createCurriculum } from '../../../entities/curriculum';
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

export function CurriculumCreatePage() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [version, setVersion] = useState('');
  const [startYear, setStartYear] = useState<number | ''>(new Date().getFullYear());
  const [endYear, setEndYear] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/programs', { replace: true, state: { actionUnavailable: true } });
    }
  }, [canEdit, navigate]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const versionTrim = version.trim();
    if (!versionTrim) err.version = t('curriculumErrorVersionRequired');
    else if (versionTrim.length > VERSION_MAX) err.version = t('errorCodeMax', { max: VERSION_MAX });
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
    if (!programId) return;
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
    const body = {
      version: version.trim(),
      startYear: year,
      endYear: end,
      isActive,
      notes: notes.trim() || null,
    };
    const { data, error: err } = await createCurriculum(programId, body);
    setSubmitting(false);
    if (err) {
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(parseFieldErrors(err.details));
        setError(err.message ?? t('curriculumErrorValidation'));
      } else if (err.status === 409) {
        setFieldErrors((prev) => ({ ...prev, version: t('curriculumErrorVersionExists') }));
        setError(t('curriculumErrorVersionExists'));
      } else if (err.status === 404 && err.message?.toLowerCase().includes('program')) {
        setError(t('curriculumErrorProgramNotFound'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('programErrorInvalidData'));
      } else {
        setError(err.message ?? t('curriculumErrorCreate'));
      }
      return;
    }
    if (data) {
      navigate(`/dashboards/admin/programs/${programId}`, { replace: true });
      return;
    }
    navigate(`/dashboards/admin/programs/${programId}`, { replace: true });
  };

  const { t: tCommon } = useTranslation('common');

  if (!canEdit) {
    return (
      <div className="department-form-page">
        <p>{t('loadingList')}</p>
      </div>
    );
  }

  if (!programId) {
    return (
      <div className="department-form-page">
        <div className="department-alert department-alert--error">{t('curriculumErrorProgramNotFound')}</div>
        <Link to="/dashboards/admin/programs" className="btn-secondary">
          {tCommon('back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('curriculumCreatePageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="curriculum-create-version">{t('curriculumVersionRequired')}</label>
          <input
            id="curriculum-create-version"
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            maxLength={VERSION_MAX}
            placeholder={t('curriculumVersionPlaceholder')}
            autoComplete="off"
            aria-invalid={!!fieldErrors.version}
          />
          {fieldErrors.version && <div className="field-error">{fieldErrors.version}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="curriculum-create-startYear">{t('curriculumStartYearRequired')}</label>
          <input
            id="curriculum-create-startYear"
            type="number"
            min={START_YEAR_MIN}
            max={START_YEAR_MAX}
            value={startYear === '' ? '' : startYear}
            onChange={(e) => {
              const v = e.target.value;
              setStartYear(v === '' ? '' : parseInt(v, 10));
            }}
            placeholder={`${START_YEAR_MIN}–${START_YEAR_MAX}`}
            aria-invalid={!!fieldErrors.startYear}
          />
          {fieldErrors.startYear && <div className="field-error">{fieldErrors.startYear}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="curriculum-create-endYear">{t('curriculumEndYear')}</label>
          <input
            id="curriculum-create-endYear"
            type="number"
            min={END_YEAR_MIN}
            max={END_YEAR_MAX}
            value={endYear === '' ? '' : endYear}
            onChange={(e) => {
              const v = e.target.value;
              setEndYear(v === '' ? '' : parseInt(v, 10));
            }}
            placeholder={t('curriculumEndYearPlaceholder')}
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
          <label htmlFor="curriculum-create-notes">{t('curriculumNotes')}</label>
          <textarea
            id="curriculum-create-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('curriculumNotesPlaceholder')}
            rows={4}
          />
        </div>
        <div className="department-form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('curriculumCreating') : tCommon('create')}
          </button>
          <Link to={`/dashboards/admin/programs/${programId}`} className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}

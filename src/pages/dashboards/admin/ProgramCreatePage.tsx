import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProgram } from '../../../entities/program';
import { fetchDepartments, type DepartmentDto } from '../../../entities/department';
import { useTranslation } from '../../../shared/i18n';

const CODE_MAX = 50;
const NAME_MAX = 255;
const DEGREE_LEVEL_MAX = 50;

function parseFieldErrors(details: Record<string, string> | string[] | undefined): Record<string, string> {
  if (!details) return {};
  if (Array.isArray(details)) return {};
  return details as Record<string, string>;
}

export function ProgramCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDepartments().then(({ data, error: err }) => {
      setDepartmentsLoading(false);
      if (!err && data) setDepartments(data);
    });
  }, []);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const codeTrim = code.trim();
    const nameTrim = name.trim();
    if (!codeTrim) err.code = t('programErrorCodeRequired');
    else if (codeTrim.length > CODE_MAX) err.code = t('errorCodeMax', { max: CODE_MAX });
    if (!nameTrim) err.name = t('programErrorNameRequired');
    else if (nameTrim.length > NAME_MAX) err.name = t('errorNameMax', { max: NAME_MAX });
    if (degreeLevel.trim().length > DEGREE_LEVEL_MAX)
      err.degreeLevel = t('errorCodeMax', { max: DEGREE_LEVEL_MAX });
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const body = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      degreeLevel: degreeLevel.trim() || undefined,
      departmentId: departmentId.trim() || undefined,
    };
    const { data, error: err } = await createProgram(body);
    setSubmitting(false);
    if (err) {
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(parseFieldErrors(err.details));
        setError(err.message ?? t('programErrorValidation'));
      } else if (err.status === 409) {
        setFieldErrors((prev) => ({ ...prev, code: t('programErrorCodeExists') }));
        setError(t('programErrorCodeExists'));
      } else if (err.status === 404 && err.message?.toLowerCase().includes('department')) {
        setError(t('programErrorDepartmentNotFound'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('programErrorInvalidData'));
      } else {
        setError(err.message ?? t('programErrorCreate'));
      }
      return;
    }
    if (data) {
      navigate('/dashboards/admin/programs', { replace: true });
      return;
    }
    navigate('/dashboards/admin/programs', { replace: true });
  };

  const { t: tCommon } = useTranslation('common');

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('programCreatePageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="program-create-code">{t('programCodeRequired')}</label>
          <input
            id="program-create-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={CODE_MAX}
            placeholder={t('programCodePlaceholder')}
            autoComplete="off"
            aria-invalid={!!fieldErrors.code}
          />
          {fieldErrors.code && <div className="field-error">{fieldErrors.code}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="program-create-name">{t('programNameRequired')}</label>
          <input
            id="program-create-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            placeholder={t('namePlaceholder')}
            aria-invalid={!!fieldErrors.name}
          />
          {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="program-create-description">{t('description')}</label>
          <textarea
            id="program-create-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="program-create-degreeLevel">{t('programDegreeLevel')}</label>
          <input
            id="program-create-degreeLevel"
            type="text"
            value={degreeLevel}
            onChange={(e) => setDegreeLevel(e.target.value)}
            maxLength={DEGREE_LEVEL_MAX}
            placeholder={t('programDegreeLevelPlaceholder')}
            aria-invalid={!!fieldErrors.degreeLevel}
          />
          {fieldErrors.degreeLevel && <div className="field-error">{fieldErrors.degreeLevel}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="program-create-departmentId">{t('programDepartment')}</label>
          <select
            id="program-create-departmentId"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            aria-invalid={!!fieldErrors.departmentId}
          >
            <option value="">{t('programDepartmentNone')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
          {departmentsLoading && <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('loadingList')}</small>}
          {fieldErrors.departmentId && <div className="field-error">{fieldErrors.departmentId}</div>}
        </div>
        <div className="department-form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('programCreating') : tCommon('create')}
          </button>
          <Link to="/dashboards/admin/programs" className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}

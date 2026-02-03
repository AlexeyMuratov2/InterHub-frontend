import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchProgramById, updateProgram } from '../../../entities/program';
import { fetchDepartments, type DepartmentDto } from '../../../entities/department';
import { useCanEditInAdmin } from '../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../shared/i18n';

const NAME_MAX = 255;
const DEGREE_LEVEL_MAX = 50;

function parseFieldErrors(details: Record<string, string> | string[] | undefined): Record<string, string> {
  if (!details) return {};
  if (Array.isArray(details)) return {};
  return details as Record<string, string>;
}

export function ProgramEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
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
    fetchDepartments().then(({ data, error: err }) => {
      setDepartmentsLoading(false);
      if (!err && data) setDepartments(data);
    });
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProgramById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404) setNotFound(true);
        else setError(err.status === 403 ? t('programErrorForbidden') : err.message ?? t('programErrorLoad'));
        return;
      }
      if (data) {
        setCode(data.code);
        setName(data.name);
        setDescription(data.description ?? '');
        setDegreeLevel(data.degreeLevel ?? '');
        setDepartmentId(data.departmentId ?? '');
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
    const nameTrim = name.trim();
    if (!nameTrim) err.name = t('programErrorNameRequired');
    else if (nameTrim.length > NAME_MAX) err.name = t('errorNameMax', { max: NAME_MAX });
    if (degreeLevel.trim().length > DEGREE_LEVEL_MAX)
      err.degreeLevel = t('errorCodeMax', { max: DEGREE_LEVEL_MAX });
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      degreeLevel: degreeLevel.trim() || undefined,
      departmentId: departmentId.trim() || null,
    };
    const { data, error: err } = await updateProgram(id, body);
    setSubmitting(false);
    if (err) {
      if (err.status === 404) {
        if (err.message?.toLowerCase().includes('department')) {
          setError(t('programErrorDepartmentNotFound'));
        } else {
          setNotFound(true);
        }
        return;
      }
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(parseFieldErrors(err.details));
        setError(err.message ?? t('programErrorValidation'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('programErrorInvalidData'));
      } else {
        setError(err.message ?? t('programErrorUpdate'));
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
        <div className="department-alert department-alert--error">{t('programNotFoundOrDeleted')}</div>
        <Link to="/dashboards/admin/programs" className="btn-secondary">
          {t('programBackToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('programEditPageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="program-edit-code">{t('code')}</label>
          <input
            id="program-edit-code"
            type="text"
            value={code}
            readOnly
            className="read-only"
            aria-readonly="true"
          />
          <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('codeReadOnly')}</small>
        </div>
        <div className="form-group">
          <label htmlFor="program-edit-name">{t('programNameRequired')}</label>
          <input
            id="program-edit-name"
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
          <label htmlFor="program-edit-description">{t('description')}</label>
          <textarea
            id="program-edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="program-edit-degreeLevel">{t('programDegreeLevel')}</label>
          <input
            id="program-edit-degreeLevel"
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
          <label htmlFor="program-edit-departmentId">{t('programDepartment')}</label>
          <select
            id="program-edit-departmentId"
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
            {submitting ? t('saving') : tCommon('save')}
          </button>
          <Link to="/dashboards/admin/programs" className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createDepartment } from '../../../entities/department';
import { useCanEditInAdmin } from '../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../shared/i18n';

const CODE_MAX = 50;
const NAME_MAX = 255;

export function DepartmentCreatePage() {
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/departments', { replace: true, state: { actionUnavailable: true } });
    }
  }, [canEdit, navigate]);

  if (!canEdit) {
    return <div className="department-form-page"><p>{t('loadingList')}</p></div>;
  }

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const codeTrim = code.trim();
    const nameTrim = name.trim();
    if (!codeTrim) err.code = t('errorCodeRequired');
    else if (codeTrim.length > CODE_MAX) err.code = t('errorCodeMax', { max: CODE_MAX });
    if (!nameTrim) err.name = t('errorNameRequired');
    else if (nameTrim.length > NAME_MAX) err.name = t('errorNameMax', { max: NAME_MAX });
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const { data, error: err } = await createDepartment({
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setSubmitting(false);
    if (err) {
      if (err.status === 409) {
        setFieldErrors((prev) => ({ ...prev, code: t('errorCodeExists') }));
        setError(t('errorCodeExists'));
      } else if (err.status === 400) {
        setError(err.message ?? t('errorInvalidData'));
      } else {
        setError(err.message ?? t('errorCreate'));
      }
      return;
    }
    if (data) {
      navigate('/dashboards/admin/departments', { replace: true });
      return;
    }
    navigate('/dashboards/admin/departments', { replace: true });
  };

  const { t: tCommon } = useTranslation('common');

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('createPageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="create-code">{t('codeRequired')}</label>
          <input
            id="create-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={CODE_MAX}
            placeholder={t('codePlaceholder')}
            autoComplete="off"
            aria-invalid={!!fieldErrors.code}
          />
          {fieldErrors.code && <div className="field-error">{fieldErrors.code}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="create-name">{t('nameRequired')}</label>
          <input
            id="create-name"
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
          <label htmlFor="create-description">{t('description')}</label>
          <textarea
            id="create-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
          />
        </div>
        <div className="department-form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('creating') : tCommon('create')}
          </button>
          <Link to="/dashboards/admin/departments" className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchDepartmentById, updateDepartment } from '../../../entities/department';
import { useTranslation } from '../../../shared/i18n';

const NAME_MAX = 255;

export function DepartmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDepartmentById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404) setNotFound(true);
        else setError(err.message ?? t('errorLoadDepartment'));
        return;
      }
      if (data) {
        setCode(data.code);
        setName(data.name);
        setDescription(data.description ?? '');
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
    if (!nameTrim) err.name = t('errorNameRequired');
    else if (nameTrim.length > NAME_MAX) err.name = t('errorNameMax', { max: NAME_MAX });
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
    const { data, error: err } = await updateDepartment(id, {
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setSubmitting(false);
    if (err) {
      if (err.status === 404) {
        setNotFound(true);
        return;
      }
      if (err.status === 400) {
        setError(err.message ?? t('errorInvalidData'));
      } else {
        setError(err.message ?? t('errorUpdate'));
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
        <div className="department-alert department-alert--error">{t('departmentNotFound')}</div>
        <Link to="/dashboards/admin/departments" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('editPageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="edit-code">{t('code')}</label>
          <input
            id="edit-code"
            type="text"
            value={code}
            readOnly
            className="read-only"
            aria-readonly="true"
          />
          <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('codeReadOnly')}</small>
        </div>
        <div className="form-group">
          <label htmlFor="edit-name">{t('nameRequired')}</label>
          <input
            id="edit-name"
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
          <label htmlFor="edit-description">{t('description')}</label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
          />
        </div>
        <div className="department-form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('saving') : tCommon('save')}
          </button>
          <Link to="/dashboards/admin/departments" className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}

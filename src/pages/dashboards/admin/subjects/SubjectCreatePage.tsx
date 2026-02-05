import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSubject } from '../../../../entities/subject';
import { fetchDepartments, type DepartmentDto } from '../../../../entities/department';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { parseFieldErrors } from './utils';

const CODE_MAX = 50;

export function SubjectCreatePage() {
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [code, setCode] = useState('');
  const [chineseName, setChineseName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/subjects', { replace: true, state: { actionUnavailable: true } });
    }
  }, [canEdit, navigate]);

  useEffect(() => {
    fetchDepartments().then(({ data, error: err }) => {
      setDepartmentsLoading(false);
      if (!err && data) setDepartments(data);
    });
  }, []);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const codeTrim = code.trim();
    const chineseTrim = chineseName.trim();
    if (!codeTrim) err.code = t('subjectErrorCodeRequired');
    else if (codeTrim.length > CODE_MAX) err.code = t('errorCodeMax', { max: CODE_MAX });
    if (!chineseTrim) err.chineseName = t('subjectErrorChineseNameRequired');
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const { data, error: err } = await createSubject({
      code: code.trim(),
      chineseName: chineseName.trim(),
      englishName: englishName.trim() || null,
      description: description.trim() || null,
      departmentId: departmentId.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(parseFieldErrors(err.details));
        setError(err.message ?? t('subjectErrorValidation'));
      } else if (err.status === 409) {
        setFieldErrors((prev) => ({ ...prev, code: t('subjectErrorCodeExists') }));
        setError(t('subjectErrorCodeExists'));
      } else if (err.status === 404 && err.message?.toLowerCase().includes('department')) {
        setError(t('programErrorDepartmentNotFound'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('errorInvalidData'));
      } else {
        setError(err.message ?? t('subjectErrorCreate'));
      }
      return;
    }
    if (data) {
      navigate('/dashboards/admin/subjects', { replace: true });
      return;
    }
    navigate('/dashboards/admin/subjects', { replace: true });
  };

  const tCommon = useTranslation('common').t;

  if (!canEdit) {
    return (
      <div className="department-form-page">
        <p>{t('loadingList')}</p>
      </div>
    );
  }

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('subjectCreatePageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subject-create-code">{t('subjectCodeRequired')}</label>
          <input
            id="subject-create-code"
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
          <label htmlFor="subject-create-chineseName">{t('subjectChineseNameRequired')}</label>
          <input
            id="subject-create-chineseName"
            type="text"
            value={chineseName}
            onChange={(e) => setChineseName(e.target.value)}
            placeholder={t('subjectChineseNamePlaceholder')}
            aria-invalid={!!fieldErrors.chineseName}
          />
          {fieldErrors.chineseName && <div className="field-error">{fieldErrors.chineseName}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="subject-create-englishName">{t('subjectEnglishName')}</label>
          <input
            id="subject-create-englishName"
            type="text"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            placeholder={t('subjectEnglishNamePlaceholder')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="subject-create-description">{t('description')}</label>
          <textarea
            id="subject-create-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="subject-create-departmentId">{t('programDepartment')}</label>
          <select
            id="subject-create-departmentId"
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
          {departmentsLoading && (
            <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('loadingList')}</small>
          )}
          {fieldErrors.departmentId && (
            <div className="field-error">{fieldErrors.departmentId}</div>
          )}
        </div>
        <div className="department-form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('creating') : tCommon('create')}
          </button>
          <Link to="/dashboards/admin/subjects" className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}

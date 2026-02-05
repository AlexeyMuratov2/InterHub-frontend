import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchSubjectById, updateSubject } from '../../../../entities/subject';
import { fetchDepartments, type DepartmentDto } from '../../../../entities/department';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { parseFieldErrors } from './utils';

export function SubjectEditPage() {
  const { id } = useParams<{ id: string }>();
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);

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

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSubjectById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404) setNotFound(true);
        else setError(err.message ?? t('subjectErrorLoad'));
        return;
      }
      if (data) {
        setCode(data.code);
        setChineseName(data.chineseName);
        setEnglishName(data.englishName ?? '');
        setDescription(data.description ?? '');
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
    const chineseTrim = chineseName.trim();
    if (!chineseTrim) err.chineseName = t('subjectErrorChineseNameRequired');
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
    const { data, error: err } = await updateSubject(id, {
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
      } else if (err.status === 404 && err.message?.toLowerCase().includes('department')) {
        setError(t('programErrorDepartmentNotFound'));
      } else if (err.status === 404) {
        setNotFound(true);
        return;
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('errorInvalidData'));
      } else {
        setError(err.message ?? t('subjectErrorUpdate'));
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
        <div className="department-alert department-alert--error">{t('subjectNotFound')}</div>
        <Link to="/dashboards/admin/subjects" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('subjectEditPageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subject-edit-code">{t('code')}</label>
          <input
            id="subject-edit-code"
            type="text"
            value={code}
            readOnly
            className="read-only"
            aria-readonly="true"
          />
          <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('codeReadOnly')}</small>
        </div>
        <div className="form-group">
          <label htmlFor="subject-edit-chineseName">{t('subjectChineseNameRequired')}</label>
          <input
            id="subject-edit-chineseName"
            type="text"
            value={chineseName}
            onChange={(e) => setChineseName(e.target.value)}
            placeholder={t('subjectChineseNamePlaceholder')}
            aria-invalid={!!fieldErrors.chineseName}
          />
          {fieldErrors.chineseName && (
            <div className="field-error">{fieldErrors.chineseName}</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="subject-edit-englishName">{t('subjectEnglishName')}</label>
          <input
            id="subject-edit-englishName"
            type="text"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            placeholder={t('subjectEnglishNamePlaceholder')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="subject-edit-description">{t('description')}</label>
          <textarea
            id="subject-edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="subject-edit-departmentId">{t('programDepartment')}</label>
          <select
            id="subject-edit-departmentId"
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
            {submitting ? t('saving') : tCommon('save')}
          </button>
          <Link to="/dashboards/admin/subjects" className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}

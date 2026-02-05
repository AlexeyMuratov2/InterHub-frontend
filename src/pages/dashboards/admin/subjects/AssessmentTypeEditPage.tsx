import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchAssessmentTypeById, updateAssessmentType } from '../../../../entities/subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { parseFieldErrors } from './utils';

export function AssessmentTypeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [code, setCode] = useState('');
  const [chineseName, setChineseName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [isGraded, setIsGraded] = useState(true);
  const [isFinal, setIsFinal] = useState(false);
  const [sortOrder, setSortOrder] = useState<number | ''>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/subjects', {
        replace: true,
        state: { actionUnavailable: true },
      });
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
    fetchAssessmentTypeById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404) setNotFound(true);
        else setError(err.message ?? t('subjectAssessmentTypeErrorLoad'));
        return;
      }
      if (data) {
        setCode(data.code);
        setChineseName(data.chineseName);
        setEnglishName(data.englishName ?? '');
        setIsGraded(data.isGraded);
        setIsFinal(data.isFinal);
        setSortOrder(data.sortOrder);
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
    const order = typeof sortOrder === 'number' ? sortOrder : parseInt(String(sortOrder), 10);
    if (sortOrder !== '' && Number.isNaN(order)) {
      err.sortOrder = t('subjectAssessmentTypeErrorSortOrderNumber');
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
    const order = typeof sortOrder === 'number' ? sortOrder : parseInt(String(sortOrder), 10);
    setSubmitting(true);
    const { data, error: err } = await updateAssessmentType(id, {
      chineseName: chineseName.trim(),
      englishName: englishName.trim() || null,
      isGraded,
      isFinal,
      sortOrder: Number.isNaN(order) ? 0 : order,
    });
    setSubmitting(false);
    if (err) {
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(parseFieldErrors(err.details));
        setError(err.message ?? t('subjectErrorValidation'));
      } else if (err.status === 404) {
        setNotFound(true);
        return;
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('errorInvalidData'));
      } else {
        setError(err.message ?? t('subjectAssessmentTypeErrorUpdate'));
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
        <div className="department-alert department-alert--error">
          {t('subjectAssessmentTypeNotFound')}
        </div>
        <Link to="/dashboards/admin/subjects" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{t('subjectAssessmentTypeEditPageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="at-edit-code">{t('code')}</label>
          <input
            id="at-edit-code"
            type="text"
            value={code}
            readOnly
            className="read-only"
            aria-readonly="true"
          />
          <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('codeReadOnly')}</small>
        </div>
        <div className="form-group">
          <label htmlFor="at-edit-chineseName">{t('subjectChineseNameRequired')}</label>
          <input
            id="at-edit-chineseName"
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
          <label htmlFor="at-edit-englishName">{t('subjectEnglishName')}</label>
          <input
            id="at-edit-englishName"
            type="text"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            placeholder={t('subjectEnglishNamePlaceholder')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="at-edit-isGraded">{t('subjectAssessmentTypeIsGraded')}</label>
          <select
            id="at-edit-isGraded"
            value={String(isGraded)}
            onChange={(e) => setIsGraded(e.target.value === 'true')}
          >
            <option value="true">{t('curriculumActiveYes')}</option>
            <option value="false">{t('curriculumActiveNo')}</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="at-edit-isFinal">{t('subjectAssessmentTypeIsFinal')}</label>
          <select
            id="at-edit-isFinal"
            value={String(isFinal)}
            onChange={(e) => setIsFinal(e.target.value === 'true')}
          >
            <option value="false">{t('curriculumActiveNo')}</option>
            <option value="true">{t('curriculumActiveYes')}</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="at-edit-sortOrder">{t('subjectAssessmentTypeSortOrder')}</label>
          <input
            id="at-edit-sortOrder"
            type="number"
            value={sortOrder === '' ? '' : sortOrder}
            onChange={(e) => {
              const v = e.target.value;
              setSortOrder(v === '' ? '' : parseInt(v, 10));
            }}
            min={0}
            step={1}
            aria-invalid={!!fieldErrors.sortOrder}
          />
          {fieldErrors.sortOrder && (
            <div className="field-error">{fieldErrors.sortOrder}</div>
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

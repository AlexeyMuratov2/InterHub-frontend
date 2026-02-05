import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createAssessmentType } from '../../../../entities/subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { parseFieldErrors } from './utils';

const CODE_MAX = 50;

export function AssessmentTypeCreatePage() {
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [code, setCode] = useState('');
  const [chineseName, setChineseName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [isGraded, setIsGraded] = useState(true);
  const [isFinal, setIsFinal] = useState(false);
  const [sortOrder, setSortOrder] = useState<number | ''>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/subjects', {
        replace: true,
        state: { actionUnavailable: true },
      });
    }
  }, [canEdit, navigate]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const codeTrim = code.trim();
    const chineseTrim = chineseName.trim();
    if (!codeTrim) err.code = t('subjectErrorCodeRequired');
    else if (codeTrim.length > CODE_MAX) err.code = t('errorCodeMax', { max: CODE_MAX });
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
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    const order = typeof sortOrder === 'number' ? sortOrder : parseInt(String(sortOrder), 10);
    setSubmitting(true);
    const { data, error: err } = await createAssessmentType({
      code: code.trim(),
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
      } else if (err.status === 409) {
        setFieldErrors((prev) => ({ ...prev, code: t('subjectAssessmentTypeErrorCodeExists') }));
        setError(t('subjectAssessmentTypeErrorCodeExists'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('errorInvalidData'));
      } else {
        setError(err.message ?? t('subjectAssessmentTypeErrorCreate'));
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
      <h1 className="department-form-title">{t('subjectAssessmentTypeCreatePageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="at-create-code">{t('subjectCodeRequired')}</label>
          <input
            id="at-create-code"
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
          <label htmlFor="at-create-chineseName">{t('subjectChineseNameRequired')}</label>
          <input
            id="at-create-chineseName"
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
          <label htmlFor="at-create-englishName">{t('subjectEnglishName')}</label>
          <input
            id="at-create-englishName"
            type="text"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            placeholder={t('subjectEnglishNamePlaceholder')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="at-create-isGraded">{t('subjectAssessmentTypeIsGraded')}</label>
          <select
            id="at-create-isGraded"
            value={String(isGraded)}
            onChange={(e) => setIsGraded(e.target.value === 'true')}
          >
            <option value="true">{t('curriculumActiveYes')}</option>
            <option value="false">{t('curriculumActiveNo')}</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="at-create-isFinal">{t('subjectAssessmentTypeIsFinal')}</label>
          <select
            id="at-create-isFinal"
            value={String(isFinal)}
            onChange={(e) => setIsFinal(e.target.value === 'true')}
          >
            <option value="false">{t('curriculumActiveNo')}</option>
            <option value="true">{t('curriculumActiveYes')}</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="at-create-sortOrder">{t('subjectAssessmentTypeSortOrder')}</label>
          <input
            id="at-create-sortOrder"
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

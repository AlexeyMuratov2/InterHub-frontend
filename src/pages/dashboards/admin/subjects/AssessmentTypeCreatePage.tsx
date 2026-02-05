import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssessmentType } from '../../../../entities/subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../shared/ui';
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
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  return (
    <FormPageLayout
      title={t('subjectAssessmentTypeCreatePageTitle')}
      error={error}
      onSubmit={handleSubmit}
    >
      <FormGroup label={t('subjectCodeRequired')} htmlFor="at-create-code" error={fieldErrors.code}>
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
      </FormGroup>
      <FormGroup label={t('subjectChineseNameRequired')} htmlFor="at-create-chineseName" error={fieldErrors.chineseName}>
        <input
          id="at-create-chineseName"
          type="text"
          value={chineseName}
          onChange={(e) => setChineseName(e.target.value)}
          placeholder={t('subjectChineseNamePlaceholder')}
          aria-invalid={!!fieldErrors.chineseName}
        />
      </FormGroup>
      <FormGroup label={t('subjectEnglishName')} htmlFor="at-create-englishName">
        <input
          id="at-create-englishName"
          type="text"
          value={englishName}
          onChange={(e) => setEnglishName(e.target.value)}
          placeholder={t('subjectEnglishNamePlaceholder')}
        />
      </FormGroup>
      <FormGroup label={t('subjectAssessmentTypeIsGraded')} htmlFor="at-create-isGraded">
        <select
          id="at-create-isGraded"
          value={String(isGraded)}
          onChange={(e) => setIsGraded(e.target.value === 'true')}
        >
          <option value="true">{t('curriculumActiveYes')}</option>
          <option value="false">{t('curriculumActiveNo')}</option>
        </select>
      </FormGroup>
      <FormGroup label={t('subjectAssessmentTypeIsFinal')} htmlFor="at-create-isFinal">
        <select
          id="at-create-isFinal"
          value={String(isFinal)}
          onChange={(e) => setIsFinal(e.target.value === 'true')}
        >
          <option value="false">{t('curriculumActiveNo')}</option>
          <option value="true">{t('curriculumActiveYes')}</option>
        </select>
      </FormGroup>
      <FormGroup label={t('subjectAssessmentTypeSortOrder')} htmlFor="at-create-sortOrder" error={fieldErrors.sortOrder}>
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
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('creating') : tCommon('create')}
        submitting={submitting}
        cancelTo="/dashboards/admin/subjects"
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}

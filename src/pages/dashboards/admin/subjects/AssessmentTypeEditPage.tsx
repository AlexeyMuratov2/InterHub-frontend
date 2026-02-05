import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAssessmentTypeById, updateAssessmentType } from '../../../../entities/subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../shared/ui';
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
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (loading) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('subjectAssessmentTypeNotFound')}
        backTo="/dashboards/admin/subjects"
        backLabel={tCommon('back')}
      />
    );
  }

  return (
    <FormPageLayout
      title={t('subjectAssessmentTypeEditPageTitle')}
      error={error}
      onSubmit={handleSubmit}
    >
      <FormGroup label={t('code')} htmlFor="at-edit-code" hint={t('codeReadOnly')}>
        <input
          id="at-edit-code"
          type="text"
          value={code}
          readOnly
          className="read-only"
          aria-readonly="true"
        />
      </FormGroup>
      <FormGroup label={t('subjectChineseNameRequired')} htmlFor="at-edit-chineseName" error={fieldErrors.chineseName}>
        <input
          id="at-edit-chineseName"
          type="text"
          value={chineseName}
          onChange={(e) => setChineseName(e.target.value)}
          placeholder={t('subjectChineseNamePlaceholder')}
          aria-invalid={!!fieldErrors.chineseName}
        />
      </FormGroup>
      <FormGroup label={t('subjectEnglishName')} htmlFor="at-edit-englishName">
        <input
          id="at-edit-englishName"
          type="text"
          value={englishName}
          onChange={(e) => setEnglishName(e.target.value)}
          placeholder={t('subjectEnglishNamePlaceholder')}
        />
      </FormGroup>
      <FormGroup label={t('subjectAssessmentTypeIsGraded')} htmlFor="at-edit-isGraded">
        <select
          id="at-edit-isGraded"
          value={String(isGraded)}
          onChange={(e) => setIsGraded(e.target.value === 'true')}
        >
          <option value="true">{t('curriculumActiveYes')}</option>
          <option value="false">{t('curriculumActiveNo')}</option>
        </select>
      </FormGroup>
      <FormGroup label={t('subjectAssessmentTypeIsFinal')} htmlFor="at-edit-isFinal">
        <select
          id="at-edit-isFinal"
          value={String(isFinal)}
          onChange={(e) => setIsFinal(e.target.value === 'true')}
        >
          <option value="false">{t('curriculumActiveNo')}</option>
          <option value="true">{t('curriculumActiveYes')}</option>
        </select>
      </FormGroup>
      <FormGroup label={t('subjectAssessmentTypeSortOrder')} htmlFor="at-edit-sortOrder" error={fieldErrors.sortOrder}>
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
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('saving') : tCommon('save')}
        submitting={submitting}
        cancelTo="/dashboards/admin/subjects"
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}

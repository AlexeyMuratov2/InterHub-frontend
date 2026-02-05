import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSubject } from '../../../../entities/subject';
import { fetchDepartments, type DepartmentDto } from '../../../../entities/department';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { parseFieldErrors } from '../../../../shared/lib';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../shared/ui';

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
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  return (
    <FormPageLayout
      title={t('subjectCreatePageTitle')}
      error={error}
      onSubmit={handleSubmit}
    >
      <FormGroup label={t('subjectCodeRequired')} htmlFor="subject-create-code" error={fieldErrors.code}>
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
      </FormGroup>
      <FormGroup label={t('subjectChineseNameRequired')} htmlFor="subject-create-chineseName" error={fieldErrors.chineseName}>
        <input
          id="subject-create-chineseName"
          type="text"
          value={chineseName}
          onChange={(e) => setChineseName(e.target.value)}
          placeholder={t('subjectChineseNamePlaceholder')}
          aria-invalid={!!fieldErrors.chineseName}
        />
      </FormGroup>
      <FormGroup label={t('subjectEnglishName')} htmlFor="subject-create-englishName">
        <input
          id="subject-create-englishName"
          type="text"
          value={englishName}
          onChange={(e) => setEnglishName(e.target.value)}
          placeholder={t('subjectEnglishNamePlaceholder')}
        />
      </FormGroup>
      <FormGroup label={t('description')} htmlFor="subject-create-description">
        <textarea
          id="subject-create-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={4}
        />
      </FormGroup>
      <FormGroup
        label={t('programDepartment')}
        htmlFor="subject-create-departmentId"
        error={fieldErrors.departmentId}
        hint={departmentsLoading ? t('loadingList') : undefined}
      >
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

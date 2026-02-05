import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSubjectById, updateSubject } from '../../../../entities/subject';
import { fetchDepartments, type DepartmentDto } from '../../../../entities/department';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../shared/ui';
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
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (loading) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('subjectNotFound')}
        backTo="/dashboards/admin/subjects"
        backLabel={tCommon('back')}
      />
    );
  }

  return (
    <FormPageLayout title={t('subjectEditPageTitle')} error={error} onSubmit={handleSubmit}>
      <FormGroup label={t('code')} htmlFor="subject-edit-code" hint={t('codeReadOnly')}>
        <input
          id="subject-edit-code"
          type="text"
          value={code}
          readOnly
          className="read-only"
          aria-readonly="true"
        />
      </FormGroup>
      <FormGroup label={t('subjectChineseNameRequired')} htmlFor="subject-edit-chineseName" error={fieldErrors.chineseName}>
        <input
          id="subject-edit-chineseName"
          type="text"
          value={chineseName}
          onChange={(e) => setChineseName(e.target.value)}
          placeholder={t('subjectChineseNamePlaceholder')}
          aria-invalid={!!fieldErrors.chineseName}
        />
      </FormGroup>
      <FormGroup label={t('subjectEnglishName')} htmlFor="subject-edit-englishName">
        <input
          id="subject-edit-englishName"
          type="text"
          value={englishName}
          onChange={(e) => setEnglishName(e.target.value)}
          placeholder={t('subjectEnglishNamePlaceholder')}
        />
      </FormGroup>
      <FormGroup label={t('description')} htmlFor="subject-edit-description">
        <textarea
          id="subject-edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={4}
        />
      </FormGroup>
      <FormGroup
        label={t('programDepartment')}
        htmlFor="subject-edit-departmentId"
        error={fieldErrors.departmentId}
        hint={departmentsLoading ? t('loadingList') : undefined}
      >
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

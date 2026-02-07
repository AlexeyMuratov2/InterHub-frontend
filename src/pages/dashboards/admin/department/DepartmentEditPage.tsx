import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDepartmentById, updateDepartment } from '../../../../entities/department';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../shared/ui';

const NAME_MAX = 255;

export function DepartmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
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
    if (!canEdit) {
      navigate('/dashboards/admin/departments', { replace: true, state: { actionUnavailable: true } });
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
        message={t('departmentNotFound')}
        backTo="/dashboards/admin/departments"
        backLabel={tCommon('back')}
      />
    );
  }

  return (
    <FormPageLayout title={t('editPageTitle')} error={error} onSubmit={handleSubmit}>
      <FormGroup label={t('code')} htmlFor="edit-code" hint={t('codeReadOnly')}>
        <input
          id="edit-code"
          type="text"
          value={code}
          readOnly
          className="read-only"
          aria-readonly="true"
        />
      </FormGroup>
      <FormGroup label={t('nameRequired')} htmlFor="edit-name" error={fieldErrors.name}>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          placeholder={t('namePlaceholder')}
          aria-invalid={!!fieldErrors.name}
        />
      </FormGroup>
      <FormGroup label={t('description')} htmlFor="edit-description">
        <textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={4}
        />
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('saving') : tCommon('save')}
        submitting={submitting}
        cancelTo="/dashboards/admin/departments"
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAcademicYear } from '../../../../../entities/academic';
import { useCanEditInAdmin } from '../../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions } from '../../../../../shared/ui';

export function AcademicYearCreatePage() {
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/settings', { replace: true });
    }
  }, [canEdit, navigate]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = t('academicErrorNameRequired');
    if (!startDate.trim()) err.startDate = t('academicErrorStartDateRequired');
    if (!endDate.trim()) err.endDate = t('academicErrorEndDateRequired');
    if (startDate && endDate && endDate < startDate) err.endDate = t('academicErrorEndBeforeStart');
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const { data, error: err } = await createAcademicYear({
      name: name.trim(),
      startDate,
      endDate,
      isCurrent: isCurrent || undefined,
    });
    setSubmitting(false);
    if (err) {
      if (err.status === 409) {
        setError(t('academicErrorYearExists'));
      } else {
        setError(err.message ?? t('academicErrorCreate'));
      }
      return;
    }
    if (data) {
      navigate('/dashboards/admin/settings', { replace: true });
      return;
    }
    navigate('/dashboards/admin/settings', { replace: true });
  };

  const { t: tCommon } = useTranslation('common');

  if (!canEdit) {
    return null;
  }

  return (
    <FormPageLayout title={t('academicCreateYearPageTitle')} error={error} onSubmit={handleSubmit}>
      <FormGroup label={t('academicNameRequired')} htmlFor="year-name" error={fieldErrors.name}>
        <input
          id="year-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('academicNamePlaceholder')}
          autoComplete="off"
          aria-invalid={!!fieldErrors.name}
        />
      </FormGroup>
      <FormGroup label={t('academicStartDateRequired')} htmlFor="year-start" error={fieldErrors.startDate}>
        <input
          id="year-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          aria-invalid={!!fieldErrors.startDate}
        />
      </FormGroup>
      <FormGroup label={t('academicEndDateRequired')} htmlFor="year-end" error={fieldErrors.endDate}>
        <input
          id="year-end"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          aria-invalid={!!fieldErrors.endDate}
        />
      </FormGroup>
      <FormGroup label={t('academicIsCurrent')} htmlFor="year-current" hint={t('academicIsCurrentHint')}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            id="year-current"
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
          />
          <span>{isCurrent ? '✓' : '—'}</span>
        </label>
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('academicCreating') : tCommon('create')}
        submitting={submitting}
        cancelTo="/dashboards/admin/settings"
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAcademicYearById, updateAcademicYear } from '../../../../entities/academic';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../shared/ui';

export function AcademicYearEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/settings', { replace: true });
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
    fetchAcademicYearById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err || !data) {
        setNotFound(true);
        return;
      }
      setName(data.name);
      setStartDate(data.startDate);
      setEndDate(data.endDate);
      setIsCurrent(data.isCurrent);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = t('academicErrorNameRequired');
    if (startDate && endDate && endDate < startDate) err.endDate = t('academicErrorEndBeforeStart');
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
    const { error: err } = await updateAcademicYear(id, {
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isCurrent,
    });
    setSubmitting(false);
    if (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err.message ?? t('academicErrorUpdate'));
      return;
    }
    navigate(`/dashboards/admin/settings/years/${id}`, { replace: true });
  };

  const { t: tCommon } = useTranslation('common');

  if (!canEdit) return null;
  if (loading) return <PageMessage variant="loading" message={t('loadingList')} />;
  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('academicYearNotFound')}
        backTo="/dashboards/admin/settings"
        backLabel={tCommon('back')}
      />
    );
  }

  return (
    <FormPageLayout title={t('academicEditYearPageTitle')} error={error} onSubmit={handleSubmit}>
      <FormGroup label={t('academicNameRequired')} htmlFor="year-name" error={fieldErrors.name}>
        <input
          id="year-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('academicNamePlaceholder')}
          aria-invalid={!!fieldErrors.name}
        />
      </FormGroup>
      <div className="form-row form-row--2">
        <FormGroup label={t('academicStartDateRequired')} htmlFor="year-start">
          <input
            id="year-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
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
      </div>
      <FormGroup label={t('academicIsCurrent')} htmlFor="year-current" hint={t('academicIsCurrentHint')}>
        <div className="form-check">
          <input
            id="year-current"
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
          />
          <span className="form-check-label">{isCurrent ? '✓' : '—'}</span>
        </div>
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('academicSaving') : tCommon('save')}
        submitting={submitting}
        cancelTo={`/dashboards/admin/settings/years/${id}`}
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchBuildingById, updateBuilding } from '../../../../../entities/schedule';
import { useCanEditInAdmin } from '../../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../../shared/ui';

export function BuildingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
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
    fetchBuildingById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err || !data) {
        setNotFound(true);
        return;
      }
      setName(data.name);
      setAddress(data.address ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = t('buildingErrorNameRequired');
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
    const { error: err } = await updateBuilding(id, {
      name: name.trim(),
      address: address.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err.message ?? t('buildingErrorUpdate'));
      return;
    }
    navigate(`/dashboards/admin/settings/buildings/${id}`, { replace: true });
  };

  const { t: tCommon } = useTranslation('common');

  if (!canEdit) return null;
  if (loading) return <PageMessage variant="loading" message={t('loadingList')} />;
  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('buildingNotFound')}
        backTo="/dashboards/admin/settings"
        backLabel={tCommon('back')}
      />
    );
  }

  return (
    <FormPageLayout title={t('buildingEditPageTitle')} error={error} onSubmit={handleSubmit}>
      <FormGroup label={t('buildingNameRequired')} htmlFor="building-name" error={fieldErrors.name}>
        <input
          id="building-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('buildingNamePlaceholder')}
          aria-invalid={!!fieldErrors.name}
        />
      </FormGroup>
      <FormGroup label={t('buildingAddress')} htmlFor="building-address">
        <input
          id="building-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('buildingAddressPlaceholder')}
        />
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('buildingSaving') : tCommon('save')}
        submitting={submitting}
        cancelTo={`/dashboards/admin/settings/buildings/${id}`}
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}

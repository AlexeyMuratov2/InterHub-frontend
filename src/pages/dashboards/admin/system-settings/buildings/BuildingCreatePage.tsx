import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBuilding } from '../../../../../entities/schedule';
import { useCanEditInAdmin } from '../../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions } from '../../../../../shared/ui';

export function BuildingCreatePage() {
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
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
    if (!name.trim()) err.name = t('buildingErrorNameRequired');
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const { data, error: err } = await createBuilding({
      name: name.trim(),
      address: address.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message ?? t('buildingErrorCreate'));
      return;
    }
    if (data) {
      navigate(`/dashboards/admin/settings/buildings/${data.id}`, { replace: true });
      return;
    }
    navigate('/dashboards/admin/settings', { replace: true });
  };

  const { t: tCommon } = useTranslation('common');

  if (!canEdit) return null;

  return (
    <FormPageLayout title={t('buildingCreatePageTitle')} error={error} onSubmit={handleSubmit}>
      <FormGroup label={t('buildingNameRequired')} htmlFor="building-name" error={fieldErrors.name}>
        <input
          id="building-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('buildingNamePlaceholder')}
          autoComplete="off"
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
          autoComplete="off"
        />
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('buildingCreating') : tCommon('create')}
        submitting={submitting}
        cancelTo="/dashboards/admin/settings"
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}

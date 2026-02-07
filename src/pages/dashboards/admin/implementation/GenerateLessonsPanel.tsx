import { useState } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import { Alert } from '../../../../shared/ui';
import { generateLessons, regenerateLessons } from '../../../../entities/offering';

export interface GenerateLessonsPanelProps {
  offeringId: string;
  semesterId: string | null;
  /** Название/номер семестра для отображения (вместо id) */
  semesterLabel?: string | null;
  slotsCount: number;
  onSuccess: (count: number) => void;
  onToast: (message: string) => void;
  lessonsAlreadyExist: boolean;
  onLessonsExistChange: (value: boolean) => void;
  blockActions?: boolean;
}

export function GenerateLessonsPanel({
  offeringId,
  semesterId,
  semesterLabel,
  slotsCount,
  onSuccess,
  onToast,
  lessonsAlreadyExist,
  onLessonsExistChange,
  blockActions,
}: GenerateLessonsPanelProps) {
  const { t } = useTranslation('dashboard');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = slotsCount > 0 && semesterId && !blockActions;

  const handleGenerate = async () => {
    if (!semesterId) return;
    setError(null);
    setGenerating(true);
    const { data, error: err } = await generateLessons(offeringId, semesterId);
    setGenerating(false);
    if (err) {
      if (err.code === 'OFFERING_NO_SLOTS') {
        setError(t('implementationNoSlotsError'));
        return;
      }
      if (err.code === 'OFFERING_LESSONS_ALREADY_EXIST' || err.status === 409) {
        onLessonsExistChange(true);
        setError(t('implementationLessonsAlreadyExist'));
        return;
      }
      setError(err.message ?? t('implementationErrorLoadOfferings'));
      return;
    }
    if (data) {
      onToast(t('implementationGenerateSuccess', { count: data.lessonsCreated }));
      onSuccess(data.lessonsCreated);
    }
  };

  const handleRegenerate = async () => {
    if (!semesterId) return;
    setError(null);
    setGenerating(true);
    const { data, error: err } = await regenerateLessons(offeringId, semesterId);
    setGenerating(false);
    if (err) {
      setError(err.message ?? t('implementationErrorLoadOfferings'));
      return;
    }
    if (data) {
      onToast(t('implementationRegenerateSuccess', { count: data.lessonsCreated }));
      onLessonsExistChange(false);
      onSuccess(data.lessonsCreated);
    }
  };

  if (!semesterId) return null;

  return (
    <section style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
      <h3 className="entity-view-card-title">{t('implementationGenerateLessons')}</h3>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
        {t('implementationSemesterReadOnly')}: {semesterLabel ?? semesterId}
      </p>
      {!canGenerate && slotsCount === 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <Alert variant="error">{t('implementationNoSlotsError')}</Alert>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '0.75rem' }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {lessonsAlreadyExist && (
        <div style={{ marginBottom: '0.75rem' }}>
          <Alert variant="info">{t('implementationLessonsAlreadyExist')}</Alert>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {!lessonsAlreadyExist ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
          >
            {generating ? t('loading') : t('implementationGenerateButton')}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={handleRegenerate}
            disabled={!canGenerate || generating}
          >
            {generating ? t('loading') : t('implementationRegenerateButton')}
          </button>
        )}
      </div>
    </section>
  );
}

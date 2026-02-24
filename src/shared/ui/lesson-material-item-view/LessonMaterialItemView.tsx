/**
 * Блок отображения одного материала урока: название, описание, список файлов (FileCard).
 * Переиспользуется на странице урока преподавателя и студента — единый дизайн.
 */
import { useTranslation } from '../../i18n';
import { FileCard } from '../file-card';
import type { CompositionLessonMaterialDto, CompositionStoredFileDto } from '../../api/types';

export interface LessonMaterialItemViewProps {
  material: CompositionLessonMaterialDto;
  onDownload: (file: CompositionStoredFileDto) => void;
  /** Если передан — показывается кнопка удаления у каждого файла (страница преподавателя) */
  onDelete?: (file: CompositionStoredFileDto) => void;
  /** Дополнительные действия в шапке (например, кнопки редактирования/удаления материала для преподавателя) */
  actions?: React.ReactNode;
}

export function LessonMaterialItemView({ material, onDownload, onDelete, actions }: LessonMaterialItemViewProps) {
  const { t } = useTranslation('dashboard');

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
            {material.name?.trim() || t('lessonMaterialUntitled')}
          </h3>
          {material.description?.trim() && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              {material.description.trim()}
            </p>
          )}
        </div>
        {actions != null && <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div>}
      </div>
      {material.files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {material.files.map((file) => (
            <FileCard
              key={file.id}
              title={file.originalName?.trim() || t('lessonMaterialFile')}
              size={file.size}
              uploadedAt={file.uploadedAt}
              description={file.contentType || undefined}
              onDownload={() => onDownload(file)}
              onDelete={onDelete ? () => onDelete(file) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

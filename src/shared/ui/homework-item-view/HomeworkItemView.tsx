/**
 * Блок отображения одного домашнего задания: заголовок, описание, баллы, список файлов (FileCard).
 * Переиспользуется на странице урока преподавателя и студента — единый дизайн.
 */
import { useTranslation } from '../../i18n';
import { FileCard } from '../file-card';
import type { CompositionStoredFileDto } from '../../api/types';

export interface HomeworkItemViewProps {
  title: string | null;
  description: string | null;
  points: number | null;
  /** Список файлов (из hw.file или hw.files в зависимости от API) */
  files: CompositionStoredFileDto[];
  onDownload: (file: CompositionStoredFileDto) => void;
  /** Если передан — показывается кнопка удаления у каждого файла (страница преподавателя) */
  onDelete?: (file: CompositionStoredFileDto) => void;
  /** Дополнительные действия в шапке (например, кнопки редактирования/удаления ДЗ для преподавателя) */
  actions?: React.ReactNode;
}

export function HomeworkItemView({
  title,
  description,
  points,
  files,
  onDownload,
  onDelete,
  actions,
}: HomeworkItemViewProps) {
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
          {title?.trim() || t('homeworkUntitled')}
        </h3>
        {description?.trim() && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {description.trim()}
          </p>
        )}
        {points != null && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {t('homeworkPoints')}: {points}
          </p>
        )}
        </div>
        {actions != null && <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div>}
      </div>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {files.map((file) => (
            <FileCard
              key={file.id}
              title={file.originalName?.trim() || t('homeworkFile')}
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

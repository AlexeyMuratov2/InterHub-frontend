/**
 * Отображение одного домашнего задания в стиле страницы детального просмотра:
 * заголовок, описание, баллы, список файлов в виде DetailFileRow.
 */
import { useTranslation } from '../../i18n';
import { DetailFileRow } from '../detail-file-row';
import { formatFileSize } from '../../lib/fileUtils';
import type { CompositionStoredFileDto } from '../../api/types';

export interface HomeworkDetailViewProps {
  title: string | null;
  description: string | null;
  points: number | null;
  files: CompositionStoredFileDto[];
  onDownload: (file: CompositionStoredFileDto) => void;
}

export function HomeworkDetailView({
  title,
  description,
  points,
  files,
  onDownload,
}: HomeworkDetailViewProps) {
  const { t } = useTranslation('dashboard');
  const displayTitle = title?.trim() || t('homeworkUntitled');

  return (
    <div className="ed-material-list">
      <div style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
          {displayTitle}
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
      {files.length > 0 ? (
        <div className="ed-material-list" style={{ gap: '0.375rem' }}>
          {files.map((file) => (
            <DetailFileRow
              key={file.id}
              title={file.originalName?.trim() || t('homeworkFile')}
              meta={file.size != null ? formatFileSize(file.size) : undefined}
              onDownload={() => onDownload(file)}
              downloadLabel={t('download')}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

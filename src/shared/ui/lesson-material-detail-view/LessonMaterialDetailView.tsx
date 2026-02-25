/**
 * Отображение одного материала урока в стиле страницы детального просмотра:
 * заголовок материала, описание, список файлов в виде DetailFileRow.
 */
import { useTranslation } from '../../i18n';
import { DetailFileRow } from '../detail-file-row';
import { formatFileSize } from '../../lib/fileUtils';
import type { CompositionLessonMaterialDto, CompositionStoredFileDto } from '../../api/types';

export interface LessonMaterialDetailViewProps {
  material: CompositionLessonMaterialDto;
  onDownload: (file: CompositionStoredFileDto) => void;
}

export function LessonMaterialDetailView({ material, onDownload }: LessonMaterialDetailViewProps) {
  const { t } = useTranslation('dashboard');
  const title = material.name?.trim() || t('lessonMaterialUntitled');

  return (
    <div className="ed-material-list">
      <div style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
          {title}
        </h3>
        {material.description?.trim() && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {material.description.trim()}
          </p>
        )}
      </div>
      {material.files.length > 0 ? (
        <div className="ed-material-list" style={{ gap: '0.375rem' }}>
          {material.files.map((file) => (
            <DetailFileRow
              key={file.id}
              title={file.originalName?.trim() || t('lessonMaterialFile')}
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

/**
 * Строка материала в стиле страницы детального просмотра: иконка, название, описание, кнопка скачать.
 * Переиспользуется для материалов курса и материалов урока.
 */
import { FileText, Download } from 'lucide-react';

export interface DetailMaterialRowProps {
  title: string;
  description?: string | null;
  fileMeta?: string | null;
  onDownload?: () => void;
  downloadLabel?: string;
}

export function DetailMaterialRow({
  title,
  description,
  fileMeta,
  onDownload,
  downloadLabel = 'Download',
}: DetailMaterialRowProps) {
  return (
    <div className="ed-material-row">
      <div className="ed-material-icon">
        <FileText size={18} />
      </div>
      <div className="ed-material-info">
        <span className="ed-material-title">{title}</span>
        {description != null && description !== '' && (
          <span className="ed-material-desc">{description}</span>
        )}
        {fileMeta != null && fileMeta !== '' && (
          <span className="ed-material-file-meta">{fileMeta}</span>
        )}
      </div>
      {onDownload && (
        <button
          type="button"
          className="ed-material-download"
          onClick={onDownload}
          title={downloadLabel}
        >
          <Download style={{ width: '1.25rem', height: '1.25rem' }} aria-hidden />
          <span className="ed-material-download-text">{downloadLabel}</span>
        </button>
      )}
    </div>
  );
}

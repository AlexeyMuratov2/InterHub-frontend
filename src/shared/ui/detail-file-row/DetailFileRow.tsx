/**
 * Строка файла в стиле страницы детального просмотра: иконка, название, мета, кнопка скачать.
 * Для списков файлов внутри материалов и домашних заданий.
 */
import { FileText, Download } from 'lucide-react';

export interface DetailFileRowProps {
  title: string;
  meta?: string | null;
  onDownload?: () => void;
  downloadLabel?: string;
}

export function DetailFileRow({
  title,
  meta,
  onDownload,
  downloadLabel = 'Download',
}: DetailFileRowProps) {
  return (
    <div className="ed-file-row">
      <div className="ed-file-row-icon">
        <FileText size={16} />
      </div>
      <div className="ed-file-row-info">
        <span className="ed-file-row-title">{title}</span>
        {meta != null && meta !== '' && (
          <span className="ed-file-row-meta">{meta}</span>
        )}
      </div>
      {onDownload && (
        <button
          type="button"
          className="ed-material-download"
          onClick={onDownload}
          title={downloadLabel}
        >
          <Download style={{ width: '1.125rem', height: '1.125rem' }} aria-hidden />
          <span className="ed-material-download-text">{downloadLabel}</span>
        </button>
      )}
    </div>
  );
}

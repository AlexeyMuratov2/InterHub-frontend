import { useTranslation, formatDate } from '../../i18n';
import { formatFileSize } from '../../lib/fileUtils';
import { Download, FileText, Trash2 } from 'lucide-react';

/** Пропсы для отображения карточки файла (общая сущность для любых модулей) */
export interface FileCardProps {
  /** Название файла или материала */
  title: string;
  /** Размер в байтах (опционально) */
  size?: number;
  /** Дата загрузки (ISO строка, опционально) */
  uploadedAt?: string;
  /** Описание (опционально) */
  description?: string | null;
  /** Обработчик скачивания — если передан, показывается кнопка */
  onDownload?: () => void;
  /** Обработчик удаления — если передан, показывается кнопка */
  onDelete?: () => void;
  /** Дополнительный CSS-класс контейнера */
  className?: string;
}

/**
 * Карточка файла: иконка, название, размер/дата, описание, кнопки скачать/удалить.
 * Переиспользуемый компонент для отображения файла или материала курса в любом модуле.
 */
export function FileCard({
  title,
  size,
  uploadedAt,
  description,
  onDownload,
  onDelete,
  className,
}: FileCardProps) {
  const { t, locale } = useTranslation('dashboard');

  const metaParts: string[] = [];
  if (size != null) metaParts.push(formatFileSize(size));
  if (uploadedAt) metaParts.push(`${t('uploaded')} ${formatDate(uploadedAt, locale)}`);
  const metaLine = metaParts.length > 0 ? metaParts.join(' • ') : null;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.25rem',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        border: 'none',
      }}
    >
      <FileText
        style={{ width: '2rem', height: '2rem', color: '#64748b', flexShrink: 0 }}
        aria-hidden
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: metaLine ? '0.25rem' : 0,
            color: '#0f172a',
          }}
        >
          {title}
        </div>
        {metaLine && (
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{metaLine}</div>
        )}
        {description && (
          <div
            style={{
              fontSize: '0.875rem',
              color: '#64748b',
              marginTop: '0.25rem',
            }}
          >
            {description}
          </div>
        )}
      </div>
      {(onDownload || onDelete) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
          }}
        >
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              title={t('download')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.25rem',
                height: '2.25rem',
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
            >
              <Download style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title={t('delete')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.25rem',
                height: '2.25rem',
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: '#dc2626',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
            >
              <Trash2 style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

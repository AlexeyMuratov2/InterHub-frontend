import { useTranslation } from '../../i18n';
import { AttachmentStatusList } from '../attachment-status-list';
import type { DocumentAttachmentDto } from '../../api/types';

export interface HomeworkItemViewProps {
  title: string | null;
  description: string | null;
  points: number | null;
  attachments: DocumentAttachmentDto[];
  onDownload: (attachment: DocumentAttachmentDto) => void;
  onDelete?: (attachment: DocumentAttachmentDto) => void;
  actions?: React.ReactNode;
}

export function HomeworkItemView({
  title,
  description,
  points,
  attachments,
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
          gap: '0.75rem',
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

      <AttachmentStatusList
        attachments={attachments}
        onDownload={onDownload}
        onDelete={onDelete}
      />
    </div>
  );
}

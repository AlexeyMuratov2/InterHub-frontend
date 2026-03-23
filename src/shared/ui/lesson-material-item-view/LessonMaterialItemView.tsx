import { useTranslation } from '../../i18n';
import { normalizeDocumentAttachments } from '../../lib/documentAttachment';
import { AttachmentStatusList } from '../attachment-status-list';
import type { CompositionLessonMaterialDto, DocumentAttachmentDto } from '../../api/types';

export interface LessonMaterialItemViewProps {
  material: CompositionLessonMaterialDto;
  onDownload: (attachment: DocumentAttachmentDto) => void;
  onDelete?: (attachment: DocumentAttachmentDto) => void;
  actions?: React.ReactNode;
}

export function LessonMaterialItemView({
  material,
  onDownload,
  onDelete,
  actions,
}: LessonMaterialItemViewProps) {
  const { t } = useTranslation('dashboard');
  const attachments = normalizeDocumentAttachments(material);

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

      <AttachmentStatusList
        attachments={attachments}
        onDownload={onDownload}
        onDelete={onDelete}
      />
    </div>
  );
}

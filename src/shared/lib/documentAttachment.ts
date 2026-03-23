import type {
  CompositionHomeworkDto,
  CompositionLessonMaterialDto,
  CompositionStoredFileDto,
  DocumentAttachmentDto,
  HomeworkDto,
  StoredFileDto,
} from '../api/types';

type LegacyStoredFileLike = StoredFileDto | CompositionStoredFileDto;

type AttachmentOwnerLike =
  | Pick<CompositionLessonMaterialDto, 'attachments' | 'files'>
  | Pick<HomeworkDto, 'attachments' | 'files' | 'file'>
  | Pick<CompositionHomeworkDto, 'attachments' | 'files'>;

function isDocumentAttachmentDto(value: unknown): value is DocumentAttachmentDto {
  return typeof value === 'object' && value !== null && 'progressPercent' in value && 'downloadAvailable' in value;
}

function toDocumentAttachmentFromStoredFile(file: LegacyStoredFileLike): DocumentAttachmentDto {
  return {
    id: file.id,
    fileName: file.originalName ?? 'File',
    declaredContentType: file.contentType ?? 'application/octet-stream',
    sizeBytes: file.size,
    status: 'ACTIVE',
    stage: 'READY',
    progressPercent: 100,
    failureCode: null,
    downloadAvailable: true,
  };
}

export function normalizeDocumentAttachments(owner: AttachmentOwnerLike | null | undefined): DocumentAttachmentDto[] {
  if (!owner) return [];

  const nextAttachments = Array.isArray(owner.attachments) ? owner.attachments.filter(isDocumentAttachmentDto) : [];
  if (nextAttachments.length > 0) {
    return nextAttachments;
  }

  const fileList = Array.isArray(owner.files) ? owner.files : [];
  if (fileList.length > 0) {
    return fileList.map((file) => toDocumentAttachmentFromStoredFile(file));
  }

  if ('file' in owner && owner.file) {
    return [toDocumentAttachmentFromStoredFile(owner.file)];
  }

  return [];
}

export function isDocumentAttachmentReady(attachment: DocumentAttachmentDto): boolean {
  return attachment.stage === 'READY' || attachment.status === 'ACTIVE';
}

export function isDocumentAttachmentFailed(attachment: DocumentAttachmentDto): boolean {
  return attachment.stage === 'FAILED' || attachment.status === 'FAILED';
}

export function needsDocumentAttachmentPolling(attachment: DocumentAttachmentDto): boolean {
  if (isDocumentAttachmentReady(attachment) || isDocumentAttachmentFailed(attachment)) {
    return false;
  }

  return attachment.status !== 'DELETED' && attachment.status !== 'EXPIRED';
}

export function mergeDocumentAttachmentStatus(
  attachment: DocumentAttachmentDto,
  liveStatuses: Record<string, DocumentAttachmentDto>
): DocumentAttachmentDto {
  return liveStatuses[attachment.id] ?? attachment;
}

import { request, requestBlob } from './client';
import type { DocumentAttachmentDto, ErrorResponse } from './types';

export type DocumentAttachmentsApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

function parseDownloadFilename(headers?: Headers): string {
  if (!headers) return 'attachment.bin';

  const disposition = headers.get('Content-Disposition');
  if (!disposition) return 'attachment.bin';

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const fallbackMatch = disposition.match(/filename="?([^";]+)"?/i);
  return fallbackMatch?.[1]?.trim().replace(/^"|"$/g, '') || 'attachment.bin';
}

export async function getDocumentAttachment(
  attachmentId: string
): Promise<DocumentAttachmentsApiResult<DocumentAttachmentDto>> {
  const path = `/api/document-attachments/${encodeURIComponent(attachmentId)}`;
  const result = await request<DocumentAttachmentDto>(path, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function downloadDocumentAttachment(
  attachmentId: string
): Promise<DocumentAttachmentsApiResult<void>> {
  const path = `/api/document-attachments/${encodeURIComponent(attachmentId)}/download`;
  const result = await requestBlob(path, { method: 'GET' });

  if (result.error || !result.data) {
    return {
      error: result.error ? { ...result.error, status: result.status } : { message: 'Download failed', status: result.status },
    };
  }

  const filename = parseDownloadFilename(result.headers);
  const objectUrl = URL.createObjectURL(result.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);

  return {};
}

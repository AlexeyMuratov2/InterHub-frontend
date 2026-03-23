import { useEffect, useMemo, useState } from 'react';
import { getDocumentAttachment } from '../api/documentAttachments';
import type { DocumentAttachmentDto } from '../api';
import { needsDocumentAttachmentPolling } from '../lib/documentAttachment';

export interface UseDocumentAttachmentPollingOptions {
  intervalMs?: number;
}

export interface UseDocumentAttachmentPollingResult {
  liveStatuses: Record<string, DocumentAttachmentDto>;
  hasPendingAttachments: boolean;
}

export function useDocumentAttachmentPolling(
  attachments: DocumentAttachmentDto[],
  options: UseDocumentAttachmentPollingOptions = {}
): UseDocumentAttachmentPollingResult {
  const { intervalMs = 2500 } = options;
  const [liveStatuses, setLiveStatuses] = useState<Record<string, DocumentAttachmentDto>>({});

  const trackedAttachments = useMemo(
    () => attachments.filter((attachment) => !!attachment.id),
    [attachments]
  );

  const signature = useMemo(
    () =>
      trackedAttachments
        .map((attachment) => `${attachment.id}:${attachment.status}:${attachment.stage}:${attachment.progressPercent}`)
        .sort()
        .join('|'),
    [trackedAttachments]
  );

  const resolvedAttachments = useMemo(
    () => trackedAttachments.map((attachment) => liveStatuses[attachment.id] ?? attachment),
    [liveStatuses, trackedAttachments]
  );

  const pollingSignature = useMemo(
    () =>
      resolvedAttachments
        .map((attachment) => `${attachment.id}:${attachment.status}:${attachment.stage}:${attachment.progressPercent}`)
        .sort()
        .join('|'),
    [resolvedAttachments]
  );

  useEffect(() => {
    const trackedIds = new Set(trackedAttachments.map((attachment) => attachment.id));
    setLiveStatuses((current) => {
      const nextEntries = Object.entries(current).filter(([attachmentId]) => trackedIds.has(attachmentId));
      if (nextEntries.length === Object.keys(current).length) {
        return current;
      }
      return Object.fromEntries(nextEntries);
    });
  }, [signature, trackedAttachments]);

  useEffect(() => {
    const pendingAttachments = resolvedAttachments.filter((attachment) =>
      needsDocumentAttachmentPolling(attachment)
    );

    if (pendingAttachments.length === 0) {
      return undefined;
    }

    let disposed = false;

    const poll = async () => {
      const results = await Promise.all(
        pendingAttachments.map(async (attachment) => {
          const result = await getDocumentAttachment(attachment.id);
          return result.data ?? null;
        })
      );

      if (disposed) {
        return;
      }

      setLiveStatuses((current) => {
        const next = { ...current };
        let changed = false;
        for (const attachment of results) {
          if (attachment) {
            const previous = current[attachment.id];
            if (
              !previous
              || previous.status !== attachment.status
              || previous.stage !== attachment.stage
              || previous.progressPercent !== attachment.progressPercent
              || previous.failureCode !== attachment.failureCode
              || previous.downloadAvailable !== attachment.downloadAvailable
              || previous.fileName !== attachment.fileName
              || previous.sizeBytes !== attachment.sizeBytes
              || previous.declaredContentType !== attachment.declaredContentType
            ) {
              next[attachment.id] = attachment;
              changed = true;
            }
          }
        }
        return changed ? next : current;
      });
    };

    void poll();
    const timerId = window.setInterval(() => {
      void poll();
    }, intervalMs);

    return () => {
      disposed = true;
      window.clearInterval(timerId);
    };
  }, [intervalMs, pollingSignature, resolvedAttachments, signature, trackedAttachments]);

  const hasPendingAttachments = resolvedAttachments.some((attachment) =>
    needsDocumentAttachmentPolling(attachment)
  );

  return {
    liveStatuses,
    hasPendingAttachments,
  };
}

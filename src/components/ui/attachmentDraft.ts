export type PendingAttachment = {
  id: string;
  file: File;
  /** Captured once when the local draft row is added; never sent to an API. */
  addedAt: string;
  documentCodeId: string;
  description?: string;
  shipmentNumber?: string;
};

let nextAttachmentId = 0;

/** Creates a stable client-only key for a newly selected attachment row. */
export function createPendingAttachment(file: File): PendingAttachment {
  nextAttachmentId += 1;
  return {
    id: `attachment-${Date.now().toString(36)}-${nextAttachmentId}`,
    file,
    addedAt: new Date().toISOString(),
    documentCodeId: '',
  };
}

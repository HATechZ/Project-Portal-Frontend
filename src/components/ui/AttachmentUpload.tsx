import { FileText, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PendingAttachment } from './attachmentDraft';

export type { PendingAttachment } from './attachmentDraft';

export type AttachmentDocumentCode = { id: string; name: string; code?: string; family?: string };
export type AttachmentMetadataMode = 'document-code' | 'document-metadata';

export function AttachmentUpload({ attachments, codes, disabled = false, onAdd, onDocumentCodeChange, onRemove, onMetadataChange, metadataMode = 'document-code', maxFiles, maxFileBytes, accept, onValidationError }: {
  attachments: PendingAttachment[];
  codes: AttachmentDocumentCode[];
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onDocumentCodeChange: (attachmentId: string, documentCodeId: string) => void;
  onRemove: (attachmentId: string) => void;
  onMetadataChange?: (attachmentId: string, field: 'description' | 'shipmentNumber', value: string) => void;
  metadataMode?: AttachmentMetadataMode;
  maxFiles?: number;
  maxFileBytes?: number;
  accept?: string;
  onValidationError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const supportsDocumentMetadata = metadataMode === 'document-metadata';
  const acceptedExtensions = (accept ?? '').split(',').map((value) => value.trim().toLowerCase()).filter((value) => value.startsWith('.'));

  const addFiles = (fileList: FileList | File[]) => {
    const remaining = maxFiles === undefined ? Number.POSITIVE_INFINITY : Math.max(0, maxFiles - attachments.length);
    if (!remaining) { onValidationError?.(`Maximum ${maxFiles} files reached.`); return; }

    const accepted: File[] = [];
    Array.from(fileList).forEach((file) => {
      const extension = file.name.includes('.') ? `.${file.name.split('.').pop()!.toLowerCase()}` : '';
      if (acceptedExtensions.length && !acceptedExtensions.includes(extension)) { onValidationError?.(`${file.name} has an unsupported file type.`); return; }
      if (maxFileBytes !== undefined && file.size > maxFileBytes) { onValidationError?.(`${file.name} exceeds ${formatFileSize(maxFileBytes)}.`); return; }
      accepted.push(file);
    });
    const files = accepted.slice(0, remaining);
    if (accepted.length > files.length && maxFiles !== undefined) onValidationError?.(`Maximum ${maxFiles} files reached.`);
    if (files.length) onAdd(files);
  };

  return <section className="attachment-upload">
    <div className="attachment-upload__title"><strong>Attachments</strong><span>Optional</span></div>
    <div className={dragging ? 'attachment-dropzone is-dragging' : 'attachment-dropzone'} onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!disabled) addFiles(event.dataTransfer.files); }}>
      <Upload aria-hidden="true" size={22} />
      <strong>Drag & drop files here</strong>
      <span>or</span>
      <button disabled={disabled || (maxFiles !== undefined && attachments.length >= maxFiles)} onClick={() => inputRef.current?.click()} type="button">Browse files</button>
      <small>{supportsDocumentMetadata ? 'PDF, DOCX, XLSX, DWG, DXF, JPG, PNG, ZIP and more · Maximum 20 files · 25 MiB each' : 'Select files and classify each attachment.'}</small>
      <input accept={accept} disabled={disabled || (maxFiles !== undefined && attachments.length >= maxFiles)} multiple onChange={(event) => { if (event.target.files?.length) addFiles(event.target.files); event.target.value = ''; }} ref={inputRef} type="file" />
    </div>
    {attachments.length ? <div className="attachment-table-wrap"><table className="attachment-table attachment-table--shared"><thead><tr><th>File Name</th><th>Description</th><th>Document Code</th><th>Ship. No</th><th>Last Update</th><th>Action</th></tr></thead><tbody>{attachments.map((attachment) => {
      const documentCode = <select aria-label={`Document code for ${attachment.file.name}`} disabled={disabled} onChange={(event) => onDocumentCodeChange(attachment.id, event.target.value)} required value={attachment.documentCodeId}><option value="">Select document code</option>{codes.map((code) => <option key={code.id} value={code.id}>{code.family ? `[${code.family}] ${code.code} — ${code.name}` : code.code ? `${code.code} — ${code.name}` : code.name}</option>)}</select>;
      const fileName = <><strong><FileText aria-hidden="true" size={15} />{attachment.file.name}</strong><small>{formatFileSize(attachment.file.size)}</small></>;
      const remove = <button aria-label={`Remove ${attachment.file.name}`} className="attachment-table__remove" disabled={disabled} onClick={() => onRemove(attachment.id)} title="Remove file" type="button"><Trash2 aria-hidden="true" size={16} /></button>;
      return <tr key={attachment.id}><td>{fileName}</td><td>{supportsDocumentMetadata ? <input aria-label={`Description for ${attachment.file.name}`} disabled={disabled} maxLength={10000} onChange={(event) => onMetadataChange?.(attachment.id, 'description', event.target.value)} placeholder="Add description" value={attachment.description ?? ''} /> : <span className="attachment-table__unavailable" title="Description is not supported for this upload">—</span>}</td><td>{documentCode}</td><td>{supportsDocumentMetadata ? <input aria-label={`Shipment number for ${attachment.file.name}`} disabled={disabled} maxLength={10} onChange={(event) => onMetadataChange?.(attachment.id, 'shipmentNumber', event.target.value)} placeholder="e.g. 01" value={attachment.shipmentNumber ?? ''} /> : <span className="attachment-table__unavailable" title="Shipments are not supported for this upload">—</span>}</td><td><span className="attachment-table__draft-time" title="Local draft timestamp; the server timestamp replaces it after upload">{formatAddedAt(attachment.addedAt)}<small>Draft</small></span></td><td>{remove}</td></tr>;
    })}</tbody></table></div> : null}
  </section>;
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function formatAddedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

import { Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

export type PendingAttachment = { file: File; documentCodeId: string };
type DocumentCode = { id: string; name: string; code?: string };
type RowDetails = { description: string; shipmentNo: string };

export function AttachmentUpload({ attachments, codes, disabled = false, onAdd, onDocumentCodeChange, onRemove }: {
  attachments: PendingAttachment[];
  codes: DocumentCode[];
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onDocumentCodeChange: (index: number, documentCodeId: string) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const idsRef = useRef(new WeakMap<File, string>());
  const nextId = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [details, setDetails] = useState<Record<string, RowDetails>>({});
  const addFiles = (files: FileList | File[]) => onAdd(Array.from(files));
  const getId = (file: File) => {
    const existing = idsRef.current.get(file);
    if (existing) return existing;
    const id = `attachment-${nextId.current++}`;
    idsRef.current.set(file, id);
    return id;
  };
  const updateDetail = (id: string, key: keyof RowDetails, value: string) => setDetails((current) => ({ ...current, [id]: { ...{ description: '', shipmentNo: '' }, ...current[id], [key]: value } }));

  return <section className="attachment-upload">
    <div className="attachment-upload__title"><strong>Attachments</strong><span>Optional</span></div>
    <div className={dragging ? 'attachment-dropzone is-dragging' : 'attachment-dropzone'} onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!disabled) addFiles(event.dataTransfer.files); }}>
      <Upload aria-hidden="true" size={22} /><strong>Drag & drop files here</strong><span>or</span><button disabled={disabled} onClick={() => inputRef.current?.click()} type="button">Browse Files</button><small>Choose files using the existing upload rules.</small>
      <input disabled={disabled} multiple onChange={(event) => { if (event.target.files?.length) addFiles(event.target.files); event.target.value = ''; }} ref={inputRef} type="file" />
    </div>
    {attachments.length ? <div className="attachment-table-wrap"><table className="attachment-table"><thead><tr><th>File Name</th><th>Description</th><th>Document Code</th><th>Ship. No</th><th>Last Update</th><th>Action</th></tr></thead><tbody>{attachments.map((attachment, index) => {
      const id = getId(attachment.file);
      const row = details[id] ?? { description: '', shipmentNo: '' };
      return <tr key={id}><td><strong>{attachment.file.name}</strong><small>{formatFileSize(attachment.file.size)}</small></td><td><input aria-label={`Description for ${attachment.file.name}`} disabled={disabled} onChange={(event) => updateDetail(id, 'description', event.target.value)} placeholder="Add description" value={row.description} /></td><td><select aria-label={`Document code for ${attachment.file.name}`} disabled={disabled} onChange={(event) => onDocumentCodeChange(index, event.target.value)} required value={attachment.documentCodeId}><option value="">Select document code</option>{codes.map((code) => <option key={code.id} value={code.id}>{code.code ? `${code.code} - ${code.name}` : code.name}</option>)}</select></td><td><input aria-label={`Shipment number for ${attachment.file.name}`} disabled={disabled} onChange={(event) => updateDetail(id, 'shipmentNo', event.target.value)} placeholder="e.g. 01" value={row.shipmentNo} /></td><td>{formatDate(attachment.file.lastModified)}</td><td><button aria-label={`Remove ${attachment.file.name}`} disabled={disabled} onClick={() => onRemove(index)} title="Remove file" type="button"><Trash2 aria-hidden="true" size={16} /></button></td></tr>;
    })}</tbody></table></div> : null}
  </section>;
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function formatDate(value: number) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

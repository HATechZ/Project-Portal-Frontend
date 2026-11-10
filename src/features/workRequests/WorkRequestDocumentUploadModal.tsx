import { type FormEvent } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { AttachmentUpload } from '@/components/ui/AttachmentUpload';
import { createPendingAttachment, type PendingAttachment } from '@/components/ui/attachmentDraft';

export const MAX_DOCUMENTS = 20;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const fileAccept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.dwg,.dxf,.jpg,.jpeg,.png,.zip';
type DocumentCodeOption = { id: string; code: string; name: string; family: string };

export function WorkRequestDocumentUploadModal({ attachments, codes, codesError, codesLoading, onChange, onClose, onSubmit, saving }: { attachments: PendingAttachment[]; codes: DocumentCodeOption[]; codesError: boolean; codesLoading: boolean; onChange: (attachments: PendingAttachment[]) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saving: boolean }) {
  const update = (id: string, patch: Partial<PendingAttachment>) => onChange(attachments.map((attachment) => attachment.id === id ? { ...attachment, ...patch } : attachment));
  return <div className="division-modal-backdrop"><section aria-modal="true" className="division-modal division-modal--wide work-request-document-modal" role="dialog"><div className="division-modal__head"><div><strong>Add Documents</strong><span>Attach and classify supporting files.</span></div><button aria-label="Close" disabled={saving} onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div><form className="division-form" onSubmit={onSubmit}>{codesError ? <p>Document Codes are unavailable. Try again before adding documents.</p> : <AttachmentUpload accept={fileAccept} attachments={attachments} codes={codes} disabled={saving || codesLoading} maxFileBytes={MAX_FILE_BYTES} maxFiles={MAX_DOCUMENTS} metadataMode="document-metadata" onAdd={(files) => onChange([...attachments, ...files.map((file) => ({ ...createPendingAttachment(file), description: '', shipmentNumber: '' }))])} onDocumentCodeChange={(id, documentCodeId) => update(id, { documentCodeId })} onMetadataChange={(id, field, value) => update(id, { [field]: value })} onRemove={(id) => onChange(attachments.filter((attachment) => attachment.id !== id))} onValidationError={(message) => toast.error(message)} />}<div className="division-form__actions"><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={saving || codesLoading || codesError || !attachments.length} type="submit">{saving ? 'Uploading...' : 'Upload Documents'}</button></div></form></section></div>;
}


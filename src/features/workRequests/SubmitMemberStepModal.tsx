import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, UserRound, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { AttachmentUpload } from '@/components/ui/AttachmentUpload';
import { createPendingAttachment, type PendingAttachment } from '@/components/ui/attachmentDraft';
import { readableApiError } from '@/services/roleService';
import { getWorkRequestAvailableDocumentCodes, uploadWorkRequestDocuments } from '@/services/workRequestService';
import { createRequestId } from '@/utils/requestId';
import { documentVersionId, type ApiRecord } from './documentData';
import { fileAccept, MAX_DOCUMENTS, MAX_FILE_BYTES } from './WorkRequestDocumentUploadModal';

export type AttachedDocument = { draftId: string; documentId: string; documentVersionId: string };

export function SubmitMemberStepModal({ destination, isFinalMember, onClose, onSubmit, saving, workRequestId, message, onMessageChange, attachedDocuments, onDocumentsChange }: { destination: string; isFinalMember: boolean; onClose: () => void; onSubmit: (versionIds: string[]) => Promise<void>; saving: boolean; workRequestId: string; message: string; onMessageChange: (value: string) => void; attachedDocuments: AttachedDocument[]; onDocumentsChange: (value: AttachedDocument[]) => void }) {
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const submitting = useRef(false);
  const uploadRequestIds = useRef<Record<string, string>>({});
  const queryClient = useQueryClient();
  const codesQuery = useQuery({ queryKey: ['work-request', workRequestId, 'available-document-codes'], queryFn: () => getWorkRequestAvailableDocumentCodes(workRequestId) });
  const upload = useMutation({ mutationFn: (document: PendingAttachment) => uploadWorkRequestDocuments(workRequestId, [document], uploadRequestIds.current[document.id] ??= createRequestId()) });
  const submitUpload = async () => {
    if (submitting.current || saving || upload.isPending) return;
    setError(null);
    if (unresolved.length) return void setError('An uploaded document did not return a version ID. Remove it from this submission and check the Work Request documents before trying again.');
    if (pending.some((item) => !item.documentCodeId || !item.file)) return void setError('Every document needs both a Document Code and a file.');
    if (pending.some((item) => (item.description?.length ?? 0) > 10000)) return void setError('Description must be 10,000 characters or fewer.');
    if (pending.some((item) => (item.shipmentNumber?.length ?? 0) > 10)) return void setError('Ship. No must be 10 characters or fewer.');
    submitting.current = true;
    setBusy(true);
    let stage: 'upload' | 'submit' = 'upload';
    try {
      const uploaded = [...attachedDocuments];
      for (const document of pending) {
        if (uploaded.some((item) => item.draftId === document.id)) continue;
        const response = await upload.mutateAsync(document);
        const item = response.data.length === 1 ? response.data[0] : undefined;
        const id = item ? documentVersionId(item as unknown as ApiRecord) : null;
        void queryClient.invalidateQueries({ queryKey: ['work-request', workRequestId, 'documents'] });
        if (!id || !item?.documentId) {
          setUnresolved((items) => [...items, document.id]);
          throw new Error('The uploaded document did not return its document and version IDs. Remove it from this submission and check the Work Request documents before trying again.');
        }
        uploaded.push({ draftId: document.id, documentId: item.documentId, documentVersionId: id });
        onDocumentsChange([...uploaded]);
      }
      stage = 'submit';
      await onSubmit(pending.map((item) => uploaded.find((doc) => doc.draftId === item.id)!.documentVersionId));
    } catch (reason) { setError(readableApiError(reason, stage === 'upload' ? 'Unable to upload the document. Please try again.' : 'Unable to submit your step. Please try again.')); }
    finally { submitting.current = false; setBusy(false); }
  };
  const updatePending = (id: string, patch: Partial<PendingAttachment>) => setPending((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const title = isFinalMember ? 'Submit to Team Lead' : 'Submit & Forward to Next Member';
  const subtitle = isFinalMember ? 'Complete your step and return the Work Request to the Team Lead.' : 'Complete your step and hand off the Work Request.';
  return <div className="division-modal-backdrop"><section aria-labelledby="submit-member-step-title" aria-modal="true" className="division-modal division-modal--wide work-request-member-submit-modal" role="dialog"><div className="division-modal__head work-request-member-submit-modal__header"><div className="work-request-member-submit-modal__heading"><span className="work-request-member-submit-modal__heading-icon"><ArrowRight aria-hidden="true" size={19} /></span><div><strong id="submit-member-step-title">{title}</strong><span>{subtitle}</span></div></div><button aria-label="Close" disabled={saving || busy} onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div><div className="division-form work-request-member-submit-modal__body"><div className="work-request-member-submit-modal__destination"><span className="work-request-member-submit-modal__section-title">{isFinalMember ? 'Returning to' : 'Forwarding to'}</span><div className="work-request-member-submit-modal__handoff"><span className="work-request-member-submit-modal__avatar"><UserRound aria-hidden="true" size={18} /></span><div><strong>{destination}</strong><span>{isFinalMember ? 'Team Lead' : 'Next responsible member'}</span></div></div></div><label className="work-request-member-submit-modal__message-field"><span><strong>Message</strong><em>Optional</em></span><textarea disabled={saving || busy} maxLength={10000} onChange={(event) => onMessageChange(event.target.value)} placeholder={isFinalMember ? 'Add a note for the Team Lead...' : 'Add a note for the next member...'} rows={2} value={message} /></label>{codesQuery.isError ? <p role="alert">Document Codes are unavailable. <button onClick={() => void codesQuery.refetch()} type="button">Retry</button></p> : <AttachmentUpload lockedAttachmentIds={[...attachedDocuments.map((item) => item.draftId), ...unresolved]} accept={fileAccept} attachments={pending} codes={(codesQuery.data ?? []).map((code) => ({ ...code, family: '' }))} disabled={saving || busy || codesQuery.isLoading} maxFileBytes={MAX_FILE_BYTES} maxFiles={MAX_DOCUMENTS} metadataMode="document-metadata" onAdd={(files) => setPending((items) => [...items, ...files.map((file) => ({ ...createPendingAttachment(file), description: '', shipmentNumber: '' }))])} onDocumentCodeChange={(id, documentCodeId) => updatePending(id, { documentCodeId })} onMetadataChange={(id, field, value) => updatePending(id, { [field]: value })} onRemove={(id) => { setPending((items) => items.filter((item) => item.id !== id)); onDocumentsChange(attachedDocuments.filter((item) => item.draftId !== id)); setUnresolved((items) => items.filter((item) => item !== id)); }} onValidationError={(error) => toast.error(error)} />}{error ? <p role="alert" className="role-form-error">{error}</p> : null}<div className="division-form__actions"><button disabled={saving || busy} onClick={onClose} type="button">Cancel</button><button disabled={saving || busy || (pending.length > 0 && (codesQuery.isLoading || codesQuery.isError))} onClick={() => void submitUpload()} type="button">{saving || busy ? 'Submitting...' : isFinalMember ? 'Submit to Team Lead' : 'Submit & Forward'}</button></div></div></section></div>;
}

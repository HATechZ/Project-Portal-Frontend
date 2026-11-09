import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, Eye, Paperclip, Send, Users, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { createPendingAttachment, type PendingAttachment } from '@/components/ui/attachmentDraft';
import { readableApiError } from '@/services/roleService';
import { createWorkRequestInfoRequest, downloadDocumentVersion, getWorkRequestAvailableDocumentCodes, previewDocumentVersion, respondToWorkRequestInfo, uploadWorkRequestDocuments, type WorkRequestAssignment, type WorkRequestDocumentUploadResponse, type WorkRequestInfoActor, type WorkRequestInfoAttachment, type WorkRequestInfoRequest, type WorkRequestInfoRequestRecipient } from '@/services/workRequestService';
import { createRequestId } from '@/utils/requestId';
import { recipientPresentation } from './recipientPresentation';
import { documentLabel, documentMimeType, documentVersionId, type ApiRecord } from './documentData';
import { formatDateTime } from './workflowPresentation';

type ReadState<T> = { data?: T; loading: boolean; error: boolean; retry: () => void };
const MAX_DOCUMENTS = 20;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const fileAccept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.dwg,.dxf,.jpg,.jpeg,.png,.zip';

export function WorkRequestDivisionAssignment({ state, divisionNames }: { state: ReadState<WorkRequestAssignment[]>; divisionNames: Map<string, string> }) {
  const assignment = state.data?.find((item) => item.level === 'DIVISION' && !item.unassignedAt && !item.replacedAt);
  return <section className="work-request-side-card">
    <header><Users size={17} /><h2>Current Division assignment</h2></header>
    {state.loading ? <div className="work-request-side-card__empty">Loading assignment...</div> : state.error ? <ReadError message="Division assignment could not be loaded." retry={state.retry} /> : assignment ? <div className="work-request-read-content">
      <strong>{(assignment.divisionId && divisionNames.get(assignment.divisionId)) || assignment.divisionId || 'Division unavailable'}</strong>
      <span>Responsible Division Lead{(assignment.responsibleRecipients?.length ?? 0) === 1 ? '' : 's'}: {(assignment.responsibleRecipients ?? []).map((lead) => lead.displayName || lead.label).join(', ') || 'None returned'}</span>
    </div> : <div className="work-request-side-card__empty">No current Division assignment.</div>}
  </section>;
}

export function WorkRequestInformationReads({ currentActorProfileId, documents, history, onClose, onReplySuccess, recipients, workRequestId }: {
  currentActorProfileId?: string | null;
  documents: ApiRecord[];
  history: ReadState<WorkRequestInfoRequest[]>;
  onClose: () => void;
  onReplySuccess: () => Promise<void>;
  recipients: ReadState<WorkRequestInfoRequestRecipient[]>;
  workRequestId: string;
}) {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const lastContentKey = useRef<string | null>(null);
  const initialPersonSelected = useRef(false);
  const participantPickerRef = useRef<HTMLDetailsElement>(null);
  const names = new Map((recipients.data ?? []).map((recipient) => [recipient.actorId, recipientPresentation(recipient).displayName]));
  const recipientByActorId = new Map((recipients.data ?? []).map((recipient) => [recipient.actorId, recipient]));
  const actor = (person: WorkRequestInfoActor, fallback: string) => {
    if (person.actorId === currentActorProfileId) return 'You';
    const backendName = recipientPresentation(person).displayName;
    return names.get(person.actorId) ?? (backendName !== 'Recipient' ? backendName : person.email?.trim() || fallback);
  };
  // Each API record is an independent Request Info thread. The record ID is the
  // only grouping key; recipients and message text are presentation-only.
  const threads = (history.data ?? []).map((request) => ({ infoRequestId: request.id, request })).sort((left, right) => dateValue(left.request.requestedAt) - dateValue(right.request.requestedAt));
  const people = (() => {
    const peopleById = new Map<string, WorkRequestInfoActor>();
    threads.forEach(({ request }) => {
      if (!currentActorProfileId || (request.requester.actorId !== currentActorProfileId && request.target.actorId !== currentActorProfileId)) return;
      [request.requester, request.target].forEach((person) => {
        if (person.actorId !== currentActorProfileId) peopleById.set(person.actorId, person);
      });
    });
    (recipients.data ?? []).forEach((recipient) => {
      if (recipient.actorId !== currentActorProfileId && !peopleById.has(recipient.actorId)) peopleById.set(recipient.actorId, recipient);
    });
    return [...peopleById.values()].map((person) => {
      const presentation = recipientPresentation(recipientByActorId.get(person.actorId) ?? person);
      const historyPresentation = recipientPresentation(person);
      const division = visibleName(presentation.division ?? historyPresentation.division);
      const designation = visibleName(presentation.designation ?? historyPresentation.designation);
      const teams = [...new Set([...presentation.teams, ...historyPresentation.teams].map(visibleName).filter(Boolean))];
      return { actorId: person.actorId, division, designation, teams, label: visibleName(actor(person, 'User')) || 'User' };
    }).sort((left, right) => left.label.localeCompare(right.label));
  })();
  const selectedThreads = selectedPersonId
    ? threads.filter(({ request }) => (request.requester.actorId === currentActorProfileId && request.target.actorId === selectedPersonId) || (request.target.actorId === currentActorProfileId && request.requester.actorId === selectedPersonId))
    : [];
  const messages = selectedThreads.flatMap(({ request }) => [
    { kind: 'request' as const, time: request.requestedAt, request },
    ...(request.responses ?? []).map((response) => ({ kind: 'response' as const, time: response.respondedAt, response })),
  ]).sort((left, right) => dateValue(left.time) - dateValue(right.time));
  const selectedPerson = people.find((person) => person.actorId === selectedPersonId) ?? null;
  const replyableRequest = selectedThreads.find(({ request }) => request.id === replyTargetId && request.status === 'OPEN' && request.target.actorId === currentActorProfileId)?.request ?? [...selectedThreads].reverse().find(({ request }) => request.status === 'OPEN' && request.target.actorId === currentActorProfileId)?.request ?? null;
  const eligibleRecipient = currentActorProfileId && !recipients.error ? (recipients.data ?? []).find((recipient) => recipient.actorId === selectedPersonId) ?? null : null;
  const contentKey = selectedPersonId ? `${selectedPersonId}|${selectedThreads.map(({ request }) => `${request.id}:${request.requestedAt}:${request.responses?.map((response) => `${response.id}:${response.respondedAt}`).join(',') ?? ''}`).join('|')}` : '';

  useEffect(() => {
    if (initialPersonSelected.current || !currentActorProfileId || history.loading) return;
    initialPersonSelected.current = true;
    const recent = threads.filter(({ request }) => request.requester.actorId === currentActorProfileId || request.target.actorId === currentActorProfileId).sort((a, b) => latestActivity(b.request) - latestActivity(a.request))[0]?.request;
    if (!selectedPersonId && recent) setSelectedPersonId(recent.requester.actorId === currentActorProfileId ? recent.target.actorId : recent.requester.actorId);
  }, [currentActorProfileId, history.loading, selectedPersonId, threads]);

  useEffect(() => {
    if (!selectedPersonId || !contentKey || lastContentKey.current === contentKey) return;
    lastContentKey.current = contentKey;
    messageAreaRef.current?.scrollTo({ top: messageAreaRef.current.scrollHeight, behavior: 'smooth' });
  }, [contentKey, selectedPersonId]);

  useEffect(() => {
    if (selectedPersonId && !people.some((person) => person.actorId === selectedPersonId)) setSelectedPersonId('');
  }, [people, selectedPersonId]);

  useEffect(() => setReplyTargetId(null), [selectedPersonId]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => { if (participantPickerRef.current?.open && event.target instanceof Node && !participantPickerRef.current.contains(event.target)) participantPickerRef.current.open = false; };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && participantPickerRef.current?.open) { participantPickerRef.current.open = false; participantPickerRef.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, []);

  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="request-info-title" aria-modal="true" className="division-modal work-request-info-modal" role="dialog">
    <header className="work-request-info-modal__header"><h2 id="request-info-title">Request Information</h2><div className="work-request-info-card__actions"><details className="work-request-participant-picker" ref={participantPickerRef}><summary aria-label="Select person">{selectedPerson?.label ?? 'Select person'}</summary><div className="work-request-participant-picker__menu">{people.length ? people.map((person) => <button aria-pressed={person.actorId === selectedPersonId} key={person.actorId} onClick={() => { setSelectedPersonId(person.actorId); if (participantPickerRef.current) participantPickerRef.current.open = false; }} type="button"><strong>{person.label}</strong>{person.division || person.teams.length ? <span>{[person.division, ...person.teams].filter(Boolean).join(' · ')}</span> : null}{person.designation ? <span>{person.designation}</span> : null}</button>) : <span className="work-request-participant-picker__empty">{history.loading || recipients.loading ? 'Loading people…' : 'No people available'}</span>}</div></details><button aria-label="Close information request dialog" className="work-request-info-card__toggle" onClick={onClose} type="button"><X size={16} /></button></div></header>
    <div className="work-request-info-card__content">
      {recipients.error ? <ReadError message="Eligible recipients could not be loaded." retry={recipients.retry} /> : null}
      <div className="work-request-read-content work-request-chat">
        {history.loading ? <span>Loading history...</span> : !selectedPersonId ? <div className="work-request-side-card__empty">Select a person to view information requests.</div> : <>{selectedPerson ? <div className="work-request-chat-person"><strong>{selectedPerson.label}</strong>{selectedPerson.division ? <span className="work-request-chat-person__division">{selectedPerson.division}</span> : null}{selectedPerson.teams.length || selectedPerson.designation ? <span>{[...selectedPerson.teams, selectedPerson.designation].filter(Boolean).join(' · ')}</span> : null}</div> : null}<div className="work-request-chat__messages" ref={messageAreaRef}>{messages.length ? messages.map((entry) => {
          if (entry.kind === 'request') {
            const item = entry.request;
            const sentByCurrentActor = item.requester.actorId === currentActorProfileId;
            const counterpart = sentByCurrentActor ? actor(item.target, 'Recipient') : actor(item.requester, 'Requester');
            const canReply = item.status === 'OPEN' && item.target.actorId === currentActorProfileId;
            return <article className={`work-request-chat-message ${sentByCurrentActor ? 'work-request-chat-message--outgoing' : 'work-request-chat-message--incoming'}`} key={`request-${item.id}`}>
              <div className="work-request-chat-message__header">{!sentByCurrentActor ? <span className="work-request-chat-message__sender">{counterpart}</span> : null}<span className="work-request-chat-message__meta">{formatDateTime(item.requestedAt)}</span></div>{item.message?.trim() ? <span className="work-request-chat-message__body">{item.message}</span> : null}
              <InfoRequestAttachments attachments={item.attachments} documents={documents} />
              {canReply ? <button className="work-request-action" onClick={() => { setReplyTargetId(item.id); window.document.getElementById('work-request-info-composer')?.focus(); }} type="button">Reply</button> : null}
            </article>;
          }
          const response = entry.response;
          const sentByCurrentActor = response.responder.actorId === currentActorProfileId;
          return <article className={`work-request-chat-message ${sentByCurrentActor ? 'work-request-chat-message--outgoing' : 'work-request-chat-message--incoming'}`} key={`response-${response.id}`}><div className="work-request-chat-message__header">{!sentByCurrentActor ? <span className="work-request-chat-message__sender">{actor(response.responder, 'Responder')}</span> : null}<span className="work-request-chat-message__meta">{formatDateTime(response.respondedAt)}</span></div>{response.message?.trim() ? <span className="work-request-chat-message__body">{response.message}</span> : null}<InfoRequestAttachments attachments={response.attachments} documents={documents} /></article>;
        }) : null}</div></>}<InfoRequestComposer key={selectedPersonId} eligibleRecipient={eligibleRecipient} onSuccess={onReplySuccess} replyableRequest={replyableRequest} selectedPersonId={selectedPersonId} workRequestId={workRequestId} />
      </div>
    </div>
  </section></div>;
}

function dateValue(value: string) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function visibleName(value: string | null | undefined) {
  const name = value?.trim() ?? '';
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name) ? '' : name;
}

function latestActivity(request: WorkRequestInfoRequest) {
  return Math.max(dateValue(request.requestedAt), ...(request.responses ?? []).map((response) => dateValue(response.respondedAt)));
}

function InfoRequestAttachments({ attachments, documents }: { attachments?: WorkRequestInfoAttachment[]; documents: ApiRecord[] }) {
  if (!attachments?.length) return null;
  return <div className="work-request-chat-attachments">{attachments.map((attachment) => <InfoRequestAttachment attachment={attachment} document={documents.find((item) => documentVersionId(item) === attachment.documentVersionId)} key={attachment.documentVersionId} />)}</div>;
}

function InfoRequestAttachment({ attachment, document }: { attachment: WorkRequestInfoAttachment; document?: ApiRecord }) {
  const versionId = attachment.documentVersionId;
  const label = document ? documentLabel(document) : attachment.originalFileName?.trim() || attachment.fileName?.trim() || 'Attachment';
  const mimeType = documentMimeType(document) ?? attachment.mimeType ?? null;
  const size = attachmentSize(attachment, document);
  const canPreview = previewSupported(label, mimeType);
  const preview = useMutation({ mutationFn: () => previewDocumentVersion(versionId), onSuccess: (response) => openPreview(response.blob), onError: () => toast.error('Unable to preview this attachment. You can still download it.') });
  const download = useMutation({ mutationFn: () => downloadDocumentVersion(versionId), onSuccess: (response) => triggerDownload(response.blob, response.filename ?? label), onError: () => toast.error('Unable to download this attachment. Please try again.') });
  return <div className="work-request-chat-attachment"><div><strong>{label}</strong><span>{[mimeType, size].filter(Boolean).join(' · ') || 'Attachment'}</span></div><div><button disabled={preview.isPending} onClick={() => canPreview ? preview.mutate() : toast.info('Preview is unavailable for this file type. Download it to open locally.')} type="button"><Eye size={13} />{preview.isPending ? 'Opening…' : 'View'}</button><button disabled={download.isPending} onClick={() => download.mutate()} type="button"><Download size={13} />{download.isPending ? 'Downloading…' : 'Download'}</button></div></div>;
}

function attachmentSize(attachment: WorkRequestInfoAttachment, document?: ApiRecord) {
  const source = document ? document.size ?? (document.latestVersion as ApiRecord | undefined)?.size : attachment.size;
  const bytes = typeof source === 'number' ? source : typeof source === 'string' ? Number(source) : NaN;
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function previewSupported(label: string, mimeType: string | null) {
  const extension = label.split('.').pop()?.toLowerCase();
  return mimeType === 'application/pdf' || mimeType?.startsWith('image/') || ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'].includes(extension ?? '');
}

function openPreview(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const windowRef = window.open(url, '_blank', 'noopener,noreferrer');
  if (!windowRef) toast.info('Preview was blocked by the browser. Please allow pop-ups or download the file.');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function InfoRequestComposer({ eligibleRecipient, onSuccess, replyableRequest, selectedPersonId, workRequestId }: { eligibleRecipient: WorkRequestInfoRequestRecipient | null; onSuccess: () => Promise<void>; replyableRequest: WorkRequestInfoRequest | null; selectedPersonId: string; workRequestId: string }) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codesQuery = useQuery({ queryKey: ['work-request', workRequestId, 'available-document-codes'], queryFn: () => getWorkRequestAvailableDocumentCodes(workRequestId), enabled: Boolean(selectedPersonId) });
  const codes = codesQuery.data ?? [];
  const canSend = Boolean(replyableRequest || eligibleRecipient);
  const mutation = useMutation({
    mutationFn: async () => {
      const uploads = attachments.length ? await uploadWorkRequestDocuments(workRequestId, attachments, createRequestId()) : null;
      const documentVersionIds = uploads ? extractUploadedVersionIds(uploads.data) : [];
      if (attachments.length && documentVersionIds.length !== attachments.length) throw new Error('One or more attachments did not return a document version ID.');
      return replyableRequest
        ? respondToWorkRequestInfo(workRequestId, replyableRequest.id, message.trim(), documentVersionIds)
        : createWorkRequestInfoRequest(workRequestId, eligibleRecipient!.actorId, message.trim(), documentVersionIds);
    },
    onSuccess: () => { setMessage(''); setAttachments([]); void onSuccess(); toast.success(replyableRequest ? 'Information request reply sent.' : 'Information request sent.'); },
    onError: (reason) => toast.error(readableApiError(reason, 'Unable to send the information request.')),
  });
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).filter((file) => file.size <= MAX_FILE_BYTES).slice(0, Math.max(0, MAX_DOCUMENTS - attachments.length));
    if (next.length !== files.length) toast.error(`Attachments must be no larger than ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB; maximum ${MAX_DOCUMENTS} files.`);
    setAttachments((items) => [...items, ...next.map((file) => ({ ...createPendingAttachment(file), description: '', shipmentNumber: '' }))]);
  };
  const updateCode = (id: string, documentCodeId: string) => setAttachments((items) => items.map((item) => item.id === id ? { ...item, documentCodeId } : item));
  const valid = Boolean(message.trim() || attachments.length);
  const submit = () => {
    if (!valid || !canSend || mutation.isPending) return;
    if (attachments.length && (codesQuery.isLoading || codesQuery.isError || attachments.some((attachment) => !attachment.documentCodeId || !attachment.file))) {
      toast.error('Select an available document code for each attachment before sending.');
      return;
    }
    mutation.mutate();
  };
  return <form className="work-request-chat-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}><div className="work-request-chat-composer__chips">{attachments.map((attachment) => <div className="work-request-chat-composer__chip" key={attachment.id}><span title={attachment.file.name}>{attachment.file.name} · {formatFileSize(attachment.file.size)}</span><select aria-label={`Document code for ${attachment.file.name}`} disabled={mutation.isPending || codesQuery.isLoading} onChange={(event) => updateCode(attachment.id, event.target.value)} value={attachment.documentCodeId}><option value="">Document code</option>{codes.map((code) => <option key={code.id} value={code.id}>{code.name} — {code.code}</option>)}</select><button aria-label={`Remove ${attachment.file.name}`} disabled={mutation.isPending} onClick={() => setAttachments((items) => items.filter((item) => item.id !== attachment.id))} type="button"><X size={13} /></button></div>)}</div><div className="work-request-chat-composer__bar"><input accept={fileAccept} hidden multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} ref={fileInputRef} type="file" /><button aria-label="Attach files" className="work-request-chat-composer__attach" disabled={!canSend || mutation.isPending || codesQuery.isLoading || codesQuery.isError} onClick={() => fileInputRef.current?.click()} type="button"><Paperclip size={17} /></button><textarea aria-label="Information request message" disabled={!canSend || mutation.isPending} id="work-request-info-composer" onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder={canSend ? 'Type a message...' : 'No message action is currently available.'} rows={1} value={message} /><button aria-label="Send message" className="work-request-chat-composer__send" disabled={!valid || mutation.isPending} type="submit"><Send size={16} />{mutation.isPending ? 'Sending' : 'Send'}</button></div></form>;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractUploadedVersionIds(uploads: WorkRequestDocumentUploadResponse[]) {
  return uploads.flatMap((upload) => {
    const id = documentVersionId(upload);
    return id ? [id] : [];
  });
}

function ReadError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="work-request-side-card__empty" role="status">{message} <button type="button" onClick={retry}>Retry</button></div>;
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AttachmentUpload } from '@/components/ui/AttachmentUpload';
import { WorkspaceLoadingState } from '@/components/ui/LoadingState';
import { createPendingAttachment, type PendingAttachment } from '@/components/ui/attachmentDraft';
import { WorkRequestActionBar } from '@/features/workRequests/WorkRequestActionBar';
import { WorkRequestAuditTrail } from '@/features/workRequests/WorkRequestAuditTrail';
import { documentId, recordList } from '@/features/workRequests/documentData';
import { WorkRequestDocumentPreview } from '@/features/workRequests/WorkRequestDocumentPreview';
import { WorkRequestHeader } from '@/features/workRequests/WorkRequestHeader';
import { WorkRequestDivisionAssignment, WorkRequestInformationReads } from '@/features/workRequests/WorkRequestReadSections';
import { InfoRecipientList } from '@/features/workRequests/InfoRecipientList';
import { isCurrentRequester } from '@/features/workRequests/recipientPresentation';
import { readStoredUser } from '@/services/authSession';
import { WorkRequestRevisionRegistry } from '@/features/workRequests/WorkRequestRevisionRegistry';
import { WorkRequestWorkflowTracker } from '@/features/workRequests/WorkRequestWorkflowTracker';
import { toWorkRequestWorkflowViewModel } from '@/features/workRequests/workflowViewModel';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getDivisions } from '@/services/divisionService';
import { ApiClientError } from '@/services/apiClient';
import { readableApiError } from '@/services/roleService';
import { assignWorkRequestDivision, createWorkRequestInfoRequest, getWorkRequest, getWorkRequestAssignments, getWorkRequestAvailableActions, getWorkRequestAvailableDocumentCodes, getWorkRequestDocumentVersions, getWorkRequestDocuments, getWorkRequestEvents, getWorkRequestInfoRequestRecipients, getWorkRequestInfoRecipientStatus, getWorkRequestInfoRequests, getWorkRequestInternalHistory, getWorkRequestRoute, uploadWorkRequestDocuments, type WorkRequestDocumentUploadResponse } from '@/services/workRequestService';
import { createRequestId } from '@/utils/requestId';
import '@/features/workRequests/workRequestDetails.css';

export function WorkRequestDetailsPage() {
  usePageTitle('Work Request Details');
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const enabled = Boolean(id);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState<PendingAttachment[]>([]);
  const [specialAction, setSpecialAction] = useState<'assign-division' | 'request-info' | 'modify-route' | null>(null);
  const detailQuery = useQuery({ queryKey: ['work-request', id], queryFn: () => getWorkRequest(id!), enabled });
  const routeQuery = useQuery({ queryKey: ['work-request', id, 'route'], queryFn: () => getWorkRequestRoute(id!), enabled });
  const internalHistoryQuery = useQuery({ queryKey: ['work-request', id, 'internal-history'], queryFn: () => getWorkRequestInternalHistory(id!), enabled });
  const divisionsQuery = useQuery({ queryKey: ['divisions'], queryFn: getDivisions, enabled });
  // Workflow availability is determined only by the backend for a Work Request
  // the active actor can open; no role or scope is reconstructed in the UI.
  const actionsQuery = useQuery({ queryKey: ['work-request', id, 'available-actions', detailQuery.data?.updatedAt ?? null], queryFn: () => getWorkRequestAvailableActions(id!), enabled: detailQuery.isSuccess });
  const documentsQuery = useQuery({ queryKey: ['work-request', id, 'documents'], queryFn: () => getWorkRequestDocuments(id!), enabled });
  const documentCodesQuery = useQuery({ queryKey: ['work-request', id, 'available-document-codes'], queryFn: () => getWorkRequestAvailableDocumentCodes(id!), enabled: uploadOpen && enabled });
  const eventsQuery = useQuery({ queryKey: ['work-request', id, 'events', 1, 20], queryFn: () => getWorkRequestEvents(id!, 1, 20), enabled });
  const assignmentsQuery = useQuery({ queryKey: ['work-request', id, 'assignments'], queryFn: () => getWorkRequestAssignments(id!), enabled });
  const infoRequestsQuery = useQuery({ queryKey: ['work-request', id, 'info-requests'], queryFn: () => getWorkRequestInfoRequests(id!), enabled });
  const infoRecipientsQuery = useQuery({ queryKey: ['work-request', id, 'info-requests', 'recipients'], queryFn: () => getWorkRequestInfoRequestRecipients(id!), enabled });
  const infoRecipientStatusQuery = useQuery({ queryKey: ['work-request', id, 'info-requests', 'recipients', 'status'], queryFn: () => getWorkRequestInfoRecipientStatus(id!), enabled });
  const documents = recordList(documentsQuery.data, ['items', 'documents']);
  const documentCodes = (documentCodesQuery.data ?? []).map((code) => ({ id: code.id, code: code.code, name: code.name, family: '' }));
  const documentCodesLoading = documentCodesQuery.isLoading;
  const documentCodesError = documentCodesQuery.isError;
  const uploadMutation = useMutation({
    mutationFn: () => uploadWorkRequestDocuments(id!, pendingDocuments, createRequestId()),
    onSuccess: async (response) => {
      toast.success(response.message);
      setUploadOpen(false);
      setPendingDocuments([]);
      await queryClient.invalidateQueries({ queryKey: ['work-request', id, 'documents'] });
    },
    onError: async (error) => {
      toast.error(readableApiError(error, 'Unable to upload Work Request documents.'));
      await documentCodesQuery.refetch();
    },
  });

  useEffect(() => {
    if (!documents.some((document) => documentId(document) === selectedDocumentId)) setSelectedDocumentId(documents[0] ? documentId(documents[0]) : null);
  }, [documents, selectedDocumentId]);

  const versionsQuery = useQuery({ queryKey: ['work-request', id, 'documents', selectedDocumentId, 'versions'], queryFn: () => getWorkRequestDocumentVersions(id!, selectedDocumentId!), enabled: enabled && Boolean(selectedDocumentId) });
  const workflow = useMemo(() => detailQuery.data ? toWorkRequestWorkflowViewModel(detailQuery.data, routeQuery.data) : null, [detailQuery.data, routeQuery.data]);
  const divisionNames = useMemo(() => new Map((divisionsQuery.data?.items ?? []).map((division) => [division.id, division.name])), [divisionsQuery.data]);

  if (!id) return <PageError title="Work Request not found" copy="The requested Work Request identifier is missing." onRetry={() => undefined} />;
  if (detailQuery.isLoading) return <WorkspaceLoadingState entity="Work Request" />;
  if (detailQuery.isError || !detailQuery.data) return <PageError title="Unable to load Work Request" copy="This Work Request may not exist or is no longer available." onRetry={() => void detailQuery.refetch()} />;

  const availableActions = actionsQuery.data ?? [];
  const versions = recordList(versionsQuery.data, ['items', 'versions']);
  const events = eventsQuery.data?.items ?? [];
  const currentDivision = workflow?.currentRouteOccurrence?.divisionId ? divisionNames.get(workflow.currentRouteOccurrence.divisionId) ?? null : null;
  const divisionAssignment = assignmentsQuery.data?.find((assignment) => assignment.level === 'DIVISION' && !assignment.unassignedAt && !assignment.replacedAt);
  const assignedLead = divisionAssignment?.responsibleRecipients?.map((lead) => lead.displayName || lead.label).join(', ');
  const currentHandler = [currentDivision, assignedLead].filter(Boolean).join(' - ') || null;
  const internalHistoryEvents = internalHistoryQuery.data?.events ?? [];
  const routeError = routeQuery.isError
    ? `Lifecycle request failed${routeQuery.error instanceof ApiClientError ? ` (HTTP ${routeQuery.error.status})` : ''}: ${readableApiError(routeQuery.error, 'The Work Request lifecycle could not be loaded.')}`
    : null;
  const refreshWorkflow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['work-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'route'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'internal-history'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'available-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'documents'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'events'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'info-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'info-requests', 'recipients'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'communication-recipients'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'assignments'] }),
      detailQuery.refetch(), routeQuery.refetch(), internalHistoryQuery.refetch(), actionsQuery.refetch(), documentsQuery.refetch(), versionsQuery.refetch(), eventsQuery.refetch(), assignmentsQuery.refetch(), infoRequestsQuery.refetch(),
    ]);
    await queryClient.prefetchQuery({ queryKey: ['work-request', id, 'info-requests', 'recipients'], queryFn: () => getWorkRequestInfoRequestRecipients(id) });
  };
  const assignDivisionAction = availableActions.find((action) => action.code === 'WR_ASSIGN_DIVISION') ?? null;
  const requestInfoAction = availableActions.find((action) => action.code === 'REQUEST_WORKFLOW_INFO') ?? null;
  const standardActions = availableActions
    .filter((action) => action.code !== 'WR_ASSIGN_DIVISION' && action.code !== 'REQUEST_WORKFLOW_INFO' && action.code !== 'AMEND_ROUTE');
  const actionArea = actionsQuery.isError
    ? <WorkRequestActionsUnavailable onRetry={() => void actionsQuery.refetch()} />
    : actionsQuery.isLoading
      ? <WorkRequestActionsLoading />
      : <><WorkRequestActionBar actions={standardActions} assignments={assignmentsQuery.data} documents={documents} onActionSuccess={refreshWorkflow} route={routeQuery.data} workRequestId={id} /><div className="work-request-header__actions">{assignDivisionAction ? <button onClick={() => setSpecialAction('assign-division')} type="button">Assign Division</button> : null}{requestInfoAction ? <button onClick={() => setSpecialAction('request-info')} type="button">Request Information</button> : null}{availableActions.some((action) => action.code === 'AMEND_ROUTE') ? <button onClick={() => setSpecialAction('modify-route')} type="button">Modify future route</button> : null}</div></>;

  const submitDocuments = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingDocuments.length) return void toast.error('Add at least one document.');
    if (pendingDocuments.some((document) => !document.documentCodeId || !document.file)) return void toast.error('Every document needs both a Document Code and a file.');
    if (pendingDocuments.some((document) => (document.description?.length ?? 0) > 10000)) return void toast.error('Description must be 10,000 characters or fewer.');
    if (pendingDocuments.some((document) => (document.shipmentNumber?.length ?? 0) > 10)) return void toast.error('Ship. No must be 10 characters or fewer.');
    uploadMutation.mutate();
  };

  return <><div className="page-stack work-request-page">
    <WorkRequestHeader actionArea={actionArea} currentHandler={currentHandler} workRequest={detailQuery.data} />
    <WorkRequestWorkflowTracker divisionNames={divisionNames} error={routeError} loading={routeQuery.isLoading} nodes={workflow?.mainRouteNodes ?? []} />
    <div className="work-request-page__grid">
      <div className="work-request-page__main"><WorkRequestDocumentPreview documents={documents} error={documentsQuery.isError} onAdd={() => setUploadOpen(true)} onDocumentChange={setSelectedDocumentId} selectedDocumentId={selectedDocumentId} versions={versions} versionsLoading={versionsQuery.isLoading} workRequestId={id} /></div>
      <aside className="work-request-page__aside"><WorkRequestDivisionAssignment divisionNames={divisionNames} state={{ data: assignmentsQuery.data, loading: assignmentsQuery.isLoading, error: assignmentsQuery.isError, retry: () => { void assignmentsQuery.refetch(); } }} /><WorkRequestInformationReads history={{ data: infoRequestsQuery.data, loading: infoRequestsQuery.isLoading, error: infoRequestsQuery.isError, retry: () => { void infoRequestsQuery.refetch(); } }} recipients={{ data: infoRecipientsQuery.data, loading: infoRecipientsQuery.isLoading, error: infoRecipientsQuery.isError, retry: () => { void infoRecipientsQuery.refetch(); } }} status={{ data: infoRecipientStatusQuery.data, loading: infoRecipientStatusQuery.isLoading, error: infoRecipientStatusQuery.isError, retry: () => { void infoRecipientStatusQuery.refetch(); } }} /><WorkRequestRevisionRegistry error={internalHistoryQuery.isError} events={internalHistoryEvents} loading={internalHistoryQuery.isLoading} /><WorkRequestAuditTrail error={eventsQuery.isError} events={events} loading={eventsQuery.isLoading} /></aside>
    </div>
  </div>{uploadOpen ? <WorkRequestDocumentUploadModal attachments={pendingDocuments} codes={documentCodes} codesError={documentCodesError} codesLoading={documentCodesLoading} onChange={setPendingDocuments} onClose={() => { if (!uploadMutation.isPending) { setUploadOpen(false); setPendingDocuments([]); } }} onSubmit={submitDocuments} saving={uploadMutation.isPending} /> : null}{specialAction === 'assign-division' ? <AssignDivisionModal workRequestId={id} onClose={() => setSpecialAction(null)} onSuccess={async () => { await refreshWorkflow(); setSpecialAction(null); }} /> : null}{specialAction === 'modify-route' ? <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="modify-route-title" aria-modal="true" className="division-modal work-request-action-dialog" role="dialog"><div className="division-modal__head"><strong id="modify-route-title">Modify future route</strong><button aria-label="Close" onClick={() => setSpecialAction(null)} type="button">X</button></div><div className="division-form"><p>Future route editing is not yet available in this interface.</p><div className="division-form__actions"><button onClick={() => setSpecialAction(null)} type="button">Close</button></div></div></section></div> : null}{specialAction === 'request-info' ? <RequestInfoModal workRequestId={id} onClose={() => setSpecialAction(null)} onSuccess={async () => { await refreshWorkflow(); setSpecialAction(null); }} /> : null}</>;
}

const MAX_DOCUMENTS = 20;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const fileAccept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.dwg,.dxf,.jpg,.jpeg,.png,.zip';
type DocumentCodeOption = { id: string; code: string; name: string; family: string };

function WorkRequestDocumentUploadModal({ attachments, codes, codesError, codesLoading, onChange, onClose, onSubmit, saving }: { attachments: PendingAttachment[]; codes: DocumentCodeOption[]; codesError: boolean; codesLoading: boolean; onChange: (attachments: PendingAttachment[]) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saving: boolean }) {
  const update = (id: string, patch: Partial<PendingAttachment>) => onChange(attachments.map((attachment) => attachment.id === id ? { ...attachment, ...patch } : attachment));
  return <div className="division-modal-backdrop"><section aria-modal="true" className="division-modal division-modal--wide work-request-document-modal" role="dialog"><div className="division-modal__head"><div><strong>Add Documents</strong><span>Attach and classify supporting files.</span></div><button aria-label="Close" disabled={saving} onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div><form className="division-form" onSubmit={onSubmit}>{codesError ? <p>Document Codes are unavailable. Try again before adding documents.</p> : <AttachmentUpload accept={fileAccept} attachments={attachments} codes={codes} disabled={saving || codesLoading} maxFileBytes={MAX_FILE_BYTES} maxFiles={MAX_DOCUMENTS} metadataMode="document-metadata" onAdd={(files) => onChange([...attachments, ...files.map((file) => ({ ...createPendingAttachment(file), description: '', shipmentNumber: '' }))])} onDocumentCodeChange={(id, documentCodeId) => update(id, { documentCodeId })} onMetadataChange={(id, field, value) => update(id, { [field]: value })} onRemove={(id) => onChange(attachments.filter((attachment) => attachment.id !== id))} onValidationError={(message) => toast.error(message)} />}<div className="division-form__actions"><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={saving || codesLoading || codesError || !attachments.length} type="submit">{saving ? 'Uploading...' : 'Upload Documents'}</button></div></form></section></div>;
}

function AssignDivisionModal({ workRequestId, onClose, onSuccess }: { workRequestId: string; onClose: () => void; onSuccess: () => Promise<void> }) {
  const [divisionId, setDivisionId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const divisionsQuery = useQuery({ queryKey: ['divisions'], queryFn: getDivisions });
  const mutation = useMutation({
    mutationFn: () => assignWorkRequestDivision(workRequestId, { divisionId }, createRequestId()),
    onSuccess: async () => { toast.success('Division assigned successfully.'); await onSuccess(); },
    onError: (reason) => setError(workRequestActionError(reason, 'Unable to assign this Division.')),
  });
  const divisions = (divisionsQuery.data?.items ?? []).filter((division) => division.isActive);
  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="assign-division-title" aria-modal="true" className="division-modal work-request-action-dialog" role="dialog"><div className="division-modal__head"><div><strong id="assign-division-title">Assign Division</strong><span>The backend will resolve the Division’s active Lead.</span></div><button aria-label="Close assign Division dialog" disabled={mutation.isPending} onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={(event) => { event.preventDefault(); setError(null); mutation.mutate(); }}><label><span>Division</span><select disabled={divisionsQuery.isLoading || mutation.isPending} onChange={(event) => setDivisionId(event.target.value)} required value={divisionId}><option value="">{divisionsQuery.isLoading ? 'Loading Divisions...' : 'Select a Division'}</option>{divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}</select></label>{divisionsQuery.isError ? <p className="role-form-error">Unable to load eligible Divisions.</p> : null}{error ? <p className="role-form-error" role="alert">{error}</p> : null}<div className="division-form__actions"><button disabled={mutation.isPending} onClick={onClose} type="button">Cancel</button><button disabled={!divisionId || divisionsQuery.isLoading || mutation.isPending} type="submit">{mutation.isPending ? 'Assigning...' : 'Assign Division'}</button></div></form></section></div>;
}

function RequestInfoModal({ workRequestId, onClose, onSuccess }: { workRequestId: string; onClose: () => void; onSuccess: () => Promise<void> }) {
  const [recipientId, setRecipientId] = useState('');
  const currentActorId = readStoredUser()?.activeActorProfileId;
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const recipientsQuery = useQuery({ queryKey: ['work-request', workRequestId, 'info-requests', 'recipients'], queryFn: () => getWorkRequestInfoRequestRecipients(workRequestId) });
  const recipientStatusQuery = useQuery({ queryKey: ['work-request', workRequestId, 'info-requests', 'recipients', 'status'], queryFn: () => getWorkRequestInfoRecipientStatus(workRequestId) });
  const codesQuery = useQuery({ queryKey: ['work-request', workRequestId, 'available-document-codes'], queryFn: () => getWorkRequestAvailableDocumentCodes(workRequestId) });
  const mutation = useMutation({
    mutationFn: async () => {
      const uploads = attachments.length ? await uploadWorkRequestDocuments(workRequestId, attachments, createRequestId()) : null;
      const documentVersionIds = uploads ? extractUploadedVersionIds(uploads.data) : [];
      if (attachments.length && documentVersionIds.length !== attachments.length) throw new Error('One or more attachments did not return a document version ID.');
      return createWorkRequestInfoRequest(workRequestId, recipientId, message.trim(), documentVersionIds);
    },
    onSuccess: async () => { toast.success('Information request sent.'); await onSuccess(); },
    onError: (reason) => toast.error(workRequestActionError(reason, 'Unable to send the information request.')),
  });
  const recipients = recipientsQuery.data ?? [];
  const codes = (codesQuery.data ?? []).map((code) => ({ id: code.id, code: code.code, name: code.name, family: '' }));
  const updateAttachment = (attachmentId: string, patch: Partial<PendingAttachment>) => setAttachments((items) => items.map((item) => item.id === attachmentId ? { ...item, ...patch } : item));
  const valid = !recipientsQuery.isError && Boolean(recipientId) && recipients.some((recipient) => recipient.actorId === recipientId && !isCurrentRequester(recipient, currentActorId)) && Boolean(message.trim()) && attachments.every((attachment) => attachment.documentCodeId && attachment.file);
  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="request-info-title" aria-modal="true" className="division-modal division-modal--wide work-request-action-dialog work-request-info-dialog" role="dialog"><div className="division-modal__head"><div><strong id="request-info-title">Request Information</strong><span>Select backend-provided recipients and send a message.</span></div><button aria-label="Close information request dialog" disabled={mutation.isPending} onClick={onClose} type="button">X</button></div><form className="division-form" onSubmit={(event) => { event.preventDefault(); if (valid) mutation.mutate(); }}><InfoRecipientList currentActorId={currentActorId} disabled={mutation.isPending} error={recipientsQuery.isError ? readableApiError(recipientsQuery.error, 'Unable to load eligible recipients.') : null} loading={recipientsQuery.isLoading} onSelect={setRecipientId} recipients={recipients} selectedId={recipientId} unavailableContacts={recipientStatusQuery.data?.unavailableContacts ?? []} /><label><span>Message</span><textarea disabled={mutation.isPending} maxLength={10000} onChange={(event) => setMessage(event.target.value)} required rows={4} value={message} /></label><AttachmentUpload accept={fileAccept} attachments={attachments} codes={codes} disabled={mutation.isPending || codesQuery.isLoading || codesQuery.isError} maxFileBytes={MAX_FILE_BYTES} maxFiles={MAX_DOCUMENTS} metadataMode="document-metadata" onAdd={(files) => setAttachments((items) => [...items, ...files.map((file) => ({ ...createPendingAttachment(file), description: '', shipmentNumber: '' }))])} onDocumentCodeChange={(attachmentId, documentCodeId) => updateAttachment(attachmentId, { documentCodeId })} onMetadataChange={(attachmentId, field, value) => updateAttachment(attachmentId, { [field]: value })} onRemove={(attachmentId) => setAttachments((items) => items.filter((item) => item.id !== attachmentId))} onValidationError={(text) => toast.error(text)} /><div className="division-form__actions"><button disabled={mutation.isPending} onClick={onClose} type="button">Cancel</button><button disabled={!valid || mutation.isPending || recipientsQuery.isLoading || (attachments.length > 0 && (codesQuery.isLoading || codesQuery.isError))} type="submit">{mutation.isPending ? 'Sending...' : 'Send Request'}</button></div></form></section></div>;
}

function workRequestActionError(error: unknown, fallback: string) {
  return error instanceof ApiClientError && error.status >= 400 && error.status < 500 ? readableApiError(error, fallback) : fallback;
}

function extractUploadedVersionIds(uploads: WorkRequestDocumentUploadResponse[]) {
  return uploads.flatMap((upload) => {
    const latestVersion = upload.latestVersion;
    if (latestVersion && typeof latestVersion === 'object') {
      const record = latestVersion as Record<string, unknown>;
      const id = record.id ?? record.documentVersionId;
      if (typeof id === 'string' && id) return [id];
    }
    return [];
  });
}

function PageError({ title, copy, onRetry }: { title: string; copy: string; onRetry: () => void }) {
  return <section className="work-request-error"><AlertCircle size={24} /><div><h1>{title}</h1><p>{copy}</p><button type="button" onClick={onRetry}>Try again</button></div></section>;
}

function WorkRequestActionsLoading() {
  return <div aria-label="Loading available actions" className="work-request-actions-status work-request-actions-status--loading"><span /><span /></div>;
}

function WorkRequestActionsUnavailable({ onRetry }: { onRetry: () => void }) {
  return <div className="work-request-actions-status work-request-actions-status--error"><span>Actions unavailable</span><button onClick={onRetry} type="button">Retry</button></div>;
}

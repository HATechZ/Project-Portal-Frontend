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
import { WorkRequestRevisionRegistry } from '@/features/workRequests/WorkRequestRevisionRegistry';
import { WorkRequestWorkflowTracker } from '@/features/workRequests/WorkRequestWorkflowTracker';
import { toWorkRequestWorkflowViewModel } from '@/features/workRequests/workflowViewModel';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getDivisions } from '@/services/divisionService';
import { getActiveEngineeringDocumentCodes } from '@/services/engineeringDocumentCodeService';
import { getActiveEtcDocumentCodes } from '@/services/etcDocumentCodeService';
import { getActiveGeneralDocumentCodes } from '@/services/generalDocumentCodeService';
import { getActiveMarketingDocumentCodes } from '@/services/marketingDocumentCodeService';
import { getActiveProjectManagementOperationDocumentCodes } from '@/services/projectManagementOperationDocumentCodeService';
import { ApiClientError } from '@/services/apiClient';
import { readableApiError } from '@/services/roleService';
import { getWorkRequest, getWorkRequestAvailableActions, getWorkRequestDocumentVersions, getWorkRequestDocuments, getWorkRequestEvents, getWorkRequestInternalHistory, getWorkRequestRoute, uploadWorkRequestDocuments } from '@/services/workRequestService';
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
  const detailQuery = useQuery({ queryKey: ['work-request', id], queryFn: () => getWorkRequest(id!), enabled });
  const routeQuery = useQuery({ queryKey: ['work-request', id, 'route'], queryFn: () => getWorkRequestRoute(id!), enabled });
  const internalHistoryQuery = useQuery({ queryKey: ['work-request', id, 'internal-history'], queryFn: () => getWorkRequestInternalHistory(id!), enabled });
  const divisionsQuery = useQuery({ queryKey: ['divisions'], queryFn: getDivisions, enabled });
  const actionsQuery = useQuery({ queryKey: ['work-request', id, 'available-actions'], queryFn: () => getWorkRequestAvailableActions(id!), enabled });
  const documentsQuery = useQuery({ queryKey: ['work-request', id, 'documents'], queryFn: () => getWorkRequestDocuments(id!), enabled });
  const generalCodesQuery = useQuery({ queryKey: ['general-document-codes', 'active'], queryFn: getActiveGeneralDocumentCodes, enabled: uploadOpen });
  const marketingCodesQuery = useQuery({ queryKey: ['marketing-document-codes', 'active'], queryFn: getActiveMarketingDocumentCodes, enabled: uploadOpen });
  const engineeringCodesQuery = useQuery({ queryKey: ['engineering-document-codes', 'active'], queryFn: getActiveEngineeringDocumentCodes, enabled: uploadOpen });
  const etcCodesQuery = useQuery({ queryKey: ['etc-document-codes', 'active'], queryFn: getActiveEtcDocumentCodes, enabled: uploadOpen });
  const pmoCodesQuery = useQuery({ queryKey: ['project-management-operation-document-codes', 'active'], queryFn: getActiveProjectManagementOperationDocumentCodes, enabled: uploadOpen });
  const eventsQuery = useQuery({ queryKey: ['work-request', id, 'events', 1, 20], queryFn: () => getWorkRequestEvents(id!, 1, 20), enabled });
  const documents = recordList(documentsQuery.data, ['items', 'documents']);
  const documentCodes = useMemo(() => normalizeDocumentCodes([
    ['General', generalCodesQuery.data ?? []], ['Marketing', marketingCodesQuery.data ?? []], ['Engineering', engineeringCodesQuery.data ?? []], ['ETC', etcCodesQuery.data ?? []], ['Project Management & Operations', pmoCodesQuery.data ?? []],
  ]), [generalCodesQuery.data, marketingCodesQuery.data, engineeringCodesQuery.data, etcCodesQuery.data, pmoCodesQuery.data]);
  const documentCodesLoading = generalCodesQuery.isLoading || marketingCodesQuery.isLoading || engineeringCodesQuery.isLoading || etcCodesQuery.isLoading || pmoCodesQuery.isLoading;
  const documentCodesError = generalCodesQuery.isError || marketingCodesQuery.isError || engineeringCodesQuery.isError || etcCodesQuery.isError || pmoCodesQuery.isError;
  const uploadMutation = useMutation({
    mutationFn: () => uploadWorkRequestDocuments(id!, pendingDocuments, createRequestId()),
    onSuccess: async (response) => {
      toast.success(response.message);
      setUploadOpen(false);
      setPendingDocuments([]);
      await queryClient.invalidateQueries({ queryKey: ['work-request', id, 'documents'] });
    },
    onError: (error) => toast.error(readableApiError(error, 'Unable to upload Work Request documents.')),
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

  const availableActions = Array.isArray(actionsQuery.data) ? actionsQuery.data : [];
  const versions = recordList(versionsQuery.data, ['items', 'versions']);
  const events = eventsQuery.data?.items ?? [];
  const currentHandler = workflow?.currentRouteOccurrence?.divisionId ? divisionNames.get(workflow.currentRouteOccurrence.divisionId) ?? null : null;
  const formalRevisionEvents = (internalHistoryQuery.data?.events ?? []).filter((event) => event.action === 'FORMAL_REVISION_TRIGGERED');
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
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'communication-recipients'] }),
      detailQuery.refetch(), routeQuery.refetch(), internalHistoryQuery.refetch(), actionsQuery.refetch(), documentsQuery.refetch(), versionsQuery.refetch(), eventsQuery.refetch(),
    ]);
  };
  const actionArea = actionsQuery.isError
    ? <WorkRequestActionsUnavailable onRetry={() => void actionsQuery.refetch()} />
    : actionsQuery.isLoading
      ? <WorkRequestActionsLoading />
      : <WorkRequestActionBar actions={availableActions} documents={documents} onActionSuccess={refreshWorkflow} route={routeQuery.data} workRequestId={id} />;

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
      <div className="work-request-page__main"><WorkRequestDocumentPreview documents={documents} error={documentsQuery.isError} onAdd={() => setUploadOpen(true)} onDocumentChange={setSelectedDocumentId} selectedDocumentId={selectedDocumentId} versions={versions} versionsLoading={versionsQuery.isLoading} /></div>
      <aside className="work-request-page__aside"><WorkRequestRevisionRegistry error={internalHistoryQuery.isError} events={formalRevisionEvents} loading={internalHistoryQuery.isLoading} /><WorkRequestAuditTrail error={eventsQuery.isError} events={events} loading={eventsQuery.isLoading} /></aside>
    </div>
  </div>{uploadOpen ? <WorkRequestDocumentUploadModal attachments={pendingDocuments} codes={documentCodes} codesError={documentCodesError} codesLoading={documentCodesLoading} onChange={setPendingDocuments} onClose={() => { if (!uploadMutation.isPending) { setUploadOpen(false); setPendingDocuments([]); } }} onSubmit={submitDocuments} saving={uploadMutation.isPending} /> : null}</>;
}

const MAX_DOCUMENTS = 20;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const fileAccept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.dwg,.dxf,.jpg,.jpeg,.png,.zip';
type DocumentCodeOption = { id: string; code: string; name: string; family: string };

function WorkRequestDocumentUploadModal({ attachments, codes, codesError, codesLoading, onChange, onClose, onSubmit, saving }: { attachments: PendingAttachment[]; codes: DocumentCodeOption[]; codesError: boolean; codesLoading: boolean; onChange: (attachments: PendingAttachment[]) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saving: boolean }) {
  const update = (id: string, patch: Partial<PendingAttachment>) => onChange(attachments.map((attachment) => attachment.id === id ? { ...attachment, ...patch } : attachment));
  return <div className="division-modal-backdrop"><section aria-modal="true" className="division-modal division-modal--wide work-request-document-modal" role="dialog"><div className="division-modal__head"><div><strong>Add Documents</strong><span>Attach and classify supporting files.</span></div><button aria-label="Close" disabled={saving} onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div><form className="division-form" onSubmit={onSubmit}>{codesError ? <p>Document Codes are unavailable. Try again before adding documents.</p> : <AttachmentUpload accept={fileAccept} attachments={attachments} codes={codes} disabled={saving || codesLoading} maxFileBytes={MAX_FILE_BYTES} maxFiles={MAX_DOCUMENTS} metadataMode="document-metadata" onAdd={(files) => onChange([...attachments, ...files.map((file) => ({ ...createPendingAttachment(file), description: '', shipmentNumber: '' }))])} onDocumentCodeChange={(id, documentCodeId) => update(id, { documentCodeId })} onMetadataChange={(id, field, value) => update(id, { [field]: value })} onRemove={(id) => onChange(attachments.filter((attachment) => attachment.id !== id))} onValidationError={(message) => toast.error(message)} />}<div className="division-form__actions"><button disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={saving || codesLoading || codesError || !attachments.length} type="submit">{saving ? 'Uploading...' : 'Upload Documents'}</button></div></form></section></div>;
}

function normalizeDocumentCodes(families: Array<[string, Array<{ id: string; code: string; name: string; isActive: boolean }>]>) {
  const result = new Map<string, DocumentCodeOption>();
  families.forEach(([family, items]) => items.filter((item) => item.isActive).forEach((item) => {
    if (!result.has(item.id)) result.set(item.id, { id: item.id, code: item.code, name: item.name, family });
  }));
  return [...result.values()].sort((left, right) => `${left.family}:${left.code}:${left.name}`.localeCompare(`${right.family}:${right.code}:${right.name}`));
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

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { WorkRequestActionBar } from '@/features/workRequests/WorkRequestActionBar';
import { WorkRequestAuditTrail } from '@/features/workRequests/WorkRequestAuditTrail';
import { documentId, recordList } from '@/features/workRequests/documentData';
import { WorkRequestDocumentPreview } from '@/features/workRequests/WorkRequestDocumentPreview';
import { WorkRequestHeader } from '@/features/workRequests/WorkRequestHeader';
import { WorkRequestRevisionRegistry } from '@/features/workRequests/WorkRequestRevisionRegistry';
import { WorkRequestRoutingSummary } from '@/features/workRequests/WorkRequestRoutingSummary';
import { WorkRequestWorkflowTracker } from '@/features/workRequests/WorkRequestWorkflowTracker';
import { getActiveAssignments } from '@/features/workRequests/workflowPresentation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getWorkRequest, getWorkRequestAssignments, getWorkRequestAvailableActions, getWorkRequestDocumentVersions, getWorkRequestDocuments, getWorkRequestEvents } from '@/services/workRequestService';
import '@/features/workRequests/workRequestDetails.css';

export function WorkRequestDetailsPage() {
  usePageTitle('Work Request Details');
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const enabled = Boolean(id);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const lastActionsDiagnostic = useRef<string | null>(null);
  const detailQuery = useQuery({ queryKey: ['work-request', id], queryFn: () => getWorkRequest(id!), enabled });
  const assignmentsQuery = useQuery({ queryKey: ['work-request', id, 'assignments'], queryFn: () => getWorkRequestAssignments(id!), enabled });
  const actionsQuery = useQuery({ queryKey: ['work-request', id, 'available-actions'], queryFn: () => getWorkRequestAvailableActions(id!), enabled });
  const documentsQuery = useQuery({ queryKey: ['work-request', id, 'documents'], queryFn: () => getWorkRequestDocuments(id!), enabled });
  const eventsQuery = useQuery({ queryKey: ['work-request', id, 'events', 1, 20], queryFn: () => getWorkRequestEvents(id!, 1, 20), enabled });
  const documents = recordList(documentsQuery.data, ['items', 'documents']);

  useEffect(() => {
    if (!documents.some((document) => documentId(document) === selectedDocumentId)) setSelectedDocumentId(documents[0] ? documentId(documents[0]) : null);
  }, [documents, selectedDocumentId]);

  const versionsQuery = useQuery({ queryKey: ['work-request', id, 'documents', selectedDocumentId, 'versions'], queryFn: () => getWorkRequestDocumentVersions(id!, selectedDocumentId!), enabled: enabled && Boolean(selectedDocumentId) });

  useEffect(() => {
    if (!import.meta.env.DEV || !id || actionsQuery.isPending) return;
    const diagnosticKey = `${actionsQuery.status}:${actionsQuery.dataUpdatedAt}:${actionsQuery.errorUpdatedAt}:${assignmentsQuery.status}:${assignmentsQuery.dataUpdatedAt}`;
    if (lastActionsDiagnostic.current === diagnosticKey) return;
    lastActionsDiagnostic.current = diagnosticKey;

    const availableActions = Array.isArray(actionsQuery.data) ? actionsQuery.data : [];
    const detailAvailableActions = Array.isArray(detailQuery.data?.availableActions) ? detailQuery.data.availableActions : [];
    const activeAssignments = getActiveAssignments(Array.isArray(assignmentsQuery.data) ? assignmentsQuery.data : []);
    console.info('[Work Request action debug]', {
      workRequestId: id,
      currentState: detailQuery.data?.currentState,
      activeAssignments: activeAssignments.map((assignment) => ({ level: assignment.level, divisionId: assignment.divisionId, teamId: assignment.teamId, memberId: assignment.memberId, assignee: assignment.assignee })),
      availableActions,
      availableActionsStatus: actionsQuery.status,
    });

    if (actionsQuery.isSuccess && detailQuery.data && JSON.stringify(availableActions) !== JSON.stringify(detailAvailableActions)) {
      console.warn('[Work Request available actions inconsistency]', { workRequestId: id, dedicatedAvailableActions: availableActions, detailAvailableActions });
    }
  }, [actionsQuery.data, actionsQuery.dataUpdatedAt, actionsQuery.errorUpdatedAt, actionsQuery.isPending, actionsQuery.isSuccess, actionsQuery.status, assignmentsQuery.data, assignmentsQuery.dataUpdatedAt, assignmentsQuery.status, detailQuery.data, id]);

  if (!id) return <PageError title="Work Request not found" copy="The requested Work Request identifier is missing." onRetry={() => undefined} />;
  if (detailQuery.isLoading) return <WorkRequestDetailsSkeleton />;
  if (detailQuery.isError || !detailQuery.data) return <PageError title="Unable to load Work Request" copy="This Work Request may not exist or is no longer available." onRetry={() => void detailQuery.refetch()} />;

  const assignments = Array.isArray(assignmentsQuery.data) ? assignmentsQuery.data : [];
  const availableActions = Array.isArray(actionsQuery.data) ? actionsQuery.data : [];
  const versions = recordList(versionsQuery.data, ['items', 'versions']);
  const events = eventsQuery.data?.items ?? [];
  const refreshWorkflow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['work-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'assignments'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'available-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['work-request', id, 'events'] }),
      detailQuery.refetch(), assignmentsQuery.refetch(), actionsQuery.refetch(), eventsQuery.refetch(),
    ]);
  };
  const actionArea = actionsQuery.isError
    ? <WorkRequestActionsUnavailable onRetry={() => void actionsQuery.refetch()} />
    : actionsQuery.isLoading
      ? <WorkRequestActionsLoading />
      : <WorkRequestActionBar actions={availableActions} assignments={assignments} onActionSuccess={refreshWorkflow} workRequestId={id} />;

  return <div className="page-stack work-request-page">
    <WorkRequestHeader actionArea={actionArea} workRequest={detailQuery.data} />
    <WorkRequestRoutingSummary assignments={assignments} />
    <WorkRequestWorkflowTracker currentState={detailQuery.data.currentState} assignments={assignments} />
    <div className="work-request-page__grid">
      <div className="work-request-page__main"><WorkRequestDocumentPreview documents={documents} onDocumentChange={setSelectedDocumentId} selectedDocumentId={selectedDocumentId} versions={versions} versionsLoading={versionsQuery.isLoading} /></div>
      <aside className="work-request-page__aside"><WorkRequestRevisionRegistry loading={versionsQuery.isLoading} versions={versions} /><WorkRequestAuditTrail events={events} loading={eventsQuery.isLoading} /></aside>
    </div>
  </div>;
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

function WorkRequestDetailsSkeleton() {
  return <div className="page-stack work-request-page" aria-label="Loading Work Request Details"><div className="work-request-skeleton work-request-skeleton--header" /><div className="work-request-skeleton work-request-skeleton--tracker" /><div className="work-request-page__grid"><div className="work-request-skeleton work-request-skeleton--main" /><div className="work-request-page__aside"><div className="work-request-skeleton work-request-skeleton--side" /><div className="work-request-skeleton work-request-skeleton--side" /></div></div></div>;
}

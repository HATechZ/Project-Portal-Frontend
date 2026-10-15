import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { WorkRequestAuditTrail } from '@/features/workRequests/WorkRequestAuditTrail';
import { documentId, recordList } from '@/features/workRequests/documentData';
import { WorkRequestDocumentPreview } from '@/features/workRequests/WorkRequestDocumentPreview';
import { WorkRequestHeader } from '@/features/workRequests/WorkRequestHeader';
import { WorkRequestRevisionRegistry } from '@/features/workRequests/WorkRequestRevisionRegistry';
import { WorkRequestWorkflowTracker } from '@/features/workRequests/WorkRequestWorkflowTracker';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getWorkRequest, getWorkRequestAssignments, getWorkRequestAvailableActions, getWorkRequestDocumentVersions, getWorkRequestDocuments, getWorkRequestEvents } from '@/services/workRequestService';
import '@/features/workRequests/workRequestDetails.css';

export function WorkRequestDetailsPage() {
  usePageTitle('Work Request Details');
  const { id } = useParams<{ id: string }>();
  const enabled = Boolean(id);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
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

  if (!id) return <PageError title="Work Request not found" copy="The requested Work Request identifier is missing." onRetry={() => undefined} />;
  if (detailQuery.isLoading) return <WorkRequestDetailsSkeleton />;
  if (detailQuery.isError || !detailQuery.data) return <PageError title="Unable to load Work Request" copy="This Work Request may not exist or is no longer available." onRetry={() => void detailQuery.refetch()} />;

  const assignments = Array.isArray(assignmentsQuery.data) ? assignmentsQuery.data : [];
  const availableActions = Array.isArray(actionsQuery.data) ? actionsQuery.data : [];
  const versions = recordList(versionsQuery.data, ['items', 'versions']);
  const events = eventsQuery.data?.items ?? [];
  return (
    <div className="page-stack work-request-page">
      <WorkRequestHeader availableActions={availableActions} workRequest={detailQuery.data} />
      <WorkRequestWorkflowTracker currentState={detailQuery.data.currentState} assignments={assignments} />
      <div className="work-request-page__grid">
        <div className="work-request-page__main">
          <WorkRequestDocumentPreview documents={documents} onDocumentChange={setSelectedDocumentId} selectedDocumentId={selectedDocumentId} versions={versions} versionsLoading={versionsQuery.isLoading} />
        </div>
        <aside className="work-request-page__aside">
          <WorkRequestRevisionRegistry loading={versionsQuery.isLoading} versions={versions} />
          <WorkRequestAuditTrail events={events} loading={eventsQuery.isLoading} />
        </aside>
      </div>
    </div>
  );
}

function PageError({ title, copy, onRetry }: { title: string; copy: string; onRetry: () => void }) {
  return <section className="work-request-error"><AlertCircle size={24} /><div><h1>{title}</h1><p>{copy}</p><button type="button" onClick={onRetry}>Try again</button></div></section>;
}

function WorkRequestDetailsSkeleton() {
  return <div className="page-stack work-request-page" aria-label="Loading Work Request Details"><div className="work-request-skeleton work-request-skeleton--header" /><div className="work-request-skeleton work-request-skeleton--tracker" /><div className="work-request-page__grid"><div className="work-request-skeleton work-request-skeleton--main" /><div className="work-request-page__aside"><div className="work-request-skeleton work-request-skeleton--side" /><div className="work-request-skeleton work-request-skeleton--side" /></div></div></div>;
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingState } from '@/components/ui/LoadingState';
import { getBids } from '@/services/bidService';
import { getProjects } from '@/services/projectService';
import { getWorkRequests } from '@/services/workRequestService';

type DocumentRow = { id: string; name: string; source: 'Bid' | 'Project' | 'Work Request'; parent: string; codeId?: string };

export function DocumentsPage() {
  usePageTitle('Documents');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<'all' | DocumentRow['source']>('all');
  const bidsQuery = useQuery({ queryKey: ['bids'], queryFn: getBids });
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const workRequestsQuery = useQuery({ queryKey: ['work-requests'], queryFn: getWorkRequests });
  const loading = bidsQuery.isLoading || projectsQuery.isLoading || workRequestsQuery.isLoading;
  const hasError = bidsQuery.isError || projectsQuery.isError || workRequestsQuery.isError;
  const documents = useMemo<DocumentRow[]>(() => [
    ...(bidsQuery.data?.items ?? []).flatMap((bid) => bid.documents.map((document) => ({ id: `bid-${document.id}`, name: document.originalFileName, source: 'Bid' as const, parent: bid.name, codeId: document.documentCodeId }))),
    ...(projectsQuery.data?.items ?? []).flatMap((project) => project.documents.map((document) => ({ id: `project-${document.id}`, name: document.originalFileName, source: 'Project' as const, parent: project.name, codeId: document.documentCodeId }))),
    ...(workRequestsQuery.data?.items ?? []).flatMap((request) => request.documents.map((document) => ({ id: `request-${document.id}`, name: document.originalFileName || document.name || 'Untitled document', source: 'Work Request' as const, parent: request.title, codeId: document.documentCodeId }))),
  ], [bidsQuery.data, projectsQuery.data, workRequestsQuery.data]);
  const visible = documents.filter((document) => (source === 'all' || document.source === source) && `${document.name} ${document.parent} ${document.source}`.toLowerCase().includes(search.trim().toLowerCase()));

  return <div className="page-stack resource-page"><section className="page-heading resource-page__heading"><div><p>Library</p><h1>Documents</h1><span>Find documents attached to bids, projects, and work requests.</span></div></section><section className="resource-page__toolbar" aria-label="Document filters"><label><span>Search documents</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search file name or related record" type="search" value={search} /></label><label><span>Source</span><select onChange={(event) => setSource(event.target.value as typeof source)} value={source}><option value="all">All sources</option><option value="Bid">Bids</option><option value="Project">Projects</option><option value="Work Request">Work requests</option></select></label></section><section className="dash-panel division-panel"><div className="dash-section-title"><strong>All Documents</strong><span>{loading ? 'Loading documents' : `${visible.length} document${visible.length === 1 ? '' : 's'}`}</span></div><div className="division-table"><div className="division-grid division-grid--head document-list-row"><span>Document</span><span>Source</span><span>Related record</span><span>Document code</span></div>{loading ? <LoadingState label="Loading documents" /> : null}{hasError ? <div className="division-empty">Some documents could not be loaded. Refresh the page and try again.</div> : null}{!loading && !hasError && !visible.length ? <div className="division-empty">No documents match the selected filters.</div> : null}{visible.map((document) => <div className="division-grid document-list-row" key={document.id}><span><strong>{document.name}</strong></span><span><em className="division-status division-status--active">{document.source}</em></span><span>{document.parent}</span><span>{document.codeId || 'Not assigned'}</span></div>)}</div></section></div>;
}

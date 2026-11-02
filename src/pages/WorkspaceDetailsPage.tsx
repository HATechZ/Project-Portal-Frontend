import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getBid, updateBid, type Bid } from '@/services/bidService';
import { getProject, type Project } from '@/services/projectService';
import { getWorkRequests, type WorkRequest } from '@/services/workRequestService';
import { formatDateTime } from '@/features/workRequests/workflowPresentation';
import { WorkspaceLoadingState } from '@/components/ui/LoadingState';
import { usePermissions } from '@/hooks/usePermissions';
import { readableApiError } from '@/services/roleService';

type WorkspaceKind = 'bid' | 'project';
type Workspace = Bid | Project;

export function WorkspaceDetailsPage({ kind }: { kind: WorkspaceKind }) {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [editingBid, setEditingBid] = useState(false);
  const [bidName, setBidName] = useState('');
  const label = kind === 'bid' ? 'Bid' : 'Project';
  usePageTitle(`${label} Details`);

  const workspaceQuery = useQuery({
    queryKey: [kind, id],
    queryFn: () => kind === 'bid' ? getBid(id!) : getProject(id!),
    enabled: Boolean(id) && can(kind === 'bid' ? 'VIEW_BID' : 'VIEW_PROJECT'),
  });
  const workRequestsQuery = useQuery({ queryKey: ['work-requests'], queryFn: getWorkRequests, enabled: Boolean(id) && can('VIEW_WORK_REQUEST') });
  const workspace = workspaceQuery.data as Workspace | undefined;
  const workRequests = (workRequestsQuery.data?.items ?? []).filter((request) => parentId(kind === 'bid' ? request.bidId : request.projectId) === id);

  const updateBidMutation = useMutation({
    mutationFn: (name: string) => updateBid(id!, { name }),
    onSuccess: async () => {
      toast.success('Bid updated successfully.');
      setEditingBid(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bid', id] }),
        queryClient.invalidateQueries({ queryKey: ['bids', id] }),
        queryClient.invalidateQueries({ queryKey: ['bids'] }),
      ]);
    },
    onError: (error) => toast.error(readableApiError(error, 'Unable to update the bid.')),
  });

  if (!id) return <WorkspaceNotFound label={label} />;

  return <div className="page-stack resource-page workspace-details-page">
    <section className="page-heading resource-page__heading workspace-details-page__heading">
      <div>
        <p>{kind === 'bid' ? 'Commercial workspace' : 'Project workspace'}</p>
        <h1>{workspaceQuery.isLoading ? `Loading ${label}…` : workspace?.name ?? `${label} not found`}</h1>
        <span>{kind === 'bid' ? 'Bid details, related documents, and associated Work Requests.' : 'Project details, related documents, and associated Work Requests.'}</span>
      </div>
      <Link className="workspace-details-page__back" to={kind === 'bid' ? '/bids' : '/projects'}>Back to {kind === 'bid' ? 'Bids' : 'Projects'}</Link>
    </section>

    {workspaceQuery.isLoading ? <WorkspaceLoadingState entity={label} /> : null}
    {workspaceQuery.isError ? <WorkspaceNotFound label={label} /> : null}
    {workspace && !workspaceQuery.isError ? <><WorkspaceSummary kind={kind} workspace={workspace} />
      {kind === 'bid' ? <BidActionArea bid={workspace as Bid} can={can} editing={editingBid} name={bidName} onEdit={() => { setBidName((workspace as Bid).name); setEditingBid(true); }} onCancel={() => setEditingBid(false)} onNameChange={setBidName} onSubmit={(event) => { event.preventDefault(); if (bidName.trim()) updateBidMutation.mutate(bidName.trim()); }} saving={updateBidMutation.isPending} /> : null}
      <section className="dash-panel division-panel workspace-details-page__requests">
        <div className="dash-section-title"><strong>Work Requests</strong><span>{workRequestsQuery.isLoading ? 'Loading Work Requests' : `${workRequests.length} associated Work Request${workRequests.length === 1 ? '' : 's'}`}</span></div>
        <div className="division-table">
          <div className="division-grid division-grid--head workspace-details-page__request-row"><span>Work Request</span><span>Priority</span><span>State</span><span>Created</span><span>Actions</span></div>
          {workRequestsQuery.isLoading ? <div className="division-empty">Loading associated Work Requests…</div> : null}
          {workRequestsQuery.isError ? <div className="division-empty">Unable to load associated Work Requests.</div> : null}
          {!workRequestsQuery.isLoading && !workRequestsQuery.isError && !workRequests.length ? <div className="division-empty">No Work Requests are associated with this {label.toLowerCase()}.</div> : null}
          {workRequests.map((request) => <div className="division-grid workspace-details-page__request-row" key={request.id}><span><strong>{request.title}</strong>{typeof request.notes === 'string' && request.notes ? <small>{request.notes}</small> : <small>WR-{request.id.slice(0, 8).toUpperCase()}</small>}</span><span>{request.priority}</span><span><em className="division-status division-status--active">{request.currentState || '—'}</em></span><span>{formatDateTime(request.createdAt)}</span><span className="division-actions"><Link className="dash-critical-action" to={`/work-requests/${request.id}`}>View</Link></span></div>)}
        </div>
      </section>
    </> : null}
  </div>;
}

function BidActionArea({ bid, can, editing, name, onEdit, onCancel, onNameChange, onSubmit, saving }: { bid: Bid; can: (permission: string) => boolean; editing: boolean; name: string; onEdit: () => void; onCancel: () => void; onNameChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saving: boolean }) {
  const actionable = isBidActionable(bid);
  const canEdit = can('UPDATE_BID') && actionable;
  const canCreateWorkRequest = can('CREATE_WORK_REQUEST') && actionable;
  if (!canEdit && !canCreateWorkRequest) return null;
  return <section className="dash-panel division-panel workspace-details-page__actions"><div className="dash-section-title"><strong>Bid Actions</strong><span>Actions available for the active profile and current Bid state.</span></div>{editing ? <form className="division-form" onSubmit={onSubmit}><label><span>Bid name</span><input autoFocus disabled={saving} onChange={(event) => onNameChange(event.target.value)} required value={name} /></label><div className="division-form__actions"><button disabled={saving} onClick={onCancel} type="button">Cancel</button><button disabled={saving || !name.trim()} type="submit">{saving ? 'Saving...' : 'Save Bid'}</button></div></form> : <div className="division-actions">{canEdit ? <button onClick={onEdit} type="button">Edit Bid</button> : null}{canCreateWorkRequest ? <Link className="dash-critical-action" to={`/work-requests?create=1&bidId=${encodeURIComponent(bid.id)}`}>Create Work Request</Link> : null}</div>}</section>;
}

function isBidActionable(bid: Bid) {
  return !['ARCHIVED', 'CANCELLED', 'CLOSED'].includes(bid.status.trim().toUpperCase());
}

function WorkspaceSummary({ kind, workspace }: { kind: WorkspaceKind; workspace: Workspace }) {
  const isBid = 'biddingNumber' in workspace;
  const clientName = isBid && workspace.client && typeof workspace.client === 'object' && typeof workspace.client.name === 'string' ? workspace.client.name : '—';
  const reference = isBid ? workspace.biddingNumber : workspace.projectCode ?? '—';
  return <section className="dash-panel workspace-details-page__summary">
    <div className="dash-section-title"><strong>{kind === 'bid' ? 'Bid Details' : 'Project Details'}</strong><span><em className="division-status division-status--active">{workspace.status || 'Unspecified'}</em></span></div>
    <dl>
      <div><dt>{kind === 'bid' ? 'Bidding Number' : 'Project Code'}</dt><dd>{reference || '—'}</dd></div>
      <div><dt>Client</dt><dd>{clientName}</dd></div>
      <div><dt>Shipment No.</dt><dd>{workspace.shipmentNumber || '—'}</dd></div>
      <div><dt>Documents</dt><dd>{workspace.fileCount} file{workspace.fileCount === 1 ? '' : 's'}</dd></div>
      <div><dt>Created</dt><dd>{formatDateTime(workspace.createdAt)}</dd></div>
      <div><dt>Last Updated</dt><dd>{formatDateTime(workspace.updatedAt)}</dd></div>
    </dl>
  </section>;
}

function WorkspaceNotFound({ label }: { label: string }) {
  return <section className="dash-panel workspace-details-page__empty"><strong>{label} unavailable</strong><span>This workspace may no longer exist or you may not have access to it.</span></section>;
}

function parentId(value: WorkRequest['bidId'] | WorkRequest['projectId']) {
  if (typeof value === 'string') return value;
  return value?.id && typeof value.id === 'string' ? value.id : null;
}

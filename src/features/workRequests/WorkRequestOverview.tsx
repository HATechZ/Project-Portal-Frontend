import type { WorkRequest } from '@/services/workRequestService';
import { formatDateTime, labelFromRecord, referenceValue } from './workflowPresentation';

export function WorkRequestOverview({ workRequest }: { workRequest: WorkRequest }) {
  const parentType = workRequest.projectId ? 'Project' : workRequest.bidId ? 'Bid' : 'Parent reference';
  const parentReference = referenceValue(workRequest.projectId ?? workRequest.bidId) || '—';
  return <section className="work-request-panel work-request-overview"><div className="work-request-panel__header"><div><h2>Work Request Overview</h2><p>Request details and context</p></div></div><dl>
    <div><dt>Reference</dt><dd>WR-{workRequest.id.slice(0, 8).toUpperCase()}</dd></div>
    <div><dt>{parentType}</dt><dd>{parentReference}</dd></div>
    <div><dt>Shipment number</dt><dd>{workRequest.shipmentNumber || '—'}</dd></div>
    <div><dt>Priority</dt><dd>{workRequest.priority}</dd></div>
    <div><dt>Created by</dt><dd>{labelFromRecord(workRequest.creator)}</dd></div>
    <div><dt>Created</dt><dd>{formatDateTime(workRequest.createdAt)}</dd></div>
    <div><dt>Last updated</dt><dd>{formatDateTime(workRequest.updatedAt)}</dd></div>
    <div className="work-request-overview__notes"><dt>Notes</dt><dd>{typeof workRequest.notes === 'string' && workRequest.notes.trim() ? workRequest.notes : 'No notes provided.'}</dd></div>
  </dl></section>;
}

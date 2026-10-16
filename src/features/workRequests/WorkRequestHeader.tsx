import { ArrowLeft, CalendarClock, PackageCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { WorkRequest } from '@/services/workRequestService';
import { formatDateTime, labelFromRecord, referenceValue, workflowStateLabel } from './workflowPresentation';

type WorkRequestHeaderProps = { workRequest: WorkRequest; actionArea?: ReactNode };

export function WorkRequestHeader({ workRequest, actionArea }: WorkRequestHeaderProps) {
  const parentType = workRequest.projectId ? 'Project' : workRequest.bidId ? 'Bid' : null;
  const parentReference = referenceValue(workRequest.projectId ?? workRequest.bidId);

  return (
    <header className="work-request-header">
      <div className="work-request-header__context">
        <Link className="work-request-back" to="/work-requests"><ArrowLeft size={16} /> Work Requests</Link>
        <span>WR-{workRequest.id.slice(0, 8).toUpperCase()}</span>
        {parentType && parentReference ? <span>{parentType} · {compactReference(parentReference)}</span> : null}
      </div>
      <div className="work-request-header__content">
        <div>
          <div className="work-request-header__eyebrow"><PackageCheck size={15} /> Work Request</div>
          <div className="work-request-header__title"><h1>{workRequest.title}</h1><span className="work-request-state-badge">{workflowStateLabel(workRequest.currentState)}</span></div>
          <div className="work-request-header__metadata">
            {parentType && parentReference ? <span>{parentType}: {compactReference(parentReference)}</span> : <span>No parent reference</span>}
            <span>Shipment: {workRequest.shipmentNumber || '—'}</span>
            <span>Priority: {workRequest.priority}</span>
            <span>Created by {labelFromRecord(workRequest.creator)}</span>
          </div>
        </div>
        <div className="work-request-header__state">
          {actionArea}
          <small><CalendarClock size={14} /> Updated {formatDateTime(workRequest.updatedAt)}</small>
        </div>
      </div>
    </header>
  );
}

function compactReference(value: string) {
  return value.length > 20 ? `${value.slice(0, 8)}…${value.slice(-5)}` : value;
}

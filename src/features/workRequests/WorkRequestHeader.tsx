import { ArrowLeft, CalendarClock, PackageCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { WorkRequest } from '@/services/workRequestService';
import { formatDateTime, labelFromRecord, referenceValue } from './workflowPresentation';

type WorkRequestHeaderProps = { workRequest: WorkRequest; actionArea?: ReactNode; currentHandler?: string | null };

export function WorkRequestHeader({ workRequest, actionArea, currentHandler }: WorkRequestHeaderProps) {
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
        <div className="work-request-header__main">
          <div className="work-request-header__eyebrow"><PackageCheck size={15} /> Work Request</div>
          <div className="work-request-header__title"><h1>{workRequest.title}</h1><span className="work-request-state-badge">{apiLabel(workRequest.currentState)}</span></div>
          <div className="work-request-header__metadata">
            {parentType && parentReference ? <span className="work-request-header__metadata-item"><b>{parentType}</b><strong>{compactReference(parentReference)}</strong></span> : <span className="work-request-header__metadata-item"><strong>No parent reference</strong></span>}
            <span className="work-request-header__metadata-item"><b>Shipment</b><strong>{workRequest.shipmentNumber || '—'}</strong></span>
            <span className="work-request-header__metadata-item"><b>Priority</b><strong>{workRequest.priority}</strong></span>
            <span className="work-request-header__metadata-item"><b>Created by</b><strong>{labelFromRecord(workRequest.creator)}</strong></span>
            {currentHandler ? <span className="work-request-header__metadata-item work-request-header__metadata-item--current"><b>Current</b><strong>{currentHandler}</strong></span> : null}
          </div>
        </div>
        <div className="work-request-header__state">
          <div className="work-request-header__action-area">{actionArea}</div>
          <small><CalendarClock size={14} />Updated <strong>{formatDateTime(workRequest.updatedAt)}</strong></small>
        </div>
      </div>
    </header>
  );
}

function compactReference(value: string) {
  return value.length > 20 ? `${value.slice(0, 8)}…${value.slice(-5)}` : value;
}

function apiLabel(value: string) {
  return value.split('_').filter(Boolean).map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`).join(' ');
}

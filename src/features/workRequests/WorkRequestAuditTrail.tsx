import { Activity } from 'lucide-react';
import type { WorkRequestEvent } from '@/services/workRequestService';
import { formatDateTime } from './workflowPresentation';

type Props = { events: WorkRequestEvent[]; loading: boolean; error?: boolean };

function apiLabel(value: string) {
  return value.split('_').filter(Boolean).map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`).join(' ');
}

export function WorkRequestAuditTrail({ events, loading, error }: Props) {
  return <section className="work-request-side-card">
    <header><Activity size={17} /><h2>Work Request Audit Trail</h2></header>
    {loading
      ? <div className="work-request-side-card__empty">Loading activity…</div>
      : error
        ? <div className="work-request-side-card__empty">Activity could not be loaded.</div>
        : events.length
          ? <div className="work-request-audit-list">{events.slice(0, 3).map((event) => <article key={event.id}><span className="work-request-audit-list__icon"><Activity size={13} /></span><div><strong>{event.performedBy?.label || 'System'}</strong><time>{formatDateTime(event.occurredAt)}</time><p>{apiLabel(event.action)}</p>{event.priorState ? <small>{apiLabel(event.priorState)} → {apiLabel(event.resultingState)}</small> : event.note ? <small>{event.note}</small> : null}</div></article>)}</div>
          : <div className="work-request-side-card__empty">No activity recorded yet.</div>}
  </section>;
}

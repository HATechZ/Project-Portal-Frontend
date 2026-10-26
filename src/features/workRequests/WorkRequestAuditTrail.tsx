import { Activity } from 'lucide-react';
import type { WorkRequestEvent } from '@/services/workRequestService';
import { formatDateTime, friendlyWorkflowAction, workflowStateLabel } from './workflowPresentation';

export function WorkRequestAuditTrail({ events, loading }: { events: WorkRequestEvent[]; loading: boolean }) {
  return <section className="work-request-side-card">
    <header><Activity size={17} /><h2>Work Request Audit Trail</h2></header>
    {loading ? <div className="work-request-side-card__empty">Loading activity…</div> : events.length ? <div className="work-request-audit-list">{events.slice(0, 3).map((event) => <article key={event.id}><span className="work-request-audit-list__icon"><Activity size={13} /></span><div><strong>{event.performedBy?.label || 'System'}</strong><time>{formatDateTime(event.occurredAt)}</time><p>{friendlyWorkflowAction(event.action)}</p>{event.priorState ? <small>{workflowStateLabel(event.priorState)} → {workflowStateLabel(event.resultingState)}</small> : event.note ? <small>{event.note}</small> : null}</div></article>)}</div> : <div className="work-request-side-card__empty">No workflow activity is available yet.</div>}
  </section>;
}

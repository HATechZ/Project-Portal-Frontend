import { History } from 'lucide-react';
import type { WorkRequestRouteEvent } from '@/services/workRequestService';
import { formatDateTime, friendlyWorkflowAction } from './workflowPresentation';

type Props = { events: WorkRequestRouteEvent[]; loading: boolean; error?: boolean };

export function WorkRequestRevisionRegistry({ events, loading, error }: Props) {
  return <section className="work-request-side-card">
    <header><History size={17} /><h2>Internal workflow history</h2></header>
    {loading
      ? <div className="work-request-side-card__empty">Loading revisions…</div>
      : error
        ? <div className="work-request-side-card__empty">Internal workflow history could not be loaded.</div>
        : events.length
          ? <div className="work-request-revision-list">{events.map((event) => <article key={event.id}><strong>{friendlyWorkflowAction(event.action)}</strong><span>{formatDateTime(event.occurredAt)}</span></article>)}</div>
          : <div className="work-request-side-card__empty">No internal workflow history yet.</div>}
  </section>;
}

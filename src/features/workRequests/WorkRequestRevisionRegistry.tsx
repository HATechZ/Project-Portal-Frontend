import { History } from 'lucide-react';
import type { WorkRequestRouteEvent } from '@/services/workRequestService';
import { formatDateTime } from './workflowPresentation';

type Props = { events: WorkRequestRouteEvent[]; loading: boolean; error?: boolean };

export function WorkRequestRevisionRegistry({ events, loading, error }: Props) {
  return <section className="work-request-side-card">
    <header><History size={17} /><h2>Revision Control Registry</h2></header>
    {loading
      ? <div className="work-request-side-card__empty">Loading revisions…</div>
      : error
        ? <div className="work-request-side-card__empty">Revision history could not be loaded.</div>
        : events.length
          ? <div className="work-request-revision-list">{events.slice(0, 3).map((event) => <article key={event.id}><strong>Formal revision triggered</strong><span>{formatDateTime(event.occurredAt)}</span><small>{event.action}</small></article>)}</div>
          : <div className="work-request-side-card__empty">No completed revision cycle yet.</div>}
  </section>;
}

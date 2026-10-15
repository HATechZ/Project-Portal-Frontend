import { History } from 'lucide-react';
import type { ApiRecord } from './documentData';
import { versionActor, versionLabel, versionTimestamp } from './documentData';
import { formatDateTime } from './workflowPresentation';

export function WorkRequestRevisionRegistry({ versions, loading }: { versions: ApiRecord[]; loading: boolean }) {
  return <section className="work-request-side-card">
    <header><History size={17} /><h2>Revision Control Registry</h2></header>
    {loading ? <div className="work-request-side-card__empty">Loading revisions…</div> : versions.length ? <div className="work-request-revision-list">{versions.slice(0, 3).map((version, index) => <article key={`${versionLabel(version) ?? 'version'}-${index}`}><strong>{versionLabel(version) || 'Available revision'}</strong><span>{versionTimestamp(version) ? formatDateTime(versionTimestamp(version)) : 'Date unavailable'}</span>{versionActor(version) ? <small>{versionActor(version)}</small> : null}</article>)}</div> : <div className="work-request-side-card__empty">No completed revision cycle yet.</div>}
  </section>;
}

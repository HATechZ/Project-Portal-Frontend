import { Check, Circle } from 'lucide-react';
import type { WorkflowRouteNode } from './workflowViewModel';

type Props = { nodes: WorkflowRouteNode[]; divisionNames: Map<string, string>; loading: boolean; error: string | null };

export function WorkRequestWorkflowTracker({ nodes, divisionNames, loading, error }: Props) {
  return <section className="work-request-panel work-request-tracker">
    <div className="work-request-panel__header"><div><h2>Current Lifecycle / Work Request Cycle</h2><p>Live route occurrences provided by the Work Request route projection.</p></div></div>
    {loading ? <div className="work-request-tracker__empty">Loading lifecycle…</div> : null}
    {error ? <div className="work-request-tracker__empty">{error}</div> : null}
    {!loading && !error && !nodes.length ? <div className="work-request-tracker__empty">No route occurrences are available.</div> : null}
    {!loading && !error && nodes.length ? <div className="work-request-tracker__steps">{nodes.map((node) => {
      const status = node.completedAt ? 'completed' : node.isCurrent ? 'current' : 'pending';
      return <article className={`work-request-step work-request-step--${status}`} key={node.id}><span aria-hidden="true" className="work-request-step__connector" /><span className="work-request-step__icon">{status === 'completed' ? <Check size={15} /> : <Circle fill="currentColor" size={10} />}</span><div><strong>{node.divisionId ? divisionNames.get(node.divisionId) ?? 'Division unavailable' : routeKindLabel(node.kind)}</strong><small>{routeKindLabel(node.kind)}</small></div></article>;
    })}</div> : null}
  </section>;
}

function routeKindLabel(kind: string) { return kind.split('_').map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`).join(' '); }

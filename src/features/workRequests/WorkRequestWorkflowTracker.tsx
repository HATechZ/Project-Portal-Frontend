import { Check, Circle } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { WorkflowRouteNode } from './workflowViewModel';

type Props = { nodes: WorkflowRouteNode[]; loading: boolean; error: string | null };

export function WorkRequestWorkflowTracker({ nodes, loading, error }: Props) {
  return <section className="work-request-panel work-request-tracker">
    <div className="work-request-panel__header"><div><h2>Current Lifecycle / Work Request Cycle</h2><p>Live route occurrences provided by the Work Request route projection.</p></div></div>
    {loading ? <div className="work-request-tracker__empty">Loading lifecycle…</div> : null}
    {error ? <div className="work-request-tracker__empty">{error}</div> : null}
    {!loading && !error && !nodes.length ? <div className="work-request-tracker__empty">No route occurrences are available.</div> : null}
    {!loading && !error && nodes.length ? <div className="work-request-tracker__steps" style={{ '--workflow-count': nodes.length } as CSSProperties}>{nodes.map((node, index) => {
      const status = getLifecycleStepState(node);
      const divisionName = node.divisionName?.trim() || null;
      const position = index === 0 ? ' origin' : index === nodes.length - 1 ? ' end' : '';
      return <article className={`work-request-step work-request-step--${status}${position}`} key={node.id}><span aria-hidden="true" className="work-request-step__connector" /><span className="work-request-step__icon">{status === 'completed' ? <Check size={15} /> : <Circle fill="currentColor" size={10} />}</span><div><strong>{divisionName ?? routeKindLabel(node.kind)}</strong><small>{index === 0 ? `Start · ${routeKindLabel(node.kind)}` : index === nodes.length - 1 ? `Final · ${routeKindLabel(node.kind)}` : routeKindLabel(node.kind)}</small></div></article>;
    })}</div> : null}
  </section>;
}

function getLifecycleStepState(node: WorkflowRouteNode) {
  return node.state;
}

function routeKindLabel(kind: string) { return kind.split('_').map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`).join(' '); }

import { Check, Circle } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { InternalWorkflowProjection } from '@/services/workRequestService';

type Step = InternalWorkflowProjection['steps'][number];

function label(step: Step) {
  return step.kind === 'team' ? step.teamName : step.divisionName;
}

function key(step: Step) {
  return step.kind === 'team' ? step.teamStepId : step.kind;
}

function statusLabel(step: Step) {
  return step.state === 'current' ? 'Current' : step.state === 'completed' ? 'Completed' : 'Upcoming';
}

export function WorkRequestInternalWorkflow({ workflow, vertical = false }: { workflow: InternalWorkflowProjection; vertical?: boolean }) {
  if (!workflow.steps.length) return null;
  if (vertical) return <section className="work-request-panel internal-workflow-timeline" aria-labelledby="internal-workflow-title">
    <div className="work-request-panel__header"><h2 id="internal-workflow-title">Internal Division Workflow</h2></div>
    <ol className="internal-workflow-timeline__steps">{workflow.steps.map((step) => <li className={`internal-workflow-timeline__step internal-workflow-timeline__step--${step.state}`} key={key(step)} aria-current={step.state === 'current' ? 'step' : undefined}>
      <span className="internal-workflow-timeline__icon" aria-hidden="true">{step.state === 'completed' ? <Check size={14} /> : <Circle size={9} fill="currentColor" />}</span>
      <div><strong>{label(step)}</strong><small>{statusLabel(step)}</small></div>
    </li>)}</ol>
  </section>;

  return <section className="work-request-panel work-request-tracker" aria-labelledby="internal-workflow-title">
    <div className="work-request-panel__header"><div><h2 id="internal-workflow-title">Internal Division Workflow</h2></div></div>
    <div className="work-request-tracker__steps" style={{ '--workflow-count': workflow.steps.length } as CSSProperties}>{workflow.steps.map((step, index) => {
      const position = index === 0 ? ' origin' : index === workflow.steps.length - 1 ? ' end' : '';
      return <article className={`work-request-step work-request-step--${step.state}${position}`} key={key(step)} aria-current={step.state === 'current' ? 'step' : undefined}><span aria-hidden="true" className="work-request-step__connector" /><span aria-hidden="true" className="work-request-step__icon">{step.state === 'completed' ? <Check size={15} /> : <Circle fill="currentColor" size={10} />}</span><div><strong>{label(step)}</strong><small>{statusLabel(step)}</small></div></article>;
    })}</div>
  </section>;
}

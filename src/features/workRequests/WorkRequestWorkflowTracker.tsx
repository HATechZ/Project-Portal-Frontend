import { Check, Circle } from 'lucide-react';
import type { WorkRequestAssignment } from '@/services/workRequestService';
import { INTERNAL_WORKFLOW_STEPS, assignmentForLevel, workflowStepStatus } from './workflowPresentation';

type WorkRequestWorkflowTrackerProps = {
  currentState: string;
  assignments: WorkRequestAssignment[];
};

export function WorkRequestWorkflowTracker({ currentState, assignments }: WorkRequestWorkflowTrackerProps) {
  const awaitingAssignment = currentState === 'CREATED';

  return (
    <section className="work-request-panel work-request-tracker">
      <div className="work-request-panel__header">
        <div><h2>Current Workflow / Work Request Cycle</h2><p>{awaitingAssignment ? 'Awaiting Assignment' : 'Current internal workflow position'}</p></div>
      </div>
      <div className="work-request-tracker__steps">
        {INTERNAL_WORKFLOW_STEPS.map((step, index) => {
          const status = workflowStepStatus(currentState, index);
          const assignment = step.assignmentLevel ? assignmentForLevel(assignments, step.assignmentLevel) : null;
          return (
            <article className={`work-request-step work-request-step--${status}`} key={step.state}>
              <span className="work-request-step__connector" aria-hidden="true" />
              <span className="work-request-step__icon">{status === 'completed' ? <Check size={15} /> : <Circle size={10} fill="currentColor" />}</span>
              <div><strong>{step.label}</strong>{step.assignmentLevel ? <small>{assignment?.assignee?.label || (status === 'current' ? 'Assignee pending' : 'Not assigned')}</small> : null}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

import { CircleUserRound } from 'lucide-react';
import type { WorkRequestAssignment } from '@/services/workRequestService';
import { assignmentForLevel, currentResponsibilityLevel, formatDateTime, workflowStateLabel } from './workflowPresentation';

type WorkRequestCurrentResponsibilityProps = {
  currentState: string;
  assignments: WorkRequestAssignment[];
};

export function WorkRequestCurrentResponsibility({ currentState, assignments }: WorkRequestCurrentResponsibilityProps) {
  if (currentState === 'CREATED') return <AsideState title="Awaiting workflow assignment" copy="A workflow owner has not been assigned yet." />;
  if (currentState === 'FINAL_RELEASE') return <AsideState title="Internal workflow completed" copy="This work request has reached final release." />;

  const level = currentResponsibilityLevel(currentState);
  const assignment = level ? assignmentForLevel(assignments, level) : undefined;
  return (
    <section className="work-request-panel work-request-responsibility">
      <div className="work-request-panel__header"><div><h2>Current Responsibility</h2><p>{workflowStateLabel(currentState)}</p></div><CircleUserRound size={19} /></div>
      {assignment ? <dl>
        <div><dt>Assignee</dt><dd>{assignment.assignee?.label || 'Unassigned'}</dd></div>
        <div><dt>Assigned</dt><dd>{formatDateTime(assignment.assignedAt)}</dd></div>
        <div><dt>Assigned by</dt><dd>{assignment.assignedBy?.label || '—'}</dd></div>
      </dl> : <p className="work-request-empty">No active assignment is available for this stage.</p>}
    </section>
  );
}

function AsideState({ title, copy }: { title: string; copy: string }) {
  return <section className="work-request-panel work-request-responsibility"><div className="work-request-panel__header"><div><h2>Current Responsibility</h2></div><CircleUserRound size={19} /></div><div className="work-request-completion"><strong>{title}</strong><p>{copy}</p></div></section>;
}

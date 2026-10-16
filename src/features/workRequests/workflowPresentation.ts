import type { WorkRequestAssignment } from '@/services/workRequestService';

export const INTERNAL_WORKFLOW_STEPS = [
  { state: 'MEMBER_ASSIGNED', label: 'Preparation', assignmentLevel: 'MEMBER' },
  { state: 'CHECKING_REVIEW', label: 'Checking Review', assignmentLevel: 'CHECKING' },
  { state: 'APPROVAL_REVIEW', label: 'Approval Review', assignmentLevel: 'APPROVAL' },
  { state: 'FINAL_REVIEW', label: 'Final Review', assignmentLevel: 'FINAL_REVIEW' },
  { state: 'FINAL_RELEASE', label: 'Final Release', assignmentLevel: undefined },
] as const;

export type InternalWorkflowState = 'CREATED' | 'DIVISION_ASSIGNED' | 'TEAM_ASSIGNED' | (typeof INTERNAL_WORKFLOW_STEPS)[number]['state'];
export type WorkflowStepStatus = 'pending' | 'current' | 'completed';

const stateLabels: Record<InternalWorkflowState, string> = {
  CREATED: 'Awaiting Assignment',
  DIVISION_ASSIGNED: 'Division Assigned',
  TEAM_ASSIGNED: 'Team Assigned',
  MEMBER_ASSIGNED: 'Preparation',
  CHECKING_REVIEW: 'Checking Review',
  APPROVAL_REVIEW: 'Approval Review',
  FINAL_REVIEW: 'Final Review',
  FINAL_RELEASE: 'Final Release',
};

export function workflowStateLabel(state: string | null | undefined) {
  return state && state in stateLabels ? stateLabels[state as InternalWorkflowState] : state || 'Unknown state';
}

export function workflowStepStatus(currentState: string, index: number): WorkflowStepStatus {
  if (currentState === 'CREATED') return 'pending';
  const currentIndex = INTERNAL_WORKFLOW_STEPS.findIndex((step) => step.state === currentState);
  if (currentIndex === -1) return 'pending';
  if (currentState === 'FINAL_RELEASE') return 'completed';
  if (index < currentIndex) return 'completed';
  return index === currentIndex ? 'current' : 'pending';
}

export function getActiveAssignments(assignments: WorkRequestAssignment[]) {
  return assignments.filter((assignment) => assignment.unassignedAt === null && assignment.replacedAt === null);
}

export function assignmentForLevel(assignments: WorkRequestAssignment[], level: string) {
  return getActiveAssignments(assignments).find((assignment) => assignment.level === level);
}

export function currentResponsibilityLevel(currentState: string) {
  return INTERNAL_WORKFLOW_STEPS.find((step) => step.state === currentState)?.assignmentLevel;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function labelFromRecord(value: Record<string, unknown> | null) {
  if (!value) return '—';
  const label = value.label ?? value.name ?? value.email;
  return typeof label === 'string' && label.trim() ? label : '—';
}

export function referenceValue(value: string | Record<string, unknown> | null) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  const reference = value.reference ?? value.code ?? value.id ?? value.name;
  return typeof reference === 'string' ? reference : null;
}

export function friendlyWorkflowAction(action: string) {
  const labels: Record<string, string> = {
    WORK_SUBMITTED: 'Submitted for Checking Review',
    WR_SUBMIT: 'Submitted for Checking Review',
    WR_CHECKING_APPROVE: 'Checking Review Approved',
    WR_APPROVAL_APPROVE: 'Approval Review Approved',
    WR_REQUEST_REVISION: 'Revision Requested',
    WR_FINAL_RELEASE: 'Final Release Completed',
  };
  return labels[action] || action.toLowerCase().split('_').filter(Boolean).map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(' ');
}

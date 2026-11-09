import type { WorkRequest, WorkRequestRouteHistory, WorkRequestRouteStep } from '@/services/workRequestService';

export type WorkflowRouteNode = {
  id: string;
  ordinal: number;
  kind: string;
  divisionId: string | null;
  divisionName: string | null;
  activatedAt: string | null;
  completedAt: string | null;
  isCurrent: boolean;
  state: 'completed' | 'current' | 'upcoming';
};

export type WorkRequestWorkflowViewModel = {
  workRequest: WorkRequest;
  mainRouteNodes: WorkflowRouteNode[];
  currentRouteOccurrence: WorkflowRouteNode | null;
};

export function toWorkRequestWorkflowViewModel(workRequest: WorkRequest, route: WorkRequestRouteHistory | undefined): WorkRequestWorkflowViewModel {
  const currentStepId = route?.projection?.routeStepId ?? null;
  const steps = (route?.steps ?? [])
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal);
  // The projection is authoritative when present. A status fallback is only used
  // for projections that have not yet supplied a route-step id.
  const projectedCurrentId = currentStepId ?? steps.find((step) => isCurrentStatus(step.status))?.id ?? null;
  const mainRouteNodes = steps.map((step) => toRouteNode(step, projectedCurrentId));

  return {
    workRequest,
    mainRouteNodes,
    currentRouteOccurrence: mainRouteNodes.find((step) => step.isCurrent) ?? null,
  };
}

function toRouteNode(step: WorkRequestRouteStep, currentStepId: string | null): WorkflowRouteNode {
  const completed = Boolean(step.completedAt) || isCompletedStatus(step.status);
  const isCurrent = !completed && step.id === currentStepId;
  return {
    id: step.id,
    ordinal: step.ordinal,
    kind: step.kind,
    divisionId: step.divisionId ?? step.division?.id ?? null,
    divisionName: step.divisionName?.trim() || step.division?.name?.trim() || null,
    activatedAt: step.activatedAt,
    completedAt: step.completedAt,
    isCurrent,
    state: completed ? 'completed' : isCurrent ? 'current' : 'upcoming',
  };
}

function isCompletedStatus(status: string | null | undefined) {
  return status?.toUpperCase() === 'COMPLETED';
}

function isCurrentStatus(status: string | null | undefined) {
  const normalized = status?.toUpperCase();
  return normalized === 'CURRENT' || normalized === 'ACTIVE';
}

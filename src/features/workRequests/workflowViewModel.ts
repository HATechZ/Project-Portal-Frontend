import type { WorkRequest, WorkRequestRouteHistory, WorkRequestRouteStep } from '@/services/workRequestService';

export type WorkflowRouteNode = {
  id: string;
  ordinal: number;
  kind: string;
  divisionId: string | null;
  activatedAt: string | null;
  completedAt: string | null;
  isCurrent: boolean;
};

export type WorkRequestWorkflowViewModel = {
  workRequest: WorkRequest;
  mainRouteNodes: WorkflowRouteNode[];
  currentRouteOccurrence: WorkflowRouteNode | null;
};

export function toWorkRequestWorkflowViewModel(workRequest: WorkRequest, route: WorkRequestRouteHistory | undefined): WorkRequestWorkflowViewModel {
  const currentStepId = route?.projection?.routeStepId ?? null;
  const mainRouteNodes = (route?.steps ?? [])
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((step) => toRouteNode(step, currentStepId));

  return {
    workRequest,
    mainRouteNodes,
    currentRouteOccurrence: mainRouteNodes.find((step) => step.isCurrent) ?? null,
  };
}

function toRouteNode(step: WorkRequestRouteStep, currentStepId: string | null): WorkflowRouteNode {
  return {
    id: step.id,
    ordinal: step.ordinal,
    kind: step.kind,
    divisionId: step.divisionId,
    activatedAt: step.activatedAt,
    completedAt: step.completedAt,
    isCurrent: step.id === currentStepId,
  };
}

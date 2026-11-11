import type { WorkRequestAssignment, WorkRequestRouteHistory } from '@/services/workRequestService';

export type WorkRequestWorkflowContext = {
  currentRouteOccurrenceId: string | null;
  currentDivisionCycleId: string | null;
  currentDivisionId: string | null;
  currentTeamStepId: string | null;
  currentMemberStepId: string | null;
  currentResponsibleActorProfileId: string | null;
  isRefreshing: boolean;
  hasResolvedContext: boolean;
  hasRouteError: boolean;
};

type Input = {
  route?: WorkRequestRouteHistory;
  assignments?: WorkRequestAssignment[];
  isRefreshing: boolean;
  routeStatus: 'pending' | 'error' | 'success';
};

/** Derives only server-owned, current workflow identifiers for action dialogs. */
export function getWorkRequestWorkflowContext({ route, assignments = [], isRefreshing, routeStatus }: Input): WorkRequestWorkflowContext {
  const projection = route?.projection;
  const currentRouteOccurrenceId = projection?.routeStepId ?? null;
  // A route can be returned before its history has been populated (or by an
  // older backend response without `steps`). Treat that as missing workflow
  // context instead of allowing the details page to crash.
  const routeSteps = Array.isArray(route?.steps) ? route.steps : [];
  const resolvedAssignments = Array.isArray(assignments) ? assignments : [];
  const currentStep = routeSteps.find((step) => step.id === currentRouteOccurrenceId) ?? null;
  const currentDivisionCycleId = projection?.divisionCycleId ?? null;
  const currentAssignment = resolvedAssignments.find((assignment) => assignment.level === 'DIVISION' && assignment.divisionId === currentStep?.divisionId && assignment.unassignedAt === null && assignment.replacedAt === null)
    ?? resolvedAssignments.find((assignment) => assignment.level === 'DIVISION' && assignment.unassignedAt === null && assignment.replacedAt === null);

  return {
    currentRouteOccurrenceId,
    currentDivisionCycleId,
    currentDivisionId: currentStep?.divisionId ?? null,
    currentTeamStepId: projection?.teamStepId ?? null,
    currentMemberStepId: projection?.memberStepId ?? null,
    currentResponsibleActorProfileId: currentAssignment?.responsibleRecipients?.[0]?.actorId ?? null,
    isRefreshing,
    // A completed route request without a projection is a missing-context result,
    // not a request that should keep action dialogs loading forever.
    hasResolvedContext: routeStatus !== 'pending',
    hasRouteError: routeStatus === 'error',
  };
}

export function workflowActionContextIssue(action: string, context: WorkRequestWorkflowContext) {
  const needsCycle = action === 'DEFINE_TEAM_SEQUENCE';
  const needsTeamStep = ['DEFINE_MEMBER_SEQUENCE', 'APPEND_MEMBER_STEP', 'COMPLETE_TEAM_STEP'].includes(action);
  const needsMemberStep = action === 'SUBMIT_MEMBER_STEP';
  const needsRouteStep = action === 'FORWARD_ROUTE';
  const missing = needsCycle ? !context.currentDivisionCycleId : needsTeamStep ? !context.currentTeamStepId : needsMemberStep ? !context.currentMemberStepId : needsRouteStep ? !context.currentRouteOccurrenceId : false;
  if (!missing) return null;
  if (context.isRefreshing || !context.hasResolvedContext) return 'Loading the latest workflow context…';
  return context.hasRouteError
    ? 'Unable to load the current workflow context. Close this dialog and try again.'
    : 'The backend did not provide the current workflow context required for this action.';
}

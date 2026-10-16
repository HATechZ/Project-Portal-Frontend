import {
  assignWorkRequestDivision,
  assignWorkRequestMember,
  assignWorkRequestTeam,
  createWorkRequest,
  getWorkRequestAvailableActions,
  type CreateWorkRequestPayload,
  type WorkRequest,
  type WorkflowActionCode,
} from '@/services/workRequestService';
import { createRequestId } from '@/utils/requestId';

export type InitialRoutingIntent = {
  divisionId?: string;
  teamId?: string;
  memberId?: string;
  note?: string;
};

export type CreateWorkRequestProgress = 'creating' | 'assigning-division' | 'assigning-team' | 'assigning-member' | 'finishing';
export type RoutingStopReason = 'not-permitted' | 'available-actions-unavailable' | 'assignment-failed';

export type CreateWorkRequestFlowResult = {
  workRequest: WorkRequest;
  divisionAssigned: boolean;
  teamAssigned: boolean;
  memberAssigned: boolean;
  stoppedAt?: 'division' | 'team' | 'member';
  stopReason?: RoutingStopReason;
  error?: unknown;
};

type FlowOptions = {
  payload: CreateWorkRequestPayload;
  routing: InitialRoutingIntent;
  onProgress?: (progress: CreateWorkRequestProgress) => void;
};

const actionIsAvailable = (actions: Awaited<ReturnType<typeof getWorkRequestAvailableActions>>, code: WorkflowActionCode) => actions.some((action) => action.code === code);
const requestedRouting = (routing: InitialRoutingIntent) => Boolean(routing.divisionId || routing.teamId || routing.memberId);

/**
 * Creates the resource once, then applies explicitly requested routing commands in order.
 * A returned result always represents the already-created resource; assignment failures are
 * intentionally returned rather than rethrowing so callers cannot accidentally create again.
 */
export async function createWorkRequestWithInitialRouting({ payload, routing, onProgress }: FlowOptions): Promise<CreateWorkRequestFlowResult> {
  onProgress?.('creating');
  const workRequest = await createWorkRequest(payload, createRequestId());
  const result: CreateWorkRequestFlowResult = { workRequest, divisionAssigned: false, teamAssigned: false, memberAssigned: false };

  if (!requestedRouting(routing)) return result;

  const getActions = async (step: 'division' | 'team' | 'member') => {
    try {
      return await getWorkRequestAvailableActions(workRequest.id);
    } catch (error) {
      result.stoppedAt = step;
      result.stopReason = 'available-actions-unavailable';
      result.error = error;
      return null;
    }
  };

  if (routing.divisionId) {
    const actions = await getActions('division');
    if (!actions) return result;
    if (!actionIsAvailable(actions, 'WR_ASSIGN_DIVISION')) return { ...result, stoppedAt: 'division', stopReason: 'not-permitted' };
    try {
      onProgress?.('assigning-division');
      await assignWorkRequestDivision(workRequest.id, { divisionId: routing.divisionId, ...(routing.note ? { note: routing.note } : {}) }, createRequestId());
      result.divisionAssigned = true;
    } catch (error) {
      return { ...result, stoppedAt: 'division', stopReason: 'assignment-failed', error };
    }
  }

  if (routing.teamId) {
    const actions = await getActions('team');
    if (!actions) return result;
    if (!actionIsAvailable(actions, 'WR_ASSIGN_TEAM')) return { ...result, stoppedAt: 'team', stopReason: 'not-permitted' };
    try {
      onProgress?.('assigning-team');
      await assignWorkRequestTeam(workRequest.id, { teamId: routing.teamId, ...(routing.note ? { note: routing.note } : {}) }, createRequestId());
      result.teamAssigned = true;
    } catch (error) {
      return { ...result, stoppedAt: 'team', stopReason: 'assignment-failed', error };
    }
  }

  if (routing.memberId) {
    const actions = await getActions('member');
    if (!actions) return result;
    if (!actionIsAvailable(actions, 'WR_ASSIGN_MEMBER')) return { ...result, stoppedAt: 'member', stopReason: 'not-permitted' };
    try {
      onProgress?.('assigning-member');
      await assignWorkRequestMember(workRequest.id, { memberId: routing.memberId, ...(routing.note ? { note: routing.note } : {}) }, createRequestId());
      result.memberAssigned = true;
    } catch (error) {
      return { ...result, stoppedAt: 'member', stopReason: 'assignment-failed', error };
    }
  }

  onProgress?.('finishing');
  return result;
}

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getDivisions } from '@/services/divisionService';
import { readableApiError } from '@/services/roleService';
import { getTeamMembers, getTeams } from '@/services/teamService';
import { applyWorkRequestWorkflowAction, assignWorkRequestDivision, assignWorkRequestMember, assignWorkRequestTeam, submitWorkRequest, type AvailableWorkflowAction, type WorkRequestAssignment, type WorkflowActionCode } from '@/services/workRequestService';
import { createRequestId } from '@/utils/requestId';
import { assignmentForLevel } from './workflowPresentation';

type DialogAction = Exclude<WorkflowActionCode, 'REQUEST_WORKFLOW_INFO' | 'RESPOND_WORKFLOW_INFO'>;
type Props = { workRequestId: string; actions: AvailableWorkflowAction[]; assignments: WorkRequestAssignment[]; onActionSuccess: () => Promise<unknown> };
const supported: DialogAction[] = ['WR_ASSIGN_DIVISION', 'WR_ASSIGN_TEAM', 'WR_ASSIGN_MEMBER', 'WR_SUBMIT', 'WR_CHECKING_APPROVE', 'WR_APPROVAL_APPROVE', 'WR_REQUEST_REVISION', 'WR_FINAL_RELEASE'];

export function WorkRequestActionBar({ workRequestId, actions, assignments, onActionSuccess }: Props) {
  const [action, setAction] = useState<DialogAction | null>(null);
  const [targetId, setTargetId] = useState('');
  const [note, setNote] = useState('');
  const visible = actions.filter((item) => supported.includes(item.code as DialogAction) || item.code === 'REQUEST_WORKFLOW_INFO');
  const divisionId = assignmentForLevel(assignments, 'DIVISION')?.divisionId ?? '';
  const teamId = assignmentForLevel(assignments, 'TEAM')?.teamId ?? '';
  const divisionsQuery = useQuery({ queryKey: ['divisions'], queryFn: getDivisions, enabled: action === 'WR_ASSIGN_DIVISION' });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: () => getTeams({ page: 1, limit: 100 }), enabled: action === 'WR_ASSIGN_TEAM' });
  const membersQuery = useQuery({ queryKey: ['teams', teamId, 'members'], queryFn: () => getTeamMembers(teamId), enabled: action === 'WR_ASSIGN_MEMBER' && Boolean(teamId) });
  const divisions = useMemo(() => (divisionsQuery.data?.items ?? []).filter((item) => item.isActive), [divisionsQuery.data]);
  const teams = useMemo(() => (teamsQuery.data?.items ?? []).filter((item) => item.isActive !== false && item.divisionId === divisionId), [teamsQuery.data, divisionId]);
  const members = useMemo(() => (membersQuery.data ?? []).filter((item) => item.isActive !== false), [membersQuery.data]);
  const close = () => { setAction(null); setTargetId(''); setNote(''); };
  const mutation = useMutation({
    mutationFn: async () => {
      if (!action) return;
      const payload = note.trim() ? { note: note.trim() } : {};
      if (action === 'WR_ASSIGN_DIVISION') return assignWorkRequestDivision(workRequestId, { divisionId: targetId, ...payload }, createRequestId());
      if (action === 'WR_ASSIGN_TEAM') return assignWorkRequestTeam(workRequestId, { teamId: targetId, ...payload }, createRequestId());
      if (action === 'WR_ASSIGN_MEMBER') return assignWorkRequestMember(workRequestId, { memberId: targetId, ...payload }, createRequestId());
      if (action === 'WR_SUBMIT') return submitWorkRequest(workRequestId, payload, createRequestId());
      return applyWorkRequestWorkflowAction(workRequestId, { actionCode: action, ...payload }, createRequestId());
    },
    onSuccess: async () => { await onActionSuccess(); toast.success(successMessage(action)); close(); },
    onError: async (error) => {
      await onActionSuccess();
      toast.error(readableApiError(error, 'Unable to complete this Work Request action.'));
    },
  });
  const requiresTarget = action === 'WR_ASSIGN_DIVISION' || action === 'WR_ASSIGN_TEAM' || action === 'WR_ASSIGN_MEMBER';
  const loading = action === 'WR_ASSIGN_DIVISION' ? divisionsQuery.isLoading : action === 'WR_ASSIGN_TEAM' ? teamsQuery.isLoading : membersQuery.isLoading;
  const failed = action === 'WR_ASSIGN_DIVISION' ? divisionsQuery.isError : action === 'WR_ASSIGN_TEAM' ? teamsQuery.isError : membersQuery.isError;
  const missingContext = action === 'WR_ASSIGN_TEAM' ? !divisionId : action === 'WR_ASSIGN_MEMBER' ? !teamId : false;
  const noOptions = action === 'WR_ASSIGN_DIVISION' ? !divisions.length : action === 'WR_ASSIGN_TEAM' ? !teams.length : action === 'WR_ASSIGN_MEMBER' ? !members.length : false;
  if (!visible.length) return null;
  return <><div className="work-request-header__actions">{visible.map((item) => item.code === 'REQUEST_WORKFLOW_INFO'
    ? <button className="work-request-action work-request-action--secondary" disabled key={item.code} title="Request Info will be available with the information-request workflow." type="button">{item.label}</button>
    : <button className={item.code === 'WR_REQUEST_REVISION' ? 'work-request-action work-request-action--warning' : 'work-request-action'} key={item.code} onClick={() => { setAction(item.code as DialogAction); setTargetId(''); setNote(''); }} type="button">{buttonLabel(item)}</button>)}</div>
    {action ? <div className="division-modal-backdrop"><section aria-modal="true" className="division-modal work-request-action-dialog" role="dialog"><div className="division-modal__head"><div><strong>{title(action)}</strong><span>{action === 'WR_REQUEST_REVISION' ? 'Return this Work Request to Preparation with an optional reason.' : 'This change is applied by the current Work Request workflow.'}</span></div><button aria-label="Close" disabled={mutation.isPending} onClick={close} type="button">X</button></div><form className="division-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!requiresTarget || targetId) mutation.mutate(); }}>{requiresTarget ? <label><span>{targetLabel(action)}</span><select disabled={mutation.isPending || loading || failed || missingContext || noOptions} onChange={(event) => setTargetId(event.target.value)} required value={targetId}><option value="">{placeholder(action, loading, failed, missingContext, noOptions)}</option>{action === 'WR_ASSIGN_DIVISION' ? divisions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : action === 'WR_ASSIGN_TEAM' ? teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : members.map((item) => <option key={item.id} value={item.id}>{item.name}{item.email ? ' — ' + item.email : ''}</option>)}</select></label> : null}<label><span>{action === 'WR_REQUEST_REVISION' ? 'Comments / Reason' : 'Note'} <em>Optional</em></span><textarea disabled={mutation.isPending} maxLength={10000} onChange={(event) => setNote(event.target.value)} rows={3} value={note} /></label><div className="division-form__actions"><button disabled={mutation.isPending} onClick={close} type="button">Cancel</button><button disabled={mutation.isPending || (requiresTarget && (!targetId || missingContext || loading || failed || noOptions))} type="submit">{mutation.isPending ? 'Saving...' : submitLabel(action)}</button></div></form></section></div> : null}</>;
}

function buttonLabel(action: AvailableWorkflowAction) { return action.code === 'WR_CHECKING_APPROVE' || action.code === 'WR_APPROVAL_APPROVE' ? 'Approve' : action.label; }
function title(action: DialogAction) { return ({ WR_ASSIGN_DIVISION: 'Assign Division', WR_ASSIGN_TEAM: 'Assign Team', WR_ASSIGN_MEMBER: 'Assign Preparation Member', WR_SUBMIT: 'Submit Work Request', WR_CHECKING_APPROVE: 'Checking Review Approve', WR_APPROVAL_APPROVE: 'Approval Review Approve', WR_REQUEST_REVISION: 'Request Revision', WR_FINAL_RELEASE: 'Final Release' })[action]; }
function submitLabel(action: DialogAction) { return action === 'WR_CHECKING_APPROVE' || action === 'WR_APPROVAL_APPROVE' ? 'Approve' : ({ WR_ASSIGN_DIVISION: 'Assign Division', WR_ASSIGN_TEAM: 'Assign Team', WR_ASSIGN_MEMBER: 'Assign Preparation Member', WR_SUBMIT: 'Submit', WR_REQUEST_REVISION: 'Request Revision', WR_FINAL_RELEASE: 'Final Release' })[action]; }
function targetLabel(action: DialogAction) { if (action === 'WR_ASSIGN_DIVISION') return 'Division'; if (action === 'WR_ASSIGN_TEAM') return 'Team'; return action === 'WR_ASSIGN_MEMBER' ? 'Preparation Member' : ''; }
function placeholder(action: DialogAction, loading: boolean, failed: boolean, missing: boolean, empty: boolean) { if (missing) return action === 'WR_ASSIGN_TEAM' ? 'No assigned Division is available' : 'No assigned Team is available'; if (loading) return 'Loading options...'; if (failed) return 'Unable to load options'; if (empty) return action === 'WR_ASSIGN_TEAM' ? 'No teams available for this Division' : action === 'WR_ASSIGN_MEMBER' ? 'No members available for this Team' : 'No divisions available'; return 'Select ' + targetLabel(action); }
function successMessage(action: DialogAction | null) { return action === 'WR_REQUEST_REVISION' ? 'Revision requested successfully.' : submitLabel(action ?? 'WR_SUBMIT') + ' completed successfully.'; }

import { CheckCircle2, Route, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDivision } from '@/services/divisionService';
import { getTeam } from '@/services/teamService';
import type { WorkRequestAssignment } from '@/services/workRequestService';
import { assignmentForLevel } from './workflowPresentation';

export function WorkRequestRoutingSummary({ assignments }: { assignments: WorkRequestAssignment[] }) {
  const divisionAssignment = assignmentForLevel(assignments, 'DIVISION');
  const teamAssignment = assignmentForLevel(assignments, 'TEAM');
  const memberAssignment = assignmentForLevel(assignments, 'MEMBER');
  const divisionId = divisionAssignment?.divisionId ?? '';
  const teamId = teamAssignment?.teamId ?? '';
  const divisionQuery = useQuery({ queryKey: ['division', divisionId], queryFn: () => getDivision(divisionId), enabled: Boolean(divisionId) });
  const teamQuery = useQuery({ queryKey: ['team', teamId], queryFn: () => getTeam(teamId), enabled: Boolean(teamId) });

  return <section className="work-request-routing-summary">
    <header><Route size={16} /><div><h2>Routing &amp; Assignment</h2><p>Initial routing and preparation ownership</p></div></header>
    <div className="work-request-routing-summary__items">
      <RoutingItem label="Division" value={assignmentLabel(divisionAssignment, divisionQuery.data?.name, divisionQuery.isLoading, 'Division')} />
      <RoutingItem label="Team" value={assignmentLabel(teamAssignment, teamQuery.data?.name, teamQuery.isLoading, 'Team')} />
      <RoutingItem label="Preparation Member" value={memberAssignment?.assignee?.label ?? 'Not assigned'} />
    </div>
  </section>;
}

function RoutingItem({ label, value }: { label: string; value: string }) {
  const assigned = value !== 'Not assigned' && value !== 'Loading assignment…' && !value.endsWith('name unavailable');
  return <article className={assigned ? 'is-assigned' : ''}><span>{label}</span><strong>{assigned ? <CheckCircle2 size={14} /> : <Users size={14} />}{value}</strong></article>;
}

function assignmentLabel(assignment: WorkRequestAssignment | undefined, resolvedName: string | undefined, loading: boolean, kind: 'Division' | 'Team') {
  if (!assignment) return 'Not assigned';
  if (assignment.assignee?.label) return assignment.assignee.label;
  if (resolvedName) return resolvedName;
  if (loading) return 'Loading assignment…';
  return `${kind} name unavailable`;
}

import { ExistingMemberSelector } from '@/components/member/ExistingMemberSelector';
import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getDivisionLead, getDivisions } from '@/services/divisionService';
import { getEligibleMembers, getMembers, getMembersPage, type EligibleMember, type Member } from '@/services/memberService';
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  getTeamMembers,
  getTeams,
  removeTeamMember,
  setTeamLead,
  updateTeam,
  type CreateTeamPayload,
  type Team,
} from '@/services/teamService';

const teamsQueryKey = ['teams'] as const;
const companyMembersQueryKey = ['members'] as const;
type ModalMode = 'create' | 'edit' | 'lead' | 'members' | null;

export function TeamPage({ embedded = false, createRequest = 0, modalOnly = false, filterText = '', divisionId, onClose, onCreateTeam, preselectedDivisionId, modalPresentation = false }: { embedded?: boolean; createRequest?: number; modalOnly?: boolean; filterText?: string; divisionId?: string; onClose?: () => void; onCreateTeam?: () => void; preselectedDivisionId?: string; modalPresentation?: boolean }) {
  usePageTitle(embedded ? 'Dashboard' : 'Teams');
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState<CreateTeamPayload>({ divisionId: '', name: '', leadMemberId: null });
  const [leadId, setLeadId] = useState('');
  const [memberId, setMemberId] = useState('');

  const teamsQuery = useQuery({ queryKey: teamsQueryKey, queryFn: () => getTeams({ page: 1, limit: 100 }) });
  const companyMembersQuery = useQuery({ queryKey: companyMembersQueryKey, queryFn: getMembers, enabled: modal === 'lead' || modal === 'members' });
  const divisionLeadQuery = useQuery({ queryKey: ['division-lead', selectedTeam?.divisionId], queryFn: () => getDivisionLead(selectedTeam!.divisionId!), enabled: modal === 'members' && Boolean(selectedTeam?.divisionId) });
  const divisionsQuery = useQuery({ queryKey: ['divisions'], queryFn: getDivisions, enabled: modal === 'create' });
  const teamMembersQuery = useQuery({ queryKey: ['teams', selectedTeam?.id, 'members'], queryFn: () => getTeamMembers(selectedTeam!.id), enabled: modal === 'members' && Boolean(selectedTeam) });
  const eligibleMembersQuery = useQuery({ queryKey: ['members', 'eligible', 'team', selectedTeam?.id], queryFn: () => getEligibleMembers({ teamId: selectedTeam!.id }), enabled: modal === 'members' && Boolean(selectedTeam), staleTime: 0, refetchOnMount: 'always' });
  const designationMembersQuery = useQuery({ queryKey: ['members', 'designation-list'], queryFn: async () => { const first = await getMembersPage({ page: 1, limit: 100 }); const pages = await Promise.all(Array.from({ length: Math.max(0, first.meta.totalPages - 1) }, (_, index) => getMembersPage({ page: index + 2, limit: 100 }))); return [first, ...pages].flatMap((page) => page.items); }, enabled: modal === 'members' });

  useEffect(() => {
    if (createRequest > 0) {
      setSelectedTeam(null);
      setTeamForm({ divisionId: preselectedDivisionId ?? divisionId ?? '', name: '', leadMemberId: null });
      setModal('create');
    }
  }, [createRequest, divisionId, preselectedDivisionId]);

  const closeModal = () => {
    setModal(null);
    setSelectedTeam(null);
    setTeamForm({ divisionId: '', name: '', leadMemberId: null });
    setLeadId('');
    setMemberId('');
  };

  const refreshTeams = () => queryClient.invalidateQueries({ queryKey: teamsQueryKey });
  const refreshTeamMembers = () => selectedTeam && queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam.id, 'members'] });

  const saveTeamMutation = useMutation({
    mutationFn: (payload: CreateTeamPayload) => selectedTeam && modal === 'edit'
      ? updateTeam(selectedTeam.id, { name: payload.name })
      : createTeam(payload),
    onSuccess: () => {
      toast.success(modal === 'edit' ? 'Team updated successfully.' : 'Team created successfully.');
      void refreshTeams();
      closeModal();
    },
    onError: () => toast.error('Unable to save the team. Please try again.'),
  });
  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => { toast.success('Team deleted successfully.'); void refreshTeams(); },
    onError: () => toast.error('Unable to delete the team.'),
  });
  const setLeadMutation = useMutation({
    mutationFn: (value: string) => setTeamLead(selectedTeam!.id, value),
    onSuccess: () => { toast.success('Team lead updated successfully.'); void refreshTeams(); void queryClient.invalidateQueries({ queryKey: ['members', 'eligible'] }); closeModal(); },
    onError: () => toast.error('Unable to update the team lead.'),
  });
  const addMemberMutation = useMutation({
    mutationFn: (value: string) => addTeamMember(selectedTeam!.id, value),
    onSuccess: () => { toast.success('Member added to the team.'); void refreshTeams(); void refreshTeamMembers(); void queryClient.invalidateQueries({ queryKey: ['members', 'eligible'] }); setMemberId(''); },
    onError: () => toast.error('Unable to add that member.'),
  });
  const removeMemberMutation = useMutation({
    mutationFn: (value: string) => removeTeamMember(selectedTeam!.id, value),
    onSuccess: () => { toast.success('Member removed from the team.'); void refreshTeams(); void refreshTeamMembers(); void queryClient.invalidateQueries({ queryKey: ['members', 'eligible'] }); },
    onError: () => toast.error('Unable to remove that member.'),
  });

  function openCreate(selectedDivisionId = divisionId ?? '') { setSelectedTeam(null); setTeamForm({ divisionId: selectedDivisionId, name: '', leadMemberId: null }); setModal('create'); }
  function openEdit(team: Team) { setSelectedTeam(team); setTeamForm({ divisionId: '', name: team.name, leadMemberId: null }); setModal('edit'); }
  function openLead(team: Team) { setSelectedTeam(team); setLeadId(team.leadMemberId ?? team.leadMember?.id ?? team.leadId ?? team.lead?.id ?? ''); setModal('lead'); }
  function openMembers(team: Team) { setSelectedTeam(team); setMemberId(''); setModal('members'); }
  function handleSaveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = teamForm.name.trim();
    if (!name) return;
    if (modal === 'edit') {
      saveTeamMutation.mutate({ divisionId: '', name, leadMemberId: null });
      return;
    }
    if (!teamForm.divisionId) return;
    saveTeamMutation.mutate({ divisionId: teamForm.divisionId, name, leadMemberId: null });
  }
  function handleDelete(team: Team) { if (window.confirm(`Delete ${team.name}? This cannot be undone.`)) deleteTeamMutation.mutate(team.id); }
  function handleRemoveMember(member: { id: string; name: string }) {
    if (window.confirm(`Remove ${member.name} from this team?`)) removeMemberMutation.mutate(member.id);
  }

  const teams = (teamsQuery.data?.items ?? []).filter((team) => (!divisionId || team.divisionId === divisionId) && `${team.name} ${team.description ?? ''} ${team.leadMember?.name ?? team.lead?.name ?? ''}`.toLowerCase().includes(filterText.trim().toLowerCase()));
  const currentTeam = (teamsQuery.data?.items ?? []).find((team) => team.id === selectedTeam?.id) ?? selectedTeam;
  const companyMembers = companyMembersQuery.data?.items ?? [];
  const leadCandidates = companyMembers.filter((member) => member.isActive && member.divisionId === currentTeam?.divisionId && Boolean(currentTeam?.divisionId));
  const teamMembers = teamMembersQuery.data ?? [];
  const eligibleMembers = eligibleMembersQuery.data ?? [];
  const availableMembers = eligibleMembers.filter((member) => ![...member.activeTeamMemberships, ...member.ledTeams].some((team) => typeof team !== 'string' && (team.teamId === currentTeam?.id || team.id === currentTeam?.id)) && !teamMembers.some((assigned) => assigned.id === member.memberId) && member.memberId !== (currentTeam?.leadMemberId ?? currentTeam?.leadMember?.id ?? currentTeam?.leadId ?? currentTeam?.lead?.id));

  if (modalOnly) return (modal === 'create' || modal === 'edit') ? <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{modal === 'edit' ? 'Update Team' : 'Create Team'}</strong></div><button aria-label="Close team dialog" onClick={closeModal} type="button">X</button></div><form className="division-form" onSubmit={handleSaveTeam}>{modal === 'create' && !divisionId ? <label><span>Division</span><select onChange={(event) => setTeamForm((value) => ({ ...value, divisionId: event.target.value }))} required value={teamForm.divisionId}><option value="">Select a division</option>{divisionsQuery.data?.items.filter((division) => division.isActive).map((division) => <option key={division.id} value={division.id}>{division.name} ({division.abbr})</option>)}</select></label> : null}<label><span>Team name</span><input autoFocus maxLength={100} onChange={(event) => setTeamForm((value) => ({ ...value, name: event.target.value }))} required value={teamForm.name} /></label><div className="division-form__actions"><button onClick={closeModal} type="button">Cancel</button><button disabled={saveTeamMutation.isPending || (modal === 'create' && !divisionId && divisionsQuery.isLoading)} type="submit">{saveTeamMutation.isPending ? 'Saving...' : modal === 'edit' ? 'Update Team' : 'Create Team'}</button></div></form></section></div> : null;

  return (
    <section className={embedded ? 'team-dashboard dash-panel division-panel' : 'team-dashboard'}>
      <header className="dash-section-title team-dashboard__heading">
        {modalPresentation ? <button onClick={onCreateTeam ?? (() => openCreate())} type="button">Create Team</button> : <><div><strong>{divisionId ? 'Division Teams' : 'Teams'}</strong><span>{teamsQuery.isLoading ? 'Loading teams' : `${teams.length} team records`}</span></div><div><button onClick={onCreateTeam ?? (() => openCreate())} type="button">Create Team</button>{onClose ? <button onClick={onClose} type="button">Close</button> : null}</div></>}
      </header>
      {teamsQuery.isLoading ? <div className="team-dashboard__empty">Loading teams...</div> : null}
      {teamsQuery.isError ? <div className="team-dashboard__empty">Unable to load teams.</div> : null}
      {!teamsQuery.isLoading && !teamsQuery.isError && !teams.length ? <div className="team-dashboard__empty">No teams available. Create the first team to get started.</div> : null}
      {!teamsQuery.isLoading && !teamsQuery.isError && teams.length ? <div className="division-table">
        <div className="team-grid-row team-grid-row--head"><span>Team</span><span>Lead</span><span>Members</span><span>Updated</span><span>Actions</span></div>
        {teams.map((team) => (
          <div className="team-grid-row" key={team.id}>
            <span data-label="Team"><strong>{team.name}</strong>{team.description ? <small>{team.description}</small> : null}</span>
            <span data-label="Lead">{team.leadMember?.name ?? team.lead?.name ?? 'Not assigned'}</span>
            <span data-label="Members"><TeamMemberCount team={team} /></span>
            <span data-label="Updated">{formatDate(team.updatedAt)}</span>
            <span className="division-actions team-actions" data-label="Actions">
              <button onClick={() => openEdit(team)} type="button">Edit</button>
              <button onClick={() => openLead(team)} type="button">Set lead</button>
              <button onClick={() => openMembers(team)} type="button">Members</button>
              <button disabled={deleteTeamMutation.isPending && deleteTeamMutation.variables === team.id} onClick={() => handleDelete(team)} type="button">Delete</button>
            </span>
          </div>
        ))}
      </div> : null}

      {(modal === 'create' || modal === 'edit') && (
        <div className="division-modal-backdrop" role="presentation">
          <section aria-modal="true" className="division-modal" role="dialog">
            <div className="division-modal__head"><div><strong>{modal === 'edit' ? 'Update Team' : 'Create Team'}</strong></div><button aria-label="Close team dialog" onClick={closeModal} type="button">X</button></div>
            <form className="division-form" onSubmit={handleSaveTeam}>
              {modal === 'create' && !divisionId ? <label><span>Division</span><select onChange={(event) => setTeamForm((value) => ({ ...value, divisionId: event.target.value }))} required value={teamForm.divisionId}><option value="">Select a division</option>{divisionsQuery.data?.items.filter((division) => division.isActive).map((division) => <option key={division.id} value={division.id}>{division.name} ({division.abbr})</option>)}</select></label> : null}
              <label><span>Team name</span><input autoFocus maxLength={100} onChange={(event) => setTeamForm((value) => ({ ...value, name: event.target.value }))} placeholder="e.g. Software Development" required value={teamForm.name} /></label>
              <div className="division-form__actions"><button onClick={closeModal} type="button">Cancel</button><button disabled={saveTeamMutation.isPending || (modal === 'create' && divisionsQuery.isLoading)} type="submit">{saveTeamMutation.isPending ? 'Saving...' : modal === 'edit' ? 'Update Team' : 'Create Team'}</button></div>
            </form>
          </section>
        </div>
      )}

      {modal === 'lead' && selectedTeam && <LeadModal members={leadCandidates} onClose={closeModal} onSave={() => leadCandidates.some((member) => member.id === leadId) && setLeadMutation.mutate(leadId)} saving={setLeadMutation.isPending} value={leadCandidates.some((member) => member.id === leadId) ? leadId : ''} onChange={setLeadId} />}
      {modal === 'members' && currentTeam && <MembersModal divisionLeadId={divisionLeadQuery.data?.member.id} selectableMembers={availableMembers} designationMembers={designationMembersQuery.data ?? []} teamId={currentTeam.id} lead={currentTeam.leadMember ?? currentTeam.lead ?? null} members={teamMembers} onAdd={() => availableMembers.some((member) => member.memberId === memberId) && addMemberMutation.mutate(memberId)} onChange={setMemberId} onClose={closeModal} onRemove={handleRemoveMember} loading={teamMembersQuery.isLoading || eligibleMembersQuery.isLoading || designationMembersQuery.isLoading} error={eligibleMembersQuery.isError || designationMembersQuery.isError} removingId={removeMemberMutation.isPending ? removeMemberMutation.variables ?? null : null} saving={addMemberMutation.isPending} value={availableMembers.some((member) => member.memberId === memberId) ? memberId : ''} teamName={currentTeam.name} />}
    </section>
  );
}

function LeadModal({ members, value, saving, onChange, onSave, onClose }: { members: Member[]; value: string; saving: boolean; onChange: (value: string) => void; onSave: () => void; onClose: () => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>Set Team Lead</strong></div><button onClick={onClose} type="button">X</button></div><div className="division-form"><ExistingMemberSelector members={members.filter((member) => member.isActive).map((member) => ({ id: member.id, name: member.name, email: member.email, designation: member.designation ?? member.roleTitle }))} onChange={onChange} value={value} /><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={!value || saving} onClick={onSave} type="button">{saving ? 'Saving...' : 'Set Lead'}</button></div></div></section></div>;
}

function TeamMemberCount({ team }: { team: Team }) {
  const membersQuery = useQuery({
    queryKey: ['teams', team.id, 'members'],
    queryFn: () => getTeamMembers(team.id),
  });
  const members = membersQuery.data ?? team.members ?? [];
  const memberIds = new Set(members.map((member) => member.id));
  const leadMemberId = team.leadMemberId ?? team.leadMember?.id;

  // A lead is also a team member, but should never be counted twice.
  if (leadMemberId) memberIds.add(leadMemberId);

  if (membersQuery.isLoading && !team.members) return <>Loading...</>;
  if (membersQuery.isError && !team.members) return <>—</>;

  return <>{memberIds.size} member{memberIds.size === 1 ? '' : 's'}</>;
}

function MembersModal({ divisionLeadId, teamName, teamId, lead, members, selectableMembers, designationMembers, value, loading, error, saving, removingId, onChange, onAdd, onRemove, onClose }: { divisionLeadId?: string; teamName: string; teamId: string; lead: { id: string; name: string; email?: string; roleTitle?: string; designation?: string } | null; members: Array<{ id: string; name: string; email?: string; roleTitle?: string; designation?: string }>; selectableMembers: EligibleMember[]; designationMembers: Member[]; value: string; loading: boolean; error: boolean; saving: boolean; removingId: string | null; onChange: (value: string) => void; onAdd: () => void; onRemove: (member: { id: string; name: string }) => void; onClose: () => void }) {
  const leadMember = lead ?? null;
  const otherMembers = members.filter((member) => member.id !== leadMember?.id);

  return (
    <div className="division-modal-backdrop" role="presentation">
      <section aria-labelledby="team-members-title" aria-modal="true" className="division-modal team-members-modal" role="dialog">
        <div className="division-modal__head">
          <div><strong id="team-members-title">{teamName} Members</strong><span>Manage your team roster</span></div>
          <button aria-label="Close team members dialog" onClick={onClose} type="button">X</button>
        </div>
        <div className="division-form team-members-content">
          <div className="team-members-layout">
            <div className="team-roster-table">
              <div className="team-roster-table__head"><span>Member</span><span>Designation</span><span aria-label="Actions" /></div>
              <div className="team-roster-table__label">Team lead{leadMember ? <span className="team-roster-table__hint">To change the lead, use Set lead in the team list.</span> : null}</div>
              {leadMember ? <MemberRow member={leadMember} /> : <p className="team-roster-table__empty">No lead assigned.</p>}
              <div className="team-roster-table__label">Team members</div>
              {loading ? <p className="team-roster-table__empty">Loading members...</p> : otherMembers.length ? otherMembers.map((member) => <MemberRow key={member.id} member={member} onRemove={onRemove} removing={removingId === member.id} />) : <p className="team-roster-table__empty">No additional members assigned.</p>}
            </div>
            <div className="team-members-add">
              <div><strong>Add a member</strong><p>Choose an active member from this division.</p></div>
              <MemberPicker divisionLeadId={divisionLeadId} members={selectableMembers} selectableMembers={selectableMembers} designationMembers={designationMembers} teamId={teamId} value={value} onChange={onChange} loading={loading} error={error} />
              <button disabled={!value || saving || loading} onClick={onAdd} type="button">{saving ? 'Adding...' : 'Add Member'}</button>
            </div>
          </div>
          <div className="division-form__actions"><button onClick={onClose} type="button">Done</button></div>
        </div>
      </section>
    </div>
  );
}

function MemberPicker({ divisionLeadId, members, selectableMembers, designationMembers, value, onChange, loading, error }: { divisionLeadId?: string; members: EligibleMember[]; selectableMembers: EligibleMember[]; designationMembers: Member[]; teamId: string; value: string; onChange: (value: string) => void; loading: boolean; error: boolean }) {
  const sorted = [...members].sort((a, b) => Number(Boolean(a.activeTeamMemberships.length || a.ledTeams.length || a.isTeamLead)) - Number(Boolean(b.activeTeamMemberships.length || b.ledTeams.length || b.isTeamLead)) || a.name.localeCompare(b.name));
  const options = sorted.map((member) => {
    const teamName = (team: (typeof member.ledTeams)[number]) => typeof team === 'string' ? team : team.name ?? team.code ?? team.teamId ?? team.id;
    const badges = [...member.ledTeams.map((team) => `Lead: ${teamName(team)}`), ...member.activeTeamMemberships.map((team) => `Member: ${teamName(team)}`)];
    return { id: member.memberId, name: member.name, email: member.email, highlightDesignation: member.memberId === divisionLeadId, designation: member.memberId === divisionLeadId || (!member.activeTeamMemberships.length && !member.ledTeams.length && !member.isTeamLead) ? designationMembers.find((item) => item.id === member.memberId)?.designation ?? 'Designation unavailable' : undefined, disabled: !selectableMembers.some((item) => item.memberId === member.memberId), badges };
  });
  return <><ExistingMemberSelector disabled={loading || error} emptyMessage="No available members to add to this Team." members={options} onChange={onChange} placeholder={loading ? 'Loading members...' : error ? 'Unable to load members' : 'Select a member'} value={value} />{error ? <p>Unable to load eligible members or designations. Please try again.</p> : null}</>;
}

function MemberRow({ member, removing, onRemove }: { member: { id: string; name: string; email?: string; roleTitle?: string; designation?: string }; removing?: boolean; onRemove?: (member: { id: string; name: string }) => void }) {
  return <div className="team-roster-row"><span><strong>{member.name || 'Unnamed member'}</strong>{member.email ? <small>{member.email}</small> : null}</span><span>{member.designation ?? member.roleTitle ?? 'No designation'}</span>{onRemove ? <button aria-label={`Remove ${member.name} from team`} disabled={removing} onClick={() => onRemove(member)} title={`Remove ${member.name}`} type="button"><Trash2 size={15} aria-hidden="true" /></button> : <span />}</div>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(); }

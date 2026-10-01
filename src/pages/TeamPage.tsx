import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getDivisions } from '@/services/divisionService';
import { getMembers, type Member } from '@/services/memberService';
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

export function TeamPage({ embedded = false, createRequest = 0, modalOnly = false, filterText = '' }: { embedded?: boolean; createRequest?: number; modalOnly?: boolean; filterText?: string }) {
  usePageTitle(embedded ? 'Dashboard' : 'Teams');
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState<CreateTeamPayload>({ divisionId: '', name: '', leadMemberId: null });
  const [leadId, setLeadId] = useState('');
  const [memberId, setMemberId] = useState('');

  const teamsQuery = useQuery({ queryKey: teamsQueryKey, queryFn: () => getTeams({ page: 1, limit: 100 }) });
  const companyMembersQuery = useQuery({ queryKey: companyMembersQueryKey, queryFn: getMembers, enabled: modal === 'lead' || modal === 'members' });
  const divisionsQuery = useQuery({ queryKey: ['divisions'], queryFn: getDivisions, enabled: modal === 'create' });
  const teamMembersQuery = useQuery({ queryKey: ['teams', selectedTeam?.id, 'members'], queryFn: () => getTeamMembers(selectedTeam!.id), enabled: modal === 'members' && Boolean(selectedTeam) });

  useEffect(() => {
    if (createRequest > 0) openCreate();
  }, [createRequest]);

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
    onSuccess: () => { toast.success('Team lead updated successfully.'); void refreshTeams(); closeModal(); },
    onError: () => toast.error('Unable to update the team lead.'),
  });
  const addMemberMutation = useMutation({
    mutationFn: (value: string) => addTeamMember(selectedTeam!.id, value),
    onSuccess: () => { toast.success('Member added to the team.'); void refreshTeams(); void refreshTeamMembers(); setMemberId(''); },
    onError: () => toast.error('Unable to add that member.'),
  });
  const removeMemberMutation = useMutation({
    mutationFn: (value: string) => removeTeamMember(selectedTeam!.id, value),
    onSuccess: () => { toast.success('Member removed from the team.'); void refreshTeams(); void refreshTeamMembers(); },
    onError: () => toast.error('Unable to remove that member.'),
  });

  function openCreate() { setSelectedTeam(null); setTeamForm({ divisionId: '', name: '', leadMemberId: null }); setModal('create'); }
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

  const teams = (teamsQuery.data?.items ?? []).filter((team) => `${team.name} ${team.description ?? ''} ${team.leadMember?.name ?? team.lead?.name ?? ''}`.toLowerCase().includes(filterText.trim().toLowerCase()));
  const companyMembers = companyMembersQuery.data?.items ?? [];
  const teamMembers = teamMembersQuery.data ?? [];
  const availableMembers = companyMembers.filter((member) => !teamMembers.some((assigned) => assigned.id === member.id));

  if (modalOnly) return (modal === 'create' || modal === 'edit') ? <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>{modal === 'edit' ? 'Update Team' : 'Create Team'}</strong></div><button aria-label="Close team dialog" onClick={closeModal} type="button">X</button></div><form className="division-form" onSubmit={handleSaveTeam}>{modal === 'create' ? <label><span>Division</span><select onChange={(event) => setTeamForm((value) => ({ ...value, divisionId: event.target.value }))} required value={teamForm.divisionId}><option value="">Select a division</option>{divisionsQuery.data?.items.filter((division) => division.isActive).map((division) => <option key={division.id} value={division.id}>{division.name} ({division.abbr})</option>)}</select></label> : null}<label><span>Team name</span><input autoFocus maxLength={100} onChange={(event) => setTeamForm((value) => ({ ...value, name: event.target.value }))} required value={teamForm.name} /></label><div className="division-form__actions"><button onClick={closeModal} type="button">Cancel</button><button disabled={saveTeamMutation.isPending || (modal === 'create' && divisionsQuery.isLoading)} type="submit">{saveTeamMutation.isPending ? 'Saving...' : modal === 'edit' ? 'Update Team' : 'Create Team'}</button></div></form></section></div> : null;

  return (
    <section className={embedded ? 'team-dashboard dash-panel division-panel' : 'team-dashboard'}>
      <header className="dash-section-title team-dashboard__heading">
        <div><strong>Teams</strong><span>{teamsQuery.isLoading ? 'Loading teams' : `${teams.length} team records`}</span></div>
        <button onClick={openCreate} type="button">Create Team</button>
      </header>
      <div className="division-table">
        <div className="team-grid-row team-grid-row--head"><span>Team</span><span>Lead</span><span>Members</span><span>Updated</span><span>Actions</span></div>
        {teamsQuery.isLoading ? <div className="division-empty">Loading teams...</div> : null}
        {teamsQuery.isError ? <div className="division-empty">Unable to load teams.</div> : null}
        {!teamsQuery.isLoading && !teamsQuery.isError && !teams.length ? <div className="division-empty">No teams available. Create the first team to get started.</div> : null}
        {teams.map((team) => (
          <div className="team-grid-row" key={team.id}>
            <span><strong>{team.name}</strong>{team.description ? <small>{team.description}</small> : null}</span>
            <span>{team.leadMember?.name ?? team.lead?.name ?? 'Not assigned'}</span>
            <span><TeamMemberCount team={team} /></span>
            <span>{formatDate(team.updatedAt)}</span>
            <span className="division-actions team-actions">
              <button onClick={() => openEdit(team)} type="button">Edit</button>
              <button onClick={() => openLead(team)} type="button">Set lead</button>
              <button onClick={() => openMembers(team)} type="button">Members</button>
              <button disabled={deleteTeamMutation.isPending && deleteTeamMutation.variables === team.id} onClick={() => handleDelete(team)} type="button">Delete</button>
            </span>
          </div>
        ))}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="division-modal-backdrop" role="presentation">
          <section aria-modal="true" className="division-modal" role="dialog">
            <div className="division-modal__head"><div><strong>{modal === 'edit' ? 'Update Team' : 'Create Team'}</strong></div><button aria-label="Close team dialog" onClick={closeModal} type="button">X</button></div>
            <form className="division-form" onSubmit={handleSaveTeam}>
              {modal === 'create' ? <label><span>Division</span><select onChange={(event) => setTeamForm((value) => ({ ...value, divisionId: event.target.value }))} required value={teamForm.divisionId}><option value="">Select a division</option>{divisionsQuery.data?.items.filter((division) => division.isActive).map((division) => <option key={division.id} value={division.id}>{division.name} ({division.abbr})</option>)}</select></label> : null}
              <label><span>Team name</span><input autoFocus maxLength={100} onChange={(event) => setTeamForm((value) => ({ ...value, name: event.target.value }))} placeholder="e.g. Software Development" required value={teamForm.name} /></label>
              <div className="division-form__actions"><button onClick={closeModal} type="button">Cancel</button><button disabled={saveTeamMutation.isPending || (modal === 'create' && divisionsQuery.isLoading)} type="submit">{saveTeamMutation.isPending ? 'Saving...' : modal === 'edit' ? 'Update Team' : 'Create Team'}</button></div>
            </form>
          </section>
        </div>
      )}

      {modal === 'lead' && selectedTeam && <LeadModal members={companyMembers} onClose={closeModal} onSave={() => leadId && setLeadMutation.mutate(leadId)} saving={setLeadMutation.isPending} value={leadId} onChange={setLeadId} />}
      {modal === 'members' && selectedTeam && <MembersModal availableMembers={availableMembers} lead={selectedTeam.leadMember ?? selectedTeam.lead ?? null} members={teamMembers} onAdd={() => memberId && addMemberMutation.mutate(memberId)} onChange={setMemberId} onClose={closeModal} onRemove={handleRemoveMember} loading={teamMembersQuery.isLoading} removingId={removeMemberMutation.variables ?? null} saving={addMemberMutation.isPending} value={memberId} teamName={selectedTeam.name} />}
    </section>
  );
}

function LeadModal({ members, value, saving, onChange, onSave, onClose }: { members: Member[]; value: string; saving: boolean; onChange: (value: string) => void; onSave: () => void; onClose: () => void }) {
  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong>Set Team Lead</strong></div><button onClick={onClose} type="button">X</button></div><div className="division-form"><label><span>Member</span><select onChange={(event) => onChange(event.target.value)} value={value}><option value="">Select a member</option>{members.filter((member) => member.isActive).map((member) => <option key={member.id} value={member.id}>{member.name} — {member.email}</option>)}</select></label><div className="division-form__actions"><button onClick={onClose} type="button">Cancel</button><button disabled={!value || saving} onClick={onSave} type="button">{saving ? 'Saving...' : 'Set Lead'}</button></div></div></section></div>;
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

function MembersModal({ teamName, lead, members, availableMembers, value, loading, saving, removingId, onChange, onAdd, onRemove, onClose }: { teamName: string; lead: { id: string; name: string; email?: string; roleTitle?: string; designation?: string } | null; members: Array<{ id: string; name: string; email?: string; roleTitle?: string; designation?: string }>; availableMembers: Member[]; value: string; loading: boolean; saving: boolean; removingId: string | null; onChange: (value: string) => void; onAdd: () => void; onRemove: (member: { id: string; name: string }) => void; onClose: () => void }) {
  const leadMember = lead ?? null;
  const otherMembers = members.filter((member) => member.id !== leadMember?.id);

  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal team-members-modal" role="dialog"><div className="division-modal__head"><div><strong>{teamName} Members</strong></div><button aria-label="Close team members dialog" onClick={onClose} type="button">X</button></div><div className="division-form"><div className="team-roster-table"><div className="team-roster-table__head"><span>Member</span><span>Designation / email</span><span aria-label="Actions" /></div><div className="team-roster-table__label">Team lead</div>{leadMember ? <MemberRow member={leadMember} onRemove={onRemove} removing={removingId === leadMember.id} /> : <p className="team-roster-table__empty">No lead assigned.</p>}<div className="team-roster-table__label">Team members</div>{loading ? <p className="team-roster-table__empty">Loading members...</p> : otherMembers.length ? otherMembers.map((member) => <MemberRow key={member.id} member={member} onRemove={onRemove} removing={removingId === member.id} />) : <p className="team-roster-table__empty">No additional members assigned.</p>}</div><div className="team-members-add"><label><span>Add member</span><select onChange={(event) => onChange(event.target.value)} value={value}><option value="">Select a member to add</option>{availableMembers.filter((member) => member.isActive).map((member) => <option key={member.id} value={member.id}>{member.name} — {member.email}</option>)}</select></label><button disabled={!value || saving} onClick={onAdd} type="button">{saving ? 'Adding...' : 'Add Member'}</button></div><div className="division-form__actions"><button onClick={onClose} type="button">Done</button></div></div></section></div>;
}

function MemberRow({ member, removing, onRemove }: { member: { id: string; name: string; email?: string; roleTitle?: string; designation?: string }; removing: boolean; onRemove: (member: { id: string; name: string }) => void }) {
  return <div className="team-roster-row"><span><strong>{member.name || 'Unnamed member'}</strong></span><span>{member.designation ?? member.roleTitle ?? 'No designation'}</span><button aria-label={`Remove ${member.name} from team`} disabled={removing} onClick={() => onRemove(member)} title={`Remove ${member.name}`} type="button"><Trash2 size={15} aria-hidden="true" /></button></div>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(); }

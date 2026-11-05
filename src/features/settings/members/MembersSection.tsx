import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { TablePagination } from '@/components/ui/TablePagination';
import { usePermissions } from '@/hooks/usePermissions';
import { updateMember, type Member } from '@/services/memberService';
import { getDesignations } from '@/services/designationService';
import { useMembers } from './useMembers';

type Props = {
  divisionNames: Map<string, string>;
  onManageRole: (member: Member) => void;
};

function memberDivisionName(member: Member, divisionNames: Map<string, string>) {
  return member.division?.name ?? divisionNames.get(member.divisionId) ?? 'Not assigned';
}

function MembersFilter({ divisionId, divisionNames, onDivisionChange, onFilterChange, value }: { divisionId: string; divisionNames: Map<string, string>; onDivisionChange: (divisionId: string) => void; onFilterChange: (value: string) => void; value: string }) {
  const { can } = usePermissions();
  const divisions = Array.from(divisionNames.entries()).sort(([, firstName], [, secondName]) => firstName.localeCompare(secondName));
  return <div className="settings-table-filter"><label><span>Filter</span><input aria-label="Filter members" onChange={(event) => onFilterChange(event.target.value)} placeholder="Filter current page" type="search" value={value} /></label><label><span>Division</span><select aria-label="Filter members by division" onChange={(event) => onDivisionChange(event.target.value)} value={divisionId}><option value="">All divisions</option>{divisions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>{can('CREATE_MEMBER') ? <button onClick={() => window.dispatchEvent(new CustomEvent('workspace-create', { detail: 'member' }))} type="button">Create Member</button> : null}</div>;
}

/** Owns the Members workspace list, filter, loading/error display, and member actions. */
export function MembersSection({ divisionNames, onManageRole }: Props) {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [filter, setFilter] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [page, setPage] = useState(1);
  const membersQuery = useMembers(true, page, 10, divisionId);
  const members = membersQuery.data?.items ?? [];
  const visibleMembers = members.filter((member) => `${member.name} ${member.email} ${member.designation ?? member.roleTitle ?? ''} ${memberDivisionName(member, divisionNames)}`.toLowerCase().includes(filter.toLowerCase()));
  const meta = membersQuery.data?.meta;
  return <><section className="dash-panel division-panel settings-configuration-panel"><div className="dash-section-title"><div><strong>Members</strong><span>{membersQuery.isLoading ? 'Loading members' : `${meta?.total ?? members.length} member records`}</span></div><MembersFilter divisionId={divisionId} divisionNames={divisionNames} onDivisionChange={(value) => { setPage(1); setDivisionId(value); }} onFilterChange={(value) => { setPage(1); setFilter(value); }} value={filter} /></div><div className="settings-workspace-table"><div className="division-grid division-grid--head"><span>Member</span><span>Designation</span><span>Division</span><span>Status</span><span>Actions</span></div>{visibleMembers.map((member) => <div className="division-grid" key={member.id}><span><strong>{member.name}</strong><small>{member.email}</small></span><span>{member.designation ?? member.roleTitle ?? 'Not assigned'}</span><span>{memberDivisionName(member, divisionNames)}</span><span><em className={member.isActive ? 'division-status division-status--active' : 'division-status'}>{member.isActive ? 'Active' : 'Inactive'}</em></span><span className="division-actions"><button onClick={() => setEditingMember(member)} type="button">Edit</button>{member.userId ? <button onClick={() => onManageRole(member)} type="button">Manage Role</button> : <small title="This member has no linked portal user account.">No linked user</small>}</span></div>)}{!membersQuery.isLoading && !membersQuery.isError && !visibleMembers.length ? <div className="division-empty">{filter ? 'No members found on this page.' : 'No members are available.'}</div> : null}</div>{meta && (!filter.trim() || visibleMembers.length >= meta.limit) ? <TablePagination onPageChange={setPage} page={meta.page} total={meta.total} totalPages={meta.totalPages} /> : null}</section>{editingMember ? <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} /> : null}</>;
}

function EditMemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [name, setName] = useState(member.name);
  const [designationId, setDesignationId] = useState(member.designationId ?? '');
  const client = useQueryClient();
  const designationsQuery = useQuery({ queryKey: ['designations'], queryFn: getDesignations });
  const designations = designationsQuery.data?.items ?? [];
  const selectedDesignationId = designationId || designations.find((designation) => designation.name === member.designation)?.id || '';
  const save = useMutation({
    mutationFn: () => updateMember(member.id, { name: name.trim(), designationId: selectedDesignationId, email: member.email, divisionId: member.divisionId, isActive: member.isActive }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['members'] }); toast.success('Member updated successfully.'); onClose(); },
    onError: () => toast.error('Unable to update the member.'),
  });

  return <div className="division-modal-backdrop" role="presentation"><section aria-labelledby="edit-member-title" aria-modal="true" className="division-modal" role="dialog"><div className="division-modal__head"><div><strong id="edit-member-title">Edit Member</strong><span>{member.email}</span></div><button aria-label="Close edit member dialog" disabled={save.isPending} onClick={onClose} type="button">X</button></div><form className="division-form edit-member-form" onSubmit={(event) => { event.preventDefault(); if (name.trim() && selectedDesignationId) save.mutate(); }}><label><span>Name</span><input autoFocus onChange={(event) => setName(event.target.value)} required value={name} /></label><label><span>Designation</span><select disabled={designationsQuery.isLoading || designationsQuery.isError} onChange={(event) => setDesignationId(event.target.value)} required value={selectedDesignationId}><option value="">{designationsQuery.isLoading ? 'Loading designations...' : 'Select a designation'}</option>{designations.map((designation) => <option key={designation.id} value={designation.id}>{designation.name}</option>)}</select></label>{designationsQuery.isError ? <p>Unable to load designations. Please try again.</p> : null}<div className="division-form__actions"><button disabled={save.isPending} onClick={onClose} type="button">Cancel</button><button disabled={save.isPending || !name.trim() || !selectedDesignationId || designationsQuery.isError} type="submit">{save.isPending ? 'Saving...' : 'Save changes'}</button></div></form></section></div>;
}

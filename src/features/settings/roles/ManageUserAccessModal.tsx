import { ExistingMemberSelector } from '@/components/member/ExistingMemberSelector';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useMembers } from '@/features/settings/members/useMembers';
import { assignUserRole, getUserRoleOptions, getUserRoles, readableApiError, revokeUserRole, type AccessRole } from '@/services/roleService';
import type { Member } from '@/services/memberService';

type SelectedMember = Member | null;

export function ManageUserAccessModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [accessUser, setAccessUser] = useState<SelectedMember>(null);
  const membersForAccessQuery = useMembers(true);
  const userRolesQuery = useQuery({ queryKey: ['user-roles', accessUser?.userId], queryFn: () => getUserRoles(accessUser!.userId!), enabled: Boolean(accessUser?.userId) });
  const roleOptionsQuery = useQuery({ queryKey: ['user-role-options', accessUser?.userId], queryFn: () => getUserRoleOptions(accessUser!.userId!), enabled: Boolean(accessUser?.userId) });
  const refreshUserRoles = () => accessUser?.userId && queryClient.invalidateQueries({ queryKey: ['user-roles', accessUser.userId] });
  const assignRoleMutation = useMutation({
    mutationFn: (roleId: string) => assignUserRole(accessUser!.userId!, { roleId }),
    onSuccess: () => { toast.success(`Role assigned to ${accessUser?.name}.`); void refreshUserRoles(); void queryClient.invalidateQueries({ queryKey: ['user-role-options', accessUser?.userId] }); },
    onError: (error) => toast.error(readableApiError(error, 'We could not assign that role. Please try again.')),
  });
  const revokeRoleMutation = useMutation({
    mutationFn: (roleId: string) => revokeUserRole(accessUser!.userId!, roleId),
    onSuccess: () => { toast.success(`Role removed from ${accessUser?.name}.`); void refreshUserRoles(); void queryClient.invalidateQueries({ queryKey: ['user-role-options', accessUser?.userId] }); },
    onError: (error) => toast.error(readableApiError(error, 'We could not remove that role. Please try again.')),
  });
  const handleRevokeRole = (role: AccessRole) => {
    if (window.confirm(`Remove “${role.name}” from ${accessUser?.name}? They will lose the permissions granted by this role.`)) revokeRoleMutation.mutate(role.id);
  };

  return <div className="division-modal-backdrop" role="presentation"><section aria-modal="true" className="division-modal role-modal" role="dialog"><div className="division-modal__head"><div><strong>Manage User Access</strong><span>Select a user, then assign or remove roles.</span></div><button aria-label="Close user access dialog" onClick={onClose} type="button">X</button></div><div className="division-form"><ExistingMemberSelector label="User" placeholder="Select a user" members={(membersForAccessQuery.data?.items ?? []).filter((member) => member.userId && member.isActive).map((member) => ({ id: member.id, name: member.name, email: member.email, designation: member.designation ?? member.roleTitle }))} onChange={(id) => { const member = (membersForAccessQuery.data?.items ?? []).find((value) => value.id === id); setAccessUser(member ?? accessUser); }} value={accessUser?.id ?? ''} />{!membersForAccessQuery.isLoading && !(membersForAccessQuery.data?.items ?? []).filter((member) => member.userId).length ? <p className="role-form-error">No active portal users are available. Create a member with a linked user account first.</p> : null}{accessUser?.userId ? <><div className="role-assignment"><strong>Assigned roles</strong>{userRolesQuery.isLoading ? <p>Loading assigned roles...</p> : null}{userRolesQuery.isError ? <p className="role-form-error">Unable to load this user’s roles. Please try again.</p> : null}{(userRolesQuery.data ?? []).length ? (userRolesQuery.data ?? []).map((assignment) => <div className="role-assignment__row" key={assignment.id}><span><strong>{assignment.role.name}</strong><small>{assignment.role.scope} scope · assigned {formatDate(assignment.assignedAt)}</small></span><button disabled={revokeRoleMutation.isPending} onClick={() => handleRevokeRole(assignment.role)} type="button">{revokeRoleMutation.isPending && revokeRoleMutation.variables === assignment.role.id ? 'Removing...' : 'Remove'}</button></div>) : !userRolesQuery.isLoading ? <p>No roles are assigned yet.</p> : null}</div><div className="role-assignment"><strong>Available roles</strong>{roleOptionsQuery.isLoading ? <p>Loading roles that can be assigned...</p> : null}{roleOptionsQuery.isError ? <p className="role-form-error">Unable to load role options for this user.</p> : null}{(roleOptionsQuery.data ?? []).map((role) => <div className="role-assignment__row" key={role.id}><span><strong>{role.name}</strong><small>{role.scope} scope</small></span><button disabled={assignRoleMutation.isPending} onClick={() => assignRoleMutation.mutate(role.id)} type="button">{assignRoleMutation.isPending && assignRoleMutation.variables === role.id ? 'Assigning...' : 'Assign'}</button></div>)}</div></> : <p>Select a user to view role assignments and available roles.</p>}<div className="division-form__actions"><button onClick={onClose} type="button">Done</button></div></div></section></div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

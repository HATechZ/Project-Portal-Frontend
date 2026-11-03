import { apiClient } from '@/services/apiClient';

export type Role = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  scope: string;
};

export type Member = {
  id: string;
  userId: string | null;
  companyId: string;
  divisionId: string;
  name: string;
  email: string;
  roleTitle?: string;
  designation?: string;
  designationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  division?: { id: string; name: string; abbr: string };
  user?: { id: string; fullName: string; email: string } | null;
};

export type CreateMemberPayload = {
  name: string;
  email: string;
  password: string;
  divisionId: string;
  designationId: string;
  phone: string;
};

export type UpdateMemberPayload = {
  name: string;
  email: string;
  designationId: string;
  divisionId: string;
  isActive: boolean;
};

export type EligibleMember = {
  memberId: string;
  name: string;
  email: string;
  activeTeamMemberships: Array<string | { id?: string; name?: string; code?: string }>;
  isTeamLead: boolean;
  ledTeams: Array<string | { id?: string; name?: string; code?: string }>;
};

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
type PaginatedResponse<T> = ApiResponse<{ items: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }>;

export function getMembers() {
  return apiClient<PaginatedResponse<Member>>('/member?page=1&limit=100').then((response) => response.data);
}

export function getEligibleMembers(params: { divisionId?: string; teamId?: string }) {
  const search = new URLSearchParams();
  if (params.divisionId) search.set('divisionId', params.divisionId);
  if (params.teamId) search.set('teamId', params.teamId);
  return apiClient<ApiResponse<EligibleMember[] | { items?: EligibleMember[] }>>(`/member/eligible?${search.toString()}`).then((response) => {
    const records = Array.isArray(response.data) ? response.data : response.data.items ?? [];
    return records.filter((member) => typeof member.memberId === 'string' && Boolean(member.memberId));
  });
}

export function getRoles() {
  return apiClient<ApiResponse<Role[]>>('/role').then((response) => response.data);
}

export function createMember(payload: CreateMemberPayload) {
  return apiClient<ApiResponse<Member>>('/member', { method: 'POST', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function updateMember(id: string, payload: UpdateMemberPayload) {
  return apiClient<ApiResponse<Member>>(`/member/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function deleteMember(id: string) {
  return apiClient<unknown>(`/member/${id}`, { method: 'DELETE' });
}

import { apiClient } from '@/services/apiClient';

export type TeamMember = {
  id: string;
  memberId?: string;
  name: string;
  email?: string;
  roleTitle?: string;
  designation?: string;
  isActive?: boolean;
  member?: TeamMember;
};

export type TeamLead = TeamMember;

export type Team = {
  id: string;
  name: string;
  description: string | null;
  divisionId?: string | null;
  leadMemberId?: string | null;
  leadMember?: TeamLead | null;
  leadId?: string | null;
  lead?: TeamLead | null;
  members?: TeamMember[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTeamPayload = {
  divisionId: string;
  name: string;
  leadMemberId: string | null;
};

export type UpdateTeamPayload = {
  name: string;
};

export type TeamListParams = {
  page?: number;
  limit?: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export type PaginatedTeamResponse = ApiResponse<{
  items: Team[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}>;

const teamPath = (teamId: string) => `/team/${encodeURIComponent(teamId)}`;

export function getTeams(params: TeamListParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));

  const query = searchParams.size ? `?${searchParams.toString()}` : '';
  return apiClient<PaginatedTeamResponse>(`/team${query}`).then((response) => response.data);
}

export function getTeam(teamId: string) {
  return apiClient<ApiResponse<Team>>(teamPath(teamId)).then((response) => response.data);
}

export function createTeam(payload: CreateTeamPayload) {
  return apiClient<ApiResponse<Team>>('/team', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function updateTeam(teamId: string, payload: UpdateTeamPayload) {
  return apiClient<ApiResponse<Team>>(teamPath(teamId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function deleteTeam(teamId: string) {
  return apiClient<unknown>(teamPath(teamId), { method: 'DELETE' });
}

export function setTeamLead(teamId: string, leadMemberId: string) {
  return apiClient<ApiResponse<Team>>(`${teamPath(teamId)}/lead`, {
    method: 'PUT',
    body: JSON.stringify({ leadMemberId }),
  }).then((response) => response.data);
}

export function getTeamMembers(teamId: string) {
  return apiClient<ApiResponse<TeamMember[] | { items?: TeamMember[] }>>(`${teamPath(teamId)}/member`).then((response) => {
    const records = Array.isArray(response.data) ? response.data : response.data.items ?? [];

    return records.map((record) => {
      const member = record.member ?? record;

      return {
        ...member,
        id: member.id ?? record.memberId ?? record.id,
        name: member.name ?? record.name ?? 'Unnamed member',
        designation: member.designation ?? record.designation,
        roleTitle: member.roleTitle ?? record.roleTitle,
        email: member.email ?? record.email,
      };
    });
  });
}

export function addTeamMember(teamId: string, memberId: string) {
  return apiClient<ApiResponse<TeamMember>>(`${teamPath(teamId)}/member`, {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  }).then((response) => response.data);
}

export function removeTeamMember(teamId: string, memberId: string) {
  return apiClient<unknown>(`${teamPath(teamId)}/member/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });
}

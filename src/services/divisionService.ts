import { apiClient } from '@/services/apiClient';

export type DivisionType = {
  id: string;
  name: string;
  description: string | null;
};

export type Division = {
  id: string;
  name: string;
  abbr: string;
  divisionTypeId: string | null;
  divisionType: DivisionType | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DivisionPayload = {
  name: string;
  abbr: string;
  divisionTypeId?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}>;

function authHeaders() {
  const accessToken = localStorage.getItem('accessToken');
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export function getDivisions() {
  return apiClient<PaginatedResponse<Division>>('/division?page=1&limit=100', {
    headers: authHeaders(),
  }).then((response) => response.data);
}

export function getDivision(id: string) {
  return apiClient<ApiResponse<Division>>(`/division/${id}`, {
    headers: authHeaders(),
  }).then((response) => response.data);
}

export function createDivision(payload: DivisionPayload) {
  const requestBody: DivisionPayload = {
    name: payload.name,
    abbr: payload.abbr,
    ...(payload.divisionTypeId ? { divisionTypeId: payload.divisionTypeId } : {}),
  };
  return apiClient<ApiResponse<Division>>('/division', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(requestBody),
  }).then((response) => response.data);
}

export function updateDivision(id: string, payload: DivisionPayload) {
  return apiClient<ApiResponse<Division>>(`/division/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function deleteDivision(id: string) {
  return apiClient<unknown>(`/division/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

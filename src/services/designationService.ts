import { apiClient } from '@/services/apiClient';

export type Designation = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type DesignationPayload = Pick<Designation, 'name'>;

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };

export type PaginatedDesignations = {
  items: Designation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const designationPath = (id: string) => `/designations/${encodeURIComponent(id)}`;

export function getDesignations() {
  return getDesignationsPage({ page: 1, limit: 100 });
}

export function getDesignationsPage({ page, limit }: { page: number; limit: number }) {
  return apiClient<ApiResponse<PaginatedDesignations>>(`/designations?page=${page}&limit=${limit}`).then((response) => response.data);
}

export function getDesignation(id: string) {
  return apiClient<ApiResponse<Designation>>(designationPath(id)).then((response) => response.data);
}

export function createDesignation(payload: DesignationPayload) {
  return apiClient<ApiResponse<Designation>>('/designations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function updateDesignation(id: string, payload: DesignationPayload) {
  return apiClient<ApiResponse<Designation>>(designationPath(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function deleteDesignation(id: string) {
  return apiClient<unknown>(designationPath(id), { method: 'DELETE' });
}

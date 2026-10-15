import { apiClient } from '@/services/apiClient';

export type Client = {
  id: string;
  companyId: string | null;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };

type PaginatedClients = {
  items: Client[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export function getClients() {
  return apiClient<ApiResponse<PaginatedClients | Client[]>>('/client').then((response) => {
    // The client endpoint returns a plain array, unlike the older paginated
    // contract used by the UI. Normalize both shapes for the bid selector.
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        meta: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
    return response.data;
  });
}

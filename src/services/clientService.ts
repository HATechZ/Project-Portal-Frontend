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
  return apiClient<ApiResponse<PaginatedClients>>('/client?page=1&limit=100').then((response) => response.data);
}

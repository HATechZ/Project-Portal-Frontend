import { apiClient } from '@/services/apiClient';

export type PolCode = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PolCodePayload = {
  name: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

const polCodePath = (id: string) => `/pol-codes/${encodeURIComponent(id)}`;

export function getPolCodes() {
  return apiClient<ApiResponse<PolCode[]>>('/pol-codes').then((response) => response.data);
}

export function getDeactivatedPolCodes() {
  return apiClient<ApiResponse<PolCode[]>>('/pol-codes/deactivated').then((response) => response.data);
}

export function getPolCode(id: string) {
  return apiClient<ApiResponse<PolCode>>(polCodePath(id)).then((response) => response.data);
}

export function createPolCode(payload: PolCodePayload) {
  return apiClient<ApiResponse<PolCode>>('/pol-codes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function updatePolCode(id: string, payload: PolCodePayload) {
  return apiClient<ApiResponse<PolCode>>(polCodePath(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function deactivatePolCode(id: string) {
  return apiClient<ApiResponse<PolCode>>(`${polCodePath(id)}/deactivate`, {
    method: 'PATCH',
  }).then((response) => response.data);
}

export function reactivatePolCode(id: string) {
  return apiClient<ApiResponse<PolCode>>(`${polCodePath(id)}/reactivate`, {
    method: 'PATCH',
  }).then((response) => response.data);
}

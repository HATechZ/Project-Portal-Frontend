import { apiClient } from '@/services/apiClient';

export type PodCode = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PodCodePayload = {
  name: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

const podCodePath = (id: string) => `/pod-codes/${encodeURIComponent(id)}`;

export function getPodCodes() {
  return apiClient<ApiResponse<PodCode[]>>('/pod-codes').then((response) => response.data);
}

export function getDeactivatedPodCodes() {
  return apiClient<ApiResponse<PodCode[]>>('/pod-codes/deactivated').then((response) => response.data);
}

export function getPodCode(id: string) {
  return apiClient<ApiResponse<PodCode>>(podCodePath(id)).then((response) => response.data);
}

export function createPodCode(payload: PodCodePayload) {
  return apiClient<ApiResponse<PodCode>>('/pod-codes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function updatePodCode(id: string, payload: PodCodePayload) {
  return apiClient<ApiResponse<PodCode>>(podCodePath(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function deactivatePodCode(id: string) {
  return apiClient<ApiResponse<PodCode>>(`${podCodePath(id)}/deactivate`, {
    method: 'PATCH',
  }).then((response) => response.data);
}

export function reactivatePodCode(id: string) {
  return apiClient<ApiResponse<PodCode>>(`${podCodePath(id)}/reactivate`, {
    method: 'PATCH',
  }).then((response) => response.data);
}

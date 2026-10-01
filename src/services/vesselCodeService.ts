import { apiClient } from '@/services/apiClient';

export type VesselCode = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VesselCodePayload = Pick<VesselCode, 'name' | 'code'>;

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
const vesselCodePath = (id: string) => `/vessel-codes/${encodeURIComponent(id)}`;

export function getVesselCodes() { return apiClient<ApiResponse<VesselCode[]>>('/vessel-codes').then((response) => response.data); }
export function getDeactivatedVesselCodes() { return apiClient<ApiResponse<VesselCode[]>>('/vessel-codes/deactivated').then((response) => response.data); }
export function getVesselCode(id: string) { return apiClient<ApiResponse<VesselCode>>(vesselCodePath(id)).then((response) => response.data); }
export function createVesselCode(payload: VesselCodePayload) { return apiClient<ApiResponse<VesselCode>>('/vessel-codes', { method: 'POST', body: JSON.stringify(payload) }).then((response) => response.data); }
export function updateVesselCode(id: string, payload: VesselCodePayload) { return apiClient<ApiResponse<VesselCode>>(vesselCodePath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data); }
export function deactivateVesselCode(id: string) { return apiClient<ApiResponse<VesselCode>>(`${vesselCodePath(id)}/deactivate`, { method: 'PATCH' }).then((response) => response.data); }
export function reactivateVesselCode(id: string) { return apiClient<ApiResponse<VesselCode>>(`${vesselCodePath(id)}/reactivate`, { method: 'PATCH' }).then((response) => response.data); }

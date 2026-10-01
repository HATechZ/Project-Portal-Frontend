import { apiClient } from '@/services/apiClient';

export type CargoCode = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CargoCodePayload = Pick<CargoCode, 'name' | 'code'>;

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
const cargoCodePath = (id: string) => `/cargo-codes/${encodeURIComponent(id)}`;

export function getCargoCodes() { return apiClient<ApiResponse<CargoCode[]>>('/cargo-codes').then((response) => response.data); }
export function getDeactivatedCargoCodes() { return apiClient<ApiResponse<CargoCode[]>>('/cargo-codes/deactivated').then((response) => response.data); }
export function getCargoCode(id: string) { return apiClient<ApiResponse<CargoCode>>(cargoCodePath(id)).then((response) => response.data); }
export function createCargoCode(payload: CargoCodePayload) { return apiClient<ApiResponse<CargoCode>>('/cargo-codes', { method: 'POST', body: JSON.stringify(payload) }).then((response) => response.data); }
export function updateCargoCode(id: string, payload: CargoCodePayload) { return apiClient<ApiResponse<CargoCode>>(cargoCodePath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data); }
export function deactivateCargoCode(id: string) { return apiClient<ApiResponse<CargoCode>>(`${cargoCodePath(id)}/deactivate`, { method: 'PATCH' }).then((response) => response.data); }
export function reactivateCargoCode(id: string) { return apiClient<ApiResponse<CargoCode>>(`${cargoCodePath(id)}/reactivate`, { method: 'PATCH' }).then((response) => response.data); }

import { apiClient } from '@/services/apiClient';

export type EngineeringDocumentCode = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EngineeringDocumentCodePayload = Pick<EngineeringDocumentCode, 'code' | 'name' | 'description'>;

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };

const basePath = '/engineering-document-codes';
const documentCodePath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;

export function getEngineeringDocumentCodes() {
  return apiClient<ApiResponse<EngineeringDocumentCode[]>>(basePath).then((response) => response.data);
}

export function getDeactivatedEngineeringDocumentCodes() {
  return apiClient<ApiResponse<EngineeringDocumentCode[]>>(`${basePath}/deactivated`).then((response) => response.data);
}

export function getEngineeringDocumentCode(id: string) {
  return apiClient<ApiResponse<EngineeringDocumentCode>>(documentCodePath(id)).then((response) => response.data);
}

export function createEngineeringDocumentCode(payload: EngineeringDocumentCodePayload) {
  return apiClient<ApiResponse<EngineeringDocumentCode>>(basePath, { method: 'POST', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function updateEngineeringDocumentCode(id: string, payload: EngineeringDocumentCodePayload) {
  return apiClient<ApiResponse<EngineeringDocumentCode>>(documentCodePath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function deactivateEngineeringDocumentCode(id: string) {
  return apiClient<ApiResponse<EngineeringDocumentCode>>(`${documentCodePath(id)}/deactivate`, { method: 'PATCH' }).then((response) => response.data);
}

export function reactivateEngineeringDocumentCode(id: string) {
  return apiClient<ApiResponse<EngineeringDocumentCode>>(`${documentCodePath(id)}/reactivate`, { method: 'PATCH' }).then((response) => response.data);
}

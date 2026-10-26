import { apiClient } from '@/services/apiClient';

export type EtcDocumentCode = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EtcDocumentCodePayload = Pick<EtcDocumentCode, 'code' | 'name' | 'description'>;

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };

const basePath = '/etc-document-codes';
const documentCodePath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;

export function getEtcDocumentCodes() {
  return apiClient<ApiResponse<EtcDocumentCode[]>>(basePath).then((response) => response.data);
}
export function getActiveEtcDocumentCodes() {
  return apiClient<ApiResponse<EtcDocumentCode[]>>(`${basePath}?status=active`).then((response) => response.data);
}

export function getDeactivatedEtcDocumentCodes() {
  return apiClient<ApiResponse<EtcDocumentCode[]>>(`${basePath}/deactivated`).then((response) => response.data);
}

export function getEtcDocumentCode(id: string) {
  return apiClient<ApiResponse<EtcDocumentCode>>(documentCodePath(id)).then((response) => response.data);
}

export function createEtcDocumentCode(payload: EtcDocumentCodePayload) {
  return apiClient<ApiResponse<EtcDocumentCode>>(basePath, { method: 'POST', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function updateEtcDocumentCode(id: string, payload: EtcDocumentCodePayload) {
  return apiClient<ApiResponse<EtcDocumentCode>>(documentCodePath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function deactivateEtcDocumentCode(id: string) {
  return apiClient<ApiResponse<EtcDocumentCode>>(`${documentCodePath(id)}/deactivate`, { method: 'PATCH' }).then((response) => response.data);
}

export function reactivateEtcDocumentCode(id: string) {
  return apiClient<ApiResponse<EtcDocumentCode>>(`${documentCodePath(id)}/reactivate`, { method: 'PATCH' }).then((response) => response.data);
}

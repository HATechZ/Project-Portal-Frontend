import { apiClient } from '@/services/apiClient';

export type GeneralDocumentCode = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GeneralDocumentCodePayload = Pick<GeneralDocumentCode, 'code' | 'name' | 'description'>;

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };

const basePath = '/general-document-codes';
const documentCodePath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;

export function getGeneralDocumentCodes() {
  return apiClient<ApiResponse<GeneralDocumentCode[]>>(basePath).then((response) => response.data);
}

export function getDeactivatedGeneralDocumentCodes() {
  return apiClient<ApiResponse<GeneralDocumentCode[]>>(`${basePath}/deactivated`).then((response) => response.data);
}

export function getGeneralDocumentCode(id: string) {
  return apiClient<ApiResponse<GeneralDocumentCode>>(documentCodePath(id)).then((response) => response.data);
}

export function createGeneralDocumentCode(payload: GeneralDocumentCodePayload) {
  return apiClient<ApiResponse<GeneralDocumentCode>>(basePath, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function updateGeneralDocumentCode(id: string, payload: GeneralDocumentCodePayload) {
  return apiClient<ApiResponse<GeneralDocumentCode>>(documentCodePath(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}

export function deactivateGeneralDocumentCode(id: string) {
  return apiClient<ApiResponse<GeneralDocumentCode>>(`${documentCodePath(id)}/deactivate`, { method: 'PATCH' }).then((response) => response.data);
}

export function reactivateGeneralDocumentCode(id: string) {
  return apiClient<ApiResponse<GeneralDocumentCode>>(`${documentCodePath(id)}/reactivate`, { method: 'PATCH' }).then((response) => response.data);
}

import { apiClient } from '@/services/apiClient';

export type MarketingDocumentCode = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketingDocumentCodePayload = Pick<MarketingDocumentCode, 'code' | 'name' | 'description'>;

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };

const basePath = '/marketing-document-codes';
const documentCodePath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;

export function getMarketingDocumentCodes() { return apiClient<ApiResponse<MarketingDocumentCode[]>>(basePath).then((response) => response.data); }
export function getActiveMarketingDocumentCodes() { return apiClient<ApiResponse<MarketingDocumentCode[]>>(`${basePath}?status=active`).then((response) => response.data); }
export function getDeactivatedMarketingDocumentCodes() { return apiClient<ApiResponse<MarketingDocumentCode[]>>(`${basePath}/deactivated`).then((response) => response.data); }
export function getMarketingDocumentCode(id: string) { return apiClient<ApiResponse<MarketingDocumentCode>>(documentCodePath(id)).then((response) => response.data); }
export function createMarketingDocumentCode(payload: MarketingDocumentCodePayload) { return apiClient<ApiResponse<MarketingDocumentCode>>(basePath, { method: 'POST', body: JSON.stringify(payload) }).then((response) => response.data); }
export function updateMarketingDocumentCode(id: string, payload: MarketingDocumentCodePayload) { return apiClient<ApiResponse<MarketingDocumentCode>>(documentCodePath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data); }
export function deactivateMarketingDocumentCode(id: string) { return apiClient<ApiResponse<MarketingDocumentCode>>(`${documentCodePath(id)}/deactivate`, { method: 'PATCH' }).then((response) => response.data); }
export function reactivateMarketingDocumentCode(id: string) { return apiClient<ApiResponse<MarketingDocumentCode>>(`${documentCodePath(id)}/reactivate`, { method: 'PATCH' }).then((response) => response.data); }

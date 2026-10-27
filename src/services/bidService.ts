import { apiClient } from '@/services/apiClient';

export type BidDocument = {
  id: string;
  documentCodeId: string;
  documentCode: { id: string; code: string; name: string } | null;
  originalFileName: string;
  generatedFileName: string;
  description: string | null;
  shipmentNumber: string | null;
  lastUpdatedAt: string | null;
  latestVersion?: {
    uploadedAt?: string | null;
  } | null;
  storageKey?: string;
  mimeType?: string;
  size?: number;
};

export type Bid = {
  id: string;
  name: string;
  projectCode: string;
  biddingNumber: string;
  shipmentNumber: string;
  status: string;
  clientId: string;
  client: Record<string, unknown>;
  fileCount: number;
  documents: BidDocument[];
  createdAt: string;
  updatedAt: string;
};

export type CreateBidPayload = {
  name: string;
  clientId: string;
  biddingNumber: string;
  polId: string;
  podId: string;
  cargoId: string;
  vesselId: string;
  shipmentNumber: string;
  attachments: Array<{ id: string; file: File; addedAt: string; documentCodeId: string; description?: string; shipmentNumber?: string }>;
};

export type BidDocumentUploadResponse = {
  documentId: string;
  originalFileName: string;
  generatedFileName: string | null;
  description: string | null;
  shipmentNumber: string | null;
  documentCode: { id: string; code: string; name: string } | null;
  mimeType: string;
  size: number;
  lastUpdatedAt: string;
  latestVersion: unknown;
};

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
type PaginatedBids = { items: Bid[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };

const bidPath = (id: string) => `/bids/${encodeURIComponent(id)}`;

export function getBids() {
  return apiClient<ApiResponse<PaginatedBids>>('/bids?page=1&limit=100').then((response) => response.data);
}

export function getBid(id: string) {
  return apiClient<ApiResponse<Bid>>(bidPath(id)).then((response) => response.data);
}

export function createBid(payload: CreateBidPayload) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('clientId', payload.clientId);
  formData.append('biddingNumber', payload.biddingNumber);
  formData.append('polId', payload.polId);
  formData.append('podId', payload.podId);
  formData.append('cargoId', payload.cargoId);
  formData.append('vesselId', payload.vesselId);
  formData.append('shipmentNumber', payload.shipmentNumber);

  // Each pair is appended together so its multipart order remains positional.
  // When there are no attachments, neither optional field is appended.
  payload.attachments.forEach(({ documentCodeId, file, description, shipmentNumber }) => {
    formData.append('files', file);
    formData.append('documentCodeIds', documentCodeId);
    formData.append('descriptions', description?.trim() ?? '');
    formData.append('shipmentNumbers', shipmentNumber?.trim() ?? '');
  });

  return apiClient<ApiResponse<Bid>>('/bids', { method: 'POST', body: formData }).then((response) => response.data);
}

export function uploadBidDocuments(bidId: string, attachments: CreateBidPayload['attachments']) {
  const formData = new FormData();
  attachments.forEach(({ file, documentCodeId, description, shipmentNumber }) => {
    formData.append('files', file);
    formData.append('documentCodeIds', documentCodeId);
    formData.append('descriptions', description?.trim() ?? '');
    formData.append('shipmentNumbers', shipmentNumber?.trim() ?? '');
  });
  return apiClient<ApiResponse<BidDocumentUploadResponse[]>>(`${bidPath(bidId)}/documents`, { method: 'POST', body: formData }).then((response) => response.data);
}

export function updateBid(id: string, payload: Pick<Bid, 'name'>) {
  return apiClient<ApiResponse<Bid>>(bidPath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function updateBidDocumentCode(bidId: string, documentId: string, documentCodeId: string) {
  return apiClient<ApiResponse<BidDocument>>(`${bidPath(bidId)}/documents/${encodeURIComponent(documentId)}/document-code`, {
    method: 'PATCH',
    body: JSON.stringify({ documentCodeId }),
  }).then((response) => response.data);
}

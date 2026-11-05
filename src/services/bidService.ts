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
export type AvailableDocumentCode = { id: string; code: string; name: string };
export type AvailableBidAction = { code: string; label: string };

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
type PaginatedBids = { items: Bid[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };

const bidPath = (id: string) => `/bids/${encodeURIComponent(id)}`;

export function getBids() {
  return getBidsPage({ page: 1, limit: 100 });
}

export function getBidsPage({ page, limit }: { page: number; limit: number }) {
  return apiClient<ApiResponse<PaginatedBids>>(`/bids?page=${page}&limit=${limit}`).then((response) => response.data);
}

export function getBid(id: string) {
  return apiClient<ApiResponse<Bid>>(bidPath(id)).then((response) => response.data);
}

/** The workflow service is the authorization source for Bid actions. */
export function getBidAvailableActions(id: string) {
  return apiClient<ApiResponse<unknown>>(`${bidPath(id)}/available-actions`).then((response) => normalizeBidActions(response.data));
}

function normalizeBidActions(value: unknown): AvailableBidAction[] {
  const items = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? (value as { availableActions?: unknown; actions?: unknown; items?: unknown }).availableActions
        ?? (value as { actions?: unknown }).actions
        ?? (value as { items?: unknown }).items
      : [];
  if (!Array.isArray(items)) return [];
  return items.flatMap((item): AvailableBidAction[] => {
    if (typeof item === 'string') return [{ code: item, label: labelBidAction(item) }];
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const code = typeof record.code === 'string' ? record.code : typeof record.actionCode === 'string' ? record.actionCode : typeof record.action === 'string' ? record.action : null;
    if (!code) return [];
    return [{ code, label: typeof record.label === 'string' ? record.label : typeof record.displayName === 'string' ? record.displayName : typeof record.name === 'string' ? record.name : labelBidAction(code) }];
  });
}

function labelBidAction(code: string) {
  return code.toLowerCase().split(/[_-]+/).filter(Boolean).map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`).join(' ');
}

export function getBidCreationAvailableDocumentCodes() {
  return apiClient<ApiResponse<unknown>>('/bids/creation/available-document-codes').then((response) => normalizeAvailableDocumentCodes(response.data));
}

export function getBidAvailableDocumentCodes(id: string) {
  return apiClient<ApiResponse<unknown>>(`${bidPath(id)}/documents/available-document-codes`).then((response) => normalizeAvailableDocumentCodes(response.data));
}

function normalizeAvailableDocumentCodes(value: unknown): AvailableDocumentCode[] {
  const items = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? (value as { items?: unknown; documentCodes?: unknown; availableDocumentCodes?: unknown }).items
        ?? (value as { documentCodes?: unknown }).documentCodes
        ?? (value as { availableDocumentCodes?: unknown }).availableDocumentCodes
      : [];

  if (!Array.isArray(items)) return [];

  return items.flatMap((item): AvailableDocumentCode[] => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id : null;
    const code = typeof record.code === 'string' ? record.code : null;
    const name = typeof record.name === 'string' ? record.name : null;
    return id && code && name ? [{ id, code, name }] : [];
  });
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

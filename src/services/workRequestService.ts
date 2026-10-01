import { apiClient } from '@/services/apiClient';

export type WorkRequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type WorkRequestDocument = {
  id: string;
  documentCodeId?: string;
  originalFileName?: string;
  generatedFileName?: string;
  name?: string;
  [key: string]: unknown;
};

export type WorkRequest = {
  id: string;
  bidId: string | Record<string, unknown> | null;
  projectId: string | Record<string, unknown> | null;
  title: string;
  priority: WorkRequestPriority | string;
  notes: string | Record<string, unknown> | null;
  creator: Record<string, unknown> | null;
  currentState: string;
  documents: WorkRequestDocument[];
  availableActions: unknown[];
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkRequestPayload = {
  bidId?: string;
  projectId?: string;
  title: string;
  priority: WorkRequestPriority;
  notes?: string;
  attachments: Array<{ file: File; documentCodeId: string }>;
};

export type UpdateWorkRequestPayload = {
  title: string;
  priority: WorkRequestPriority;
  notes: string | null;
};

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
export type WorkRequestList = { items: WorkRequest[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };

const requestPath = (id: string) => `/work-requests/${encodeURIComponent(id)}`;

export function getWorkRequests() {
  return apiClient<ApiResponse<WorkRequestList>>('/work-requests?page=1&limit=100').then((response) => response.data);
}

export function getWorkRequest(id: string) {
  return apiClient<ApiResponse<WorkRequest>>(requestPath(id)).then((response) => response.data);
}

export function createWorkRequest(payload: CreateWorkRequestPayload) {
  const formData = new FormData();
  if (payload.bidId) formData.append('bidId', payload.bidId);
  if (payload.projectId) formData.append('projectId', payload.projectId);
  formData.append('title', payload.title);
  formData.append('priority', payload.priority);
  if (payload.notes) formData.append('notes', payload.notes);
  // Keep code and file values in the same order so each code identifies its file.
  payload.attachments.forEach(({ documentCodeId }) => formData.append('documentCodeIds', documentCodeId));
  payload.attachments.forEach(({ file }) => formData.append('files', file));

  return apiClient<ApiResponse<WorkRequest>>('/work-requests', { method: 'POST', body: formData }).then((response) => response.data);
}

export function updateWorkRequest(id: string, payload: UpdateWorkRequestPayload) {
  return apiClient<ApiResponse<WorkRequest>>(requestPath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function getWorkRequestDocuments(id: string) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/documents`).then((response) => response.data);
}

export function getWorkRequestDocumentVersions(id: string, documentId: string) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/documents/${encodeURIComponent(documentId)}/versions`).then((response) => response.data);
}

export function getWorkRequestEvents(id: string) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/events`).then((response) => response.data);
}

export function getWorkRequestAvailableActions(id: string) {
  return apiClient<ApiResponse<unknown>>(`${requestPath(id)}/available-actions`).then((response) => response.data);
}

import { apiClient } from '@/services/apiClient';

export type ProjectDocument = { id: string; documentCodeId: string; documentCode: { id: string; code: string; name: string } | null; originalFileName: string; generatedFileName: string | null; description: string | null; shipmentNumber: string | null; lastUpdatedAt: string | null; latestVersion?: { uploadedAt?: string | null } | null; storageKey?: string; mimeType?: string; size?: number };
export type ProjectDocumentUploadResponse = { documentId: string; originalFileName: string; generatedFileName: string | null; description: string | null; shipmentNumber: string | null; documentCode: { id: string; code: string; name: string } | null; mimeType: string; size: number; lastUpdatedAt: string; latestVersion: unknown };
export type Project = { id: string; name: string; clientId: string; projectCode?: string; shipmentNumber?: string; status: string; fileCount: number; documents: ProjectDocument[]; createdAt: string; updatedAt: string };
export type CreateProjectPayload = {
  name: string;
  clientId: string;
  shipmentNumber: string;
  attachments: Array<{ id: string; file: File; addedAt: string; documentCodeId: string; description?: string; shipmentNumber?: string }>;
};
type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
type ProjectList = { items: Project[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };
const projectPath = (id: string) => `/projects/${encodeURIComponent(id)}`;

export function getProjects() { return apiClient<ApiResponse<ProjectList>>('/projects?page=1&limit=100').then((response) => response.data); }
export function getProject(id: string) { return apiClient<ApiResponse<Project>>(projectPath(id)).then((response) => response.data); }
export function createProject(payload: CreateProjectPayload) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('clientId', payload.clientId);
  formData.append('shipmentNumber', payload.shipmentNumber);
  payload.attachments.forEach(({ file, documentCodeId, description, shipmentNumber }) => {
    formData.append('files', file);
    formData.append('documentCodeIds', documentCodeId);
    formData.append('descriptions', description?.trim() ?? '');
    formData.append('shipmentNumbers', shipmentNumber?.trim() ?? '');
  });
  return apiClient<ApiResponse<Project>>('/projects', {
    method: 'POST',
    body: formData,
  }).then((response) => response.data);
}
export function uploadProjectDocuments(projectId: string, attachments: CreateProjectPayload['attachments']) {
  const formData = new FormData();
  attachments.forEach(({ file, documentCodeId, description, shipmentNumber }) => {
    formData.append('files', file);
    formData.append('documentCodeIds', documentCodeId);
    formData.append('descriptions', description?.trim() ?? '');
    formData.append('shipmentNumbers', shipmentNumber?.trim() ?? '');
  });
  return apiClient<ApiResponse<ProjectDocumentUploadResponse[]>>(`${projectPath(projectId)}/documents`, { method: 'POST', body: formData }).then((response) => response.data);
}
export function updateProject(id: string, payload: Pick<Project, 'name'>) { return apiClient<ApiResponse<Project>>(projectPath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data); }
export function updateProjectDocumentCode(projectId: string, documentId: string, documentCodeId: string) { return apiClient<ApiResponse<ProjectDocument>>(`${projectPath(projectId)}/documents/${encodeURIComponent(documentId)}/document-code`, { method: 'PATCH', body: JSON.stringify({ documentCodeId }) }).then((response) => response.data); }

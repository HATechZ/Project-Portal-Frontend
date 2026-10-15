import { apiClient } from '@/services/apiClient';

export type ProjectDocument = { id: string; documentCodeId: string; originalFileName: string; generatedFileName: string | null; storageKey?: string; mimeType?: string; size?: number };
export type Project = { id: string; name: string; clientId: string; status: string; fileCount: number; documents: ProjectDocument[]; createdAt: string; updatedAt: string };
export type CreateProjectPayload = {
  name: string;
  clientId: string;
  shipmentNumber: string;
  documentCodeIds: string[];
};
type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
type ProjectList = { items: Project[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };
const projectPath = (id: string) => `/projects/${encodeURIComponent(id)}`;

export function getProjects() { return apiClient<ApiResponse<ProjectList>>('/projects?page=1&limit=100').then((response) => response.data); }
export function getProject(id: string) { return apiClient<ApiResponse<Project>>(projectPath(id)).then((response) => response.data); }
export function createProject(payload: CreateProjectPayload) {
  return apiClient<ApiResponse<Project>>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => response.data);
}
export function updateProject(id: string, payload: Pick<Project, 'name'>) { return apiClient<ApiResponse<Project>>(projectPath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data); }
export function updateProjectDocumentCode(projectId: string, documentId: string, documentCodeId: string) { return apiClient<ApiResponse<ProjectDocument>>(`${projectPath(projectId)}/documents/${encodeURIComponent(documentId)}/document-code`, { method: 'PATCH', body: JSON.stringify({ documentCodeId }) }).then((response) => response.data); }

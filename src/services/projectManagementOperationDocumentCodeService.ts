import { apiClient } from '@/services/apiClient';

export type ProjectManagementOperationDocumentCode = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectManagementOperationDocumentCodePayload = Pick<ProjectManagementOperationDocumentCode, 'code' | 'name' | 'description'>;

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };

const basePath = '/project-management-operation-document-codes';
const documentCodePath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;

export function getProjectManagementOperationDocumentCodes() {
  return apiClient<ApiResponse<ProjectManagementOperationDocumentCode[]>>(basePath).then((response) => response.data);
}
export function getActiveProjectManagementOperationDocumentCodes() {
  return apiClient<ApiResponse<ProjectManagementOperationDocumentCode[]>>(`${basePath}?status=active`).then((response) => response.data);
}

export function getDeactivatedProjectManagementOperationDocumentCodes() {
  return apiClient<ApiResponse<ProjectManagementOperationDocumentCode[]>>(`${basePath}/deactivated`).then((response) => response.data);
}

export function getProjectManagementOperationDocumentCode(id: string) {
  return apiClient<ApiResponse<ProjectManagementOperationDocumentCode>>(documentCodePath(id)).then((response) => response.data);
}

export function createProjectManagementOperationDocumentCode(payload: ProjectManagementOperationDocumentCodePayload) {
  return apiClient<ApiResponse<ProjectManagementOperationDocumentCode>>(basePath, { method: 'POST', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function updateProjectManagementOperationDocumentCode(id: string, payload: ProjectManagementOperationDocumentCodePayload) {
  return apiClient<ApiResponse<ProjectManagementOperationDocumentCode>>(documentCodePath(id), { method: 'PATCH', body: JSON.stringify(payload) }).then((response) => response.data);
}

export function deactivateProjectManagementOperationDocumentCode(id: string) {
  return apiClient<ApiResponse<ProjectManagementOperationDocumentCode>>(`${documentCodePath(id)}/deactivate`, { method: 'PATCH' }).then((response) => response.data);
}

export function reactivateProjectManagementOperationDocumentCode(id: string) {
  return apiClient<ApiResponse<ProjectManagementOperationDocumentCode>>(`${documentCodePath(id)}/reactivate`, { method: 'PATCH' }).then((response) => response.data);
}

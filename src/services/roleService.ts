import { ApiClientError, apiClient } from '@/services/apiClient';

export type Permission = {
  id: string;
  code: string;
  displayName: string;
  /** Kept optional while older API responses are phased out. */
  name?: string;
  description: string | null;
  category: string;
  actionType: string;
  resource: string;
  compatibleScopes: string[];
};

export type AccessRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  scope: string;
  createdAt: string;
  permissions: Permission[];
};

export type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  teamId: string | null;
  assignedByUserId: string | null;
  assignedAt: string;
  revokedAt: string | null;
  role: AccessRole;
};

type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };

export type RolePayload = { name: string; description: string | null; scope: string; permissionIds: string[] };
export type RolePermissionPayload = Pick<RolePayload, 'scope' | 'permissionIds'>;
export type AssignUserRolePayload = { roleId: string; teamId?: string | null };

function unwrap<T>(response: ApiResponse<T>) {
  if (!response.success) throw new Error(response.message || 'The server could not complete the request.');
  return response.data;
}

export function getAccessRoles() {
  return apiClient<ApiResponse<AccessRole[]>>('/role').then(unwrap);
}

export function getAccessRole(roleId: string) {
  return apiClient<ApiResponse<AccessRole>>(`/role/${roleId}`).then(unwrap);
}

export function getPermissions(scope?: string) {
  const params = new URLSearchParams({ customRole: 'true' });
  if (scope?.trim()) params.set('scope', scope.trim().toLowerCase());
  const query = `?${params.toString()}`;
  return apiClient<ApiResponse<Permission[]>>(`/permission${query}`).then(unwrap).then((permissions) => permissions.map((permission) => ({
    ...permission,
    name: permission.displayName,
  })));
}

export function getPermission(permissionId: string) {
  return apiClient<ApiResponse<Permission>>(`/permission/${permissionId}`).then(unwrap);
}

export function createAccessRole(payload: RolePayload) {
  const requestBody: RolePayload = {
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    scope: payload.scope.trim().toLowerCase(),
    permissionIds: [...new Set(payload.permissionIds.map((id) => id.trim()).filter(Boolean))],
  };
  return apiClient<ApiResponse<AccessRole>>('/role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  }).then(unwrap);
}

export function updateRolePermissions(roleId: string, payload: RolePermissionPayload) {
  const requestBody: RolePermissionPayload = {
    scope: payload.scope.trim().toLowerCase(),
    permissionIds: [...new Set(payload.permissionIds.map((id) => id.trim()).filter(Boolean))],
  };
  return apiClient<ApiResponse<AccessRole>>(`/role/${roleId}/permission`, {
    method: 'PUT',
    body: JSON.stringify(requestBody),
  }).then(unwrap);
}

export function getUserRoles(userId: string) {
  return apiClient<ApiResponse<UserRole[]>>(`/user/${userId}/role`).then(unwrap);
}

export function getUserRoleOptions(userId: string) {
  return apiClient<ApiResponse<Pick<AccessRole, 'id' | 'code' | 'name' | 'description' | 'isSystemRole' | 'scope'>[]>>(`/user/${userId}/role-options`).then(unwrap);
}

export function assignUserRole(userId: string, payload: AssignUserRolePayload) {
  const requestBody: AssignUserRolePayload = {
    roleId: payload.roleId,
    ...(payload.teamId ? { teamId: payload.teamId } : {}),
  };
  return apiClient<ApiResponse<UserRole>>(`/user/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify(requestBody),
  }).then(unwrap);
}

export function revokeUserRole(userId: string, roleId: string) {
  // This endpoint intentionally returns an empty successful response.
  return apiClient<unknown>(`/user/${userId}/role/${roleId}`, { method: 'DELETE' });
}

export function readableApiError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    const data = error.data as { message?: unknown; errors?: unknown; error?: unknown; details?: unknown; data?: unknown } | null;
    const message = findApiMessage(data);
    const validationErrors = collectValidationMessages(data?.errors ?? data?.details ?? data?.data);
    if (validationErrors.length) return validationErrors.join(' ');
    if (message) return message;
    if (error.status === 403) return 'You do not have permission to make this change.';
    if (error.status === 404) return 'The requested role or user could not be found. Refresh the page and try again.';
    if (error.status === 409) return 'This role assignment already exists or conflicts with an existing record.';
    if (error.status === 422 || error.status === 400) return 'Please check the entered values and try again.';
  }
  if (error instanceof Error && error.message && !error.message.startsWith('Request failed')) return error.message;
  return fallback;
}

function collectValidationMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectValidationMessages);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectValidationMessages);
  return [];
}

function findApiMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.error === 'object') {
    const nestedErrorMessage = findApiMessage(record.error);
    if (nestedErrorMessage) return nestedErrorMessage;
  }
  if (typeof record.details === 'object') {
    const detailsMessage = findApiMessage(record.details);
    if (detailsMessage) return detailsMessage;
  }
  if (typeof record.message === 'string' && record.message.trim()) return record.message;
  if (typeof record.error === 'string' && record.error.trim() && record.error !== 'Bad Request') return record.error;
  return findApiMessage(record.data);
}

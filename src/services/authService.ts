import { apiClient } from '@/services/apiClient';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: {
    id: string;
    fullName: string;
    email: string;
    country: string;
    phone: string;
    avatarUrl: string | null;
    roles: string[];
    roleScopes: string[];
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
};

export type ActorProfile = {
  id: string;
  roleId: string;
  roleCode: string;
  roleScope: string | null;
  label: string;
  memberId: string | null;
  clientContactId: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export type RefreshTokensResponse = {
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export function login(payload: LoginPayload) {
  return apiClient<ApiResponse<LoginResponse>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function refreshTokens(payload: RefreshTokenPayload) {
  return apiClient<ApiResponse<RefreshTokensResponse>>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout(accessToken: string | null) {
  return apiClient<ApiResponse<unknown>>('/auth/logout', {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

export function getCurrentUser() {
  return apiClient<ApiResponse<LoginResponse['user']>>('/auth/me').then((response) => response.data);
}

export function getActorProfiles() {
  return apiClient<ApiResponse<ActorProfile[]>>('/actor-profiles').then((response) => response.data);
}

export function activateActorProfile(profileId: string) {
  return apiClient<ApiResponse<ActorProfile>>(`/actor-profiles/${encodeURIComponent(profileId)}/activate`, {
    method: 'POST',
  }).then((response) => response.data);
}

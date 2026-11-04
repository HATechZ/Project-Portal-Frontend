import { apiClient } from '@/services/apiClient';

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  country: string;
  phone: string;
  avatarUrl: string | null;
  roles: string[];
  roleScopes: string[];
  permissions: string[];
  activeActorProfileId: string | null;
};

export type LoginResponse = {
  user: AuthUser;
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
  /** The one profile currently acting for this session. */
  isCurrent: boolean;
  /** Lifecycle status only; several enabled profiles can have this set. */
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
  const accessToken = localStorage.getItem('accessToken');
  return apiClient<ApiResponse<AuthUser>>('/auth/me', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  }).then((response) => response.data);
}

export function getActorProfiles() {
  return apiClient<ApiResponse<ActorProfile[]>>('/actor-profiles').then((response) => response.data);
}

export function activateActorProfile(profileId: string) {
  return apiClient<ApiResponse<ActorProfile>>(`/actor-profiles/${encodeURIComponent(profileId)}/activate`, {
    method: 'POST',
  }).then((response) => response.data);
}

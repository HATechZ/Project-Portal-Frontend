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
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
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

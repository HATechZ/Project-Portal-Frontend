import { clearStoredUser } from '@/services/authSession';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
};

type RefreshResponse = {
  success: boolean;
  data?: {
    tokens?: RefreshedTokens;
  };
};

let refreshRequest: Promise<RefreshResponse> | null = null;

export class ApiClientError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`Request failed with status ${status}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

function clearSessionTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  clearStoredUser();
}

function requestTokenRefresh(refreshToken: string) {
  if (!refreshRequest) {
    refreshRequest = apiClient<RefreshResponse>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      false,
    ).finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

export async function apiClient<T>(path: string, init?: RequestInit, retryOnUnauthorized = true): Promise<T> {
  const accessToken = localStorage.getItem('accessToken');
  const headers = new Headers(init?.headers);
  const isAuthEndpoint = path.startsWith('/auth/');

  // Let the browser add the multipart boundary when a request body is FormData.
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !isAuthEndpoint && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...Object.fromEntries(headers.entries()),
    },
  });

  const responseText = await response.text();
  let data: unknown = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }
  }

  if (response.status === 401 && retryOnUnauthorized && !isAuthEndpoint) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        const refreshResponse = await requestTokenRefresh(refreshToken);
        const tokens = refreshResponse.data?.tokens;

        if (refreshResponse.success && tokens?.accessToken && tokens.refreshToken) {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          const retryHeaders = new Headers(init?.headers);
          retryHeaders.set('Authorization', `Bearer ${tokens.accessToken}`);

          return apiClient<T>(path, { ...init, headers: retryHeaders }, false);
        }
      } catch {
        // The original unauthorized response is returned after clearing stale session data.
      }
    }

    clearSessionTokens();
  }

  if (!response.ok) {
    throw new ApiClientError(response.status, data);
  }

  return data as T;
}

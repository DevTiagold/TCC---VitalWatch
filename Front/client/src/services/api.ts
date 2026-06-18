export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const TOKEN_STORAGE_KEY = 'vitalwatch_token';
export const USER_STORAGE_KEY = 'vitalwatch_user';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearStoredAuth() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

interface ApiRequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...requestOptions } = options;
  const token = getStoredToken();
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && requestOptions.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth && token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
    });
  } catch (error) {
    throw new ApiError('Backend indisponivel. Verifique se o servidor esta rodando.', 0, error);
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }

    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? String(payload.error)
        : 'Nao foi possivel concluir a requisicao.';

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

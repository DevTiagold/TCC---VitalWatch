import { apiRequest, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './api';
import type { LoginRequest, LoginResponse, User } from '../types/vital';

export const authService = {
  async login(credentials: LoginRequest) {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(credentials),
    });

    window.localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));

    return response;
  },

  async changePassword(senhaAtual: string, novaSenha: string) {
    return apiRequest<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
  },

  getStoredUser(): User | null {
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      return null;
    }
  },
};

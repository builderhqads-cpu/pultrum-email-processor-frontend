import {apiClient, ApiError} from './api-client';
import type {MicrosoftConnectionStatusResponse} from '@/types';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export async function login(payload: LoginRequest) {
  const {data} = await apiClient.post('/auth/login', payload);
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Unexpected response from POST /auth/login (expected object)',
      data
    });
  }
  return data as LoginResponse;
}

export async function me() {
  const {data} = await apiClient.get('/auth/me');
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Unexpected response from GET /auth/me (expected object)',
      data
    });
  }
  return data as AuthUser;
}

export async function getMicrosoftConnectionStatus() {
  const {data} = await apiClient.get('/auth/microsoft/status');
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message:
        'Unexpected response from GET /auth/microsoft/status (expected object)',
      data
    });
  }
  return data as MicrosoftConnectionStatusResponse;
}

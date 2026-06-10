import axios, {AxiosError, type AxiosInstance} from 'axios';
import {getAccessToken} from '@/lib/auth/token-storage';

export type ApiErrorDetails = {
  status?: number;
  code?: string;
  message: string;
  data?: unknown;
  url?: string;
  method?: string;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly data?: unknown;
  readonly url?: string;
  readonly method?: string;
  readonly cause?: unknown;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.status = details.status;
    this.code = details.code;
    this.data = details.data;
    this.url = details.url;
    this.method = details.method;
    this.cause = details.cause;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNestedMessage(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;

  const message = data.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.every((m) => typeof m === 'string')) {
    return message.join(', ');
  }
  return undefined;
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    const url = axiosError.config?.url;
    const method = axiosError.config?.method?.toUpperCase();

    // Common NestJS shapes:
    // - { message: string | string[], error: string, statusCode: number }
    const messageFromData = getNestedMessage(data);

    const message =
      messageFromData ||
      axiosError.message ||
      'Request failed';

    return new ApiError({
      status,
      code: axiosError.code,
      message,
      data,
      url,
      method,
      cause: err
    });
  }

  return new ApiError({
    message: err instanceof Error ? err.message : String(err),
    cause: err
  });
}

function createApiClient(): AxiosInstance {
  // Use a same-origin proxy to avoid CORS issues when the backend doesn't send
  // `Access-Control-Allow-Origin` (common in local dev).
  // The proxy forwards to `NEXT_PUBLIC_API_URL` server-side.
  const baseURL = '/api';

  const client = axios.create({
    baseURL,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(toApiError(error))
  );

  return client;
}

export const apiClient = createApiClient();

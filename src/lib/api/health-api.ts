import {apiClient, ApiError} from './api-client';
import type {HealthResponse} from '@/types';

export async function getHealth() {
  const {data} = await apiClient.get('/health');
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Unexpected response from GET /health (expected object)',
      data
    });
  }
  return data as HealthResponse;
}


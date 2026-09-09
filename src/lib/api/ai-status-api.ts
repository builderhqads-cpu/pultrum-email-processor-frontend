import {apiClient, ApiError} from './api-client';
import type {AiServiceStatus} from '@/types';

export async function getAiStatus() {
  const {data} = await apiClient.get('/ai-status');
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Unexpected response from GET /ai-status (expected object)',
      data
    });
  }
  return data as AiServiceStatus;
}

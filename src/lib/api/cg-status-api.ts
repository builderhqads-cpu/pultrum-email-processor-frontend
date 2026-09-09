import {apiClient, ApiError} from './api-client';
import type {CreativeGearsStatus} from '@/types';

export async function getCreativeGearsStatus() {
  const {data} = await apiClient.get('/cg-status');
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Unexpected response from GET /cg-status (expected object)',
      data
    });
  }
  return data as CreativeGearsStatus;
}

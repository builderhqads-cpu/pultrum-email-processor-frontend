import {apiClient, ApiError} from './api-client';
import type {EmailStatsGroupBy, EmailStatsResponse} from '@/types';

type StatsParams = {from?: string; to?: string; groupBy?: EmailStatsGroupBy};

export async function getEmailStats(
  params: StatsParams
): Promise<EmailStatsResponse> {
  const {data} = await apiClient.get('/audit/email-stats', {
    params: {...params, format: 'json'}
  });
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Unexpected response from GET /audit/email-stats',
      data
    });
  }
  return data as EmailStatsResponse;
}

/** Fetch the CSV (same data) and trigger a browser download. */
export async function downloadEmailStatsCsv(params: StatsParams): Promise<void> {
  const res = await apiClient.get('/audit/email-stats', {
    params: {...params, format: 'csv'},
    responseType: 'blob'
  });
  const blob = res.data as Blob;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `email-stats-${params.groupBy ?? 'day'}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

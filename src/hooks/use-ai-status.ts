'use client';

import {useQuery} from '@tanstack/react-query';
import {getAiStatus} from '@/lib/api';

export function useAiStatus() {
  const query = useQuery({
    queryKey: ['ai-status'],
    queryFn: getAiStatus,
    // Same cadence as the reference status page ("updates every 60 seconds").
    refetchInterval: 60_000
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}

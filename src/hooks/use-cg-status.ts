'use client';

import {useQuery} from '@tanstack/react-query';
import {getCreativeGearsStatus} from '@/lib/api';

export function useCreativeGearsStatus() {
  const query = useQuery({
    queryKey: ['cg-status'],
    queryFn: getCreativeGearsStatus,
    refetchInterval: 60_000
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}

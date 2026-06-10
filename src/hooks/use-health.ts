'use client';

import {useQuery} from '@tanstack/react-query';
import {getHealth} from '@/lib/api';

export function useHealth() {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}


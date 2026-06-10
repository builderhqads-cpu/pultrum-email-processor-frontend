'use client';

import {useQuery} from '@tanstack/react-query';
import {getOrder} from '@/lib/api';

export function useOrder(id: string | undefined) {
  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id)
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}


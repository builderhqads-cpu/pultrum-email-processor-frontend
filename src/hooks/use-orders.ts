'use client';

import {useQuery} from '@tanstack/react-query';
import {listOrders} from '@/lib/api';

export function useOrders() {
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: listOrders
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}


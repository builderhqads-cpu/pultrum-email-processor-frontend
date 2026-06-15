'use client';

import {useQuery} from '@tanstack/react-query';
import {listOrders} from '@/lib/api';
import {isActiveOrderStatus, STATUS_POLL_MS} from '@/lib/polling';

export function useOrders() {
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: listOrders,
    // Poll while any order in the list is still being processed.
    refetchInterval: (q) =>
      (q.state.data ?? []).some((order) => isActiveOrderStatus(order.status))
        ? STATUS_POLL_MS
        : false
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}


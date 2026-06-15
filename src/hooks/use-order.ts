'use client';

import {useQuery} from '@tanstack/react-query';
import {getOrder} from '@/lib/api';
import {isActiveOrderStatus, STATUS_POLL_MS} from '@/lib/polling';

export function useOrder(id: string | undefined) {
  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
    // Live updates: poll while the order is still being processed, then stop.
    // React Query pauses polling while the tab is unfocused.
    refetchInterval: (q) =>
      isActiveOrderStatus(q.state.data?.status) ? STATUS_POLL_MS : false
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}


'use client';

import {useQuery} from '@tanstack/react-query';
import {getEmail} from '@/lib/api';
import {isActiveEmailStatus, STATUS_POLL_MS} from '@/lib/polling';

export function useEmail(id: string | undefined) {
  const query = useQuery({
    queryKey: ['emails', id],
    queryFn: () => getEmail(id as string),
    enabled: Boolean(id),
    // Poll while the email is still being processed.
    refetchInterval: (q) =>
      isActiveEmailStatus(q.state.data?.status) ? STATUS_POLL_MS : false
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}


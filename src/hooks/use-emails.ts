'use client';

import {useQuery} from '@tanstack/react-query';
import {listEmails} from '@/lib/api';
import {isActiveEmailStatus, STATUS_POLL_MS} from '@/lib/polling';

export function useEmails() {
  const query = useQuery({
    queryKey: ['emails'],
    queryFn: listEmails,
    // Poll while any email in the list is still being processed.
    refetchInterval: (q) =>
      (q.state.data ?? []).some((email) => isActiveEmailStatus(email.status))
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


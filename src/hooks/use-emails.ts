'use client';

import {useQuery} from '@tanstack/react-query';
import {listEmails} from '@/lib/api';

export function useEmails() {
  const query = useQuery({
    queryKey: ['emails'],
    queryFn: listEmails
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}


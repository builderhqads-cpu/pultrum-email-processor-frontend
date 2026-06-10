'use client';

import {useQuery} from '@tanstack/react-query';
import {getEmail} from '@/lib/api';

export function useEmail(id: string | undefined) {
  const query = useQuery({
    queryKey: ['emails', id],
    queryFn: () => getEmail(id as string),
    enabled: Boolean(id)
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch
  };
}


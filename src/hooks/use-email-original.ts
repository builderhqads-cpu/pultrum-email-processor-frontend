'use client';

import {useQuery} from '@tanstack/react-query';
import {getEmailOriginal} from '@/lib/api';

export function useEmailOriginal(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['emails', id, 'original'],
    queryFn: () => getEmailOriginal(id as string),
    enabled: Boolean(id) && enabled,
    staleTime: 5 * 60 * 1000
  });
}

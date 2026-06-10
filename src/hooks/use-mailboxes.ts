'use client';

import {useQuery} from '@tanstack/react-query';
import {ApiError, getMailboxes} from '@/lib/api';
import type {Mailbox} from '@/types';

export function useMailboxes() {
  return useQuery<Mailbox[], ApiError>({
    queryKey: ['mailboxes'],
    queryFn: () => getMailboxes(),
    staleTime: 30_000
  });
}


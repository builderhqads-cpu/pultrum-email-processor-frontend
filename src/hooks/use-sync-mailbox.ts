'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {ApiError, syncMailbox} from '@/lib/api';
import type {MailboxSyncResponse} from '@/types';

export function useSyncMailbox() {
  const queryClient = useQueryClient();

  const mutation = useMutation<MailboxSyncResponse, ApiError, string>({
    mutationFn: (mailboxId: string) => syncMailbox(mailboxId),
    onSuccess: () => {
      // Mailbox sync can import new emails and cause order processing jobs.
      void queryClient.invalidateQueries({queryKey: ['emails']});
      void queryClient.invalidateQueries({queryKey: ['orders']});
      void queryClient.invalidateQueries({queryKey: ['mailboxes']});
    }
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    error: mutation.error
  };
}

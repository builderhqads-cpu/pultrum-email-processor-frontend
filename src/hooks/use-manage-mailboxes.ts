'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {ApiError, createMailbox, deleteMailbox, updateMailbox} from '@/lib/api';
import type {DeleteMailboxResponse, Mailbox, MailboxMutationInput} from '@/types';

export function useCreateMailbox() {
  const queryClient = useQueryClient();

  const mutation = useMutation<Mailbox, ApiError, MailboxMutationInput>({
    mutationFn: (payload) => createMailbox(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['mailboxes']});
    }
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    error: mutation.error
  };
}

export function useUpdateMailbox() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Mailbox,
    ApiError,
    {mailboxId: string; payload: MailboxMutationInput}
  >({
    mutationFn: ({mailboxId, payload}) => updateMailbox(mailboxId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['mailboxes']});
    }
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    error: mutation.error
  };
}

export function useDeleteMailbox() {
  const queryClient = useQueryClient();

  const mutation = useMutation<DeleteMailboxResponse, ApiError, string>({
    mutationFn: (mailboxId) => deleteMailbox(mailboxId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['mailboxes']});
      await queryClient.invalidateQueries({queryKey: ['emails']});
      await queryClient.invalidateQueries({queryKey: ['orders']});
    }
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    error: mutation.error
  };
}

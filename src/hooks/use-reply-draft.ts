'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {ApiError, getOrderReplyDraft, sendOrderReply, updateOrderReplyDraft} from '@/lib/api';
import type {CustomerReplyDraft} from '@/types';

export function useReplyDraft(orderId: string, enabled = true) {
  return useQuery<CustomerReplyDraft, ApiError>({
    queryKey: ['orders', orderId, 'reply-draft'],
    queryFn: () => getOrderReplyDraft(orderId),
    enabled: Boolean(orderId) && enabled,
    retry: false
  });
}

export function useUpdateReplyDraft(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation<CustomerReplyDraft, ApiError, {toEmail?: string; subject?: string; body?: string}>({
    mutationFn: (input) => updateOrderReplyDraft(orderId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['orders', orderId, 'reply-draft']});
      await queryClient.invalidateQueries({queryKey: ['orders', orderId]});
      await queryClient.invalidateQueries({queryKey: ['orders']});
    }
  });
}

export function useSendReply(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ok: boolean; mocked?: boolean; messageId?: string | null}, ApiError, void>({
    mutationFn: () => sendOrderReply(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['orders', orderId, 'reply-draft']});
      await queryClient.invalidateQueries({queryKey: ['orders', orderId]});
      await queryClient.invalidateQueries({queryKey: ['orders']});
    }
  });
}


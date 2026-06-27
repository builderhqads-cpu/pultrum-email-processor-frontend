'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  ApiError,
  generateOrderAiReply,
  generateOrderReplyDraft,
  reprocessOrder,
  sendOrderXml
} from '@/lib/api';
import type {EnqueuedResponse} from '@/types';

export function useOrderActions(orderId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({queryKey: ['orders']});
    await queryClient.invalidateQueries({queryKey: ['orders', orderId]});
    await queryClient.invalidateQueries({queryKey: ['orders', orderId, 'reply-draft']});
    await queryClient.invalidateQueries({queryKey: ['emails']});
  };

  const reprocess = useMutation<EnqueuedResponse, ApiError, void>({
    mutationFn: () => reprocessOrder(orderId),
    onSuccess: invalidate
  });

  const sendAiRequest = useMutation<EnqueuedResponse, ApiError, void>({
    mutationFn: () => generateOrderReplyDraft(orderId),
    onSuccess: invalidate
  });

  const generateAiReply = useMutation<any, ApiError, void>({
    mutationFn: () => generateOrderAiReply(orderId),
    onSuccess: invalidate
  });

  const sendXml = useMutation<EnqueuedResponse, ApiError, void>({
    mutationFn: () => sendOrderXml(orderId),
    onSuccess: invalidate
  });

  return {
    reprocess: {
      ...reprocess,
      loading: reprocess.isPending,
      error: reprocess.error
    },
    sendAiRequest: {
      ...sendAiRequest,
      loading: sendAiRequest.isPending,
      error: sendAiRequest.error
    },
    generateAiReply: {
      ...generateAiReply,
      loading: generateAiReply.isPending,
      error: generateAiReply.error
    },
    sendXml: {
      ...sendXml,
      loading: sendXml.isPending,
      error: sendXml.error
    }
  };
}

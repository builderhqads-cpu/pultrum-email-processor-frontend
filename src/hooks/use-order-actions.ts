'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  ApiError,
  forceSendOrderXml,
  generateOrderAiReply,
  generateOrderReplyDraft,
  reprocessOrder,
  reprocessOrderFresh,
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

  // Renato 2026-09-28: fresh reprocess — overwrites the AI-read fields with a new
  // extraction (current customer AI instruction), preserving customer-reply data.
  const reprocessFresh = useMutation<EnqueuedResponse, ApiError, void>({
    mutationFn: () => reprocessOrderFresh(orderId),
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

  const forceSendXml = useMutation<EnqueuedResponse, ApiError, void>({
    mutationFn: () => forceSendOrderXml(orderId),
    onSuccess: invalidate
  });

  return {
    reprocess: {
      ...reprocess,
      loading: reprocess.isPending,
      error: reprocess.error
    },
    reprocessFresh: {
      ...reprocessFresh,
      loading: reprocessFresh.isPending,
      error: reprocessFresh.error
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
    },
    forceSendXml: {
      ...forceSendXml,
      loading: forceSendXml.isPending,
      error: forceSendXml.error
    }
  };
}

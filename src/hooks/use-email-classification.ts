'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {ApiError, processEmailAnyway, reclassifyEmail} from '@/lib/api';
import type {EnqueuedResponse} from '@/types';

export function useEmailClassificationActions() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({queryKey: ['emails']});
    await queryClient.invalidateQueries({queryKey: ['orders']});
  };

  const reclassify = useMutation<EnqueuedResponse, ApiError, string>({
    mutationFn: (id) => reclassifyEmail(id),
    onSuccess: invalidate
  });

  const processAnyway = useMutation<EnqueuedResponse, ApiError, string>({
    mutationFn: (id) => processEmailAnyway(id),
    onSuccess: invalidate
  });

  return {reclassify, processAnyway};
}

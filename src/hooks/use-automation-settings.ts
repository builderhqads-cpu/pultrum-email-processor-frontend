'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  ApiError,
  getAutomationSettings,
  updateAutomationSettings,
  type AutomationSettings,
  type UpdateAutomationSettings
} from '@/lib/api';

export function useAutomationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['automation-settings'],
    queryFn: getAutomationSettings
  });

  const update = useMutation<
    AutomationSettings,
    ApiError,
    UpdateAutomationSettings
  >({
    mutationFn: (payload) => updateAutomationSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['automation-settings'], data);
    }
  });

  return {
    ...query,
    loading: query.isPending,
    error: query.error,
    update
  };
}

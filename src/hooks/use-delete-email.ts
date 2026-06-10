"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, deleteEmail } from "@/lib/api";
import type { DeleteEmailResponse } from "@/types";

export function useDeleteEmail() {
  const queryClient = useQueryClient();

  const mutation = useMutation<DeleteEmailResponse, ApiError, string>({
    mutationFn: (emailId: string) => deleteEmail(emailId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["emails"] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    ...mutation,
    loading: mutation.isPending,
    error: mutation.error,
  };
}

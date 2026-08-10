"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, deleteAllEmails } from "@/lib/api";
import type { DeleteAllEmailsResponse } from "@/types";

export function useDeleteAllEmails() {
  const queryClient = useQueryClient();

  const mutation = useMutation<DeleteAllEmailsResponse, ApiError, void>({
    mutationFn: () => deleteAllEmails(),
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

"use client";

import { useQuery } from "@tanstack/react-query";
import { getMicrosoftConnectionStatus } from "@/lib/api";

export function useMicrosoftConnectionStatus() {
  return useQuery({
    queryKey: ["auth", "microsoft-status"],
    queryFn: getMicrosoftConnectionStatus,
    refetchInterval: 30_000,
  });
}

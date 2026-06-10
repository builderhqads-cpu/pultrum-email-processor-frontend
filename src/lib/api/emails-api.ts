import { apiClient, ApiError } from "./api-client";
import type {
  DeleteEmailResponse,
  EmailMessage,
  EmailMessageListItem,
  EnqueuedResponse,
} from "@/types";

export async function listEmails() {
  const { data } = await apiClient.get("/emails");
  if (!Array.isArray(data)) {
    throw new ApiError({
      message: "Unexpected response from GET /emails (expected array)",
      data,
    });
  }
  return data as EmailMessageListItem[];
}

export async function getEmail(id: string) {
  const { data } = await apiClient.get(`/emails/${id}`);
  if (!data || typeof data !== "object") {
    throw new ApiError({
      message: "Unexpected response from GET /emails/:id (expected object)",
      data,
    });
  }
  return data as EmailMessage;
}

export async function reclassifyEmail(id: string) {
  const { data } = await apiClient.post<EnqueuedResponse>(
    `/emails/${id}/reclassify`,
  );
  return data;
}

export async function processEmailAnyway(id: string) {
  const { data } = await apiClient.post<EnqueuedResponse>(
    `/emails/${id}/process-anyway`,
  );
  return data;
}

export async function deleteEmail(id: string) {
  const { data } = await apiClient.delete(`/emails/${id}`);
  if (!data || typeof data !== "object") {
    throw new ApiError({
      message: "Unexpected response from DELETE /emails/:id (expected object)",
      data,
    });
  }
  return data as DeleteEmailResponse;
}

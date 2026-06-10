import { apiClient } from "./api-client";

export type SyncMode = "MANUAL" | "AUTOMATIC";
export type DeliveryMode = "MANUAL" | "SELECTIVE" | "AUTONOMOUS";

export type AutomationSettings = {
  id: string;
  syncMode: SyncMode;
  deliveryMode: DeliveryMode;
  autoXmlConfidenceThreshold: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateAutomationSettings = Partial<
  Pick<
    AutomationSettings,
    "syncMode" | "deliveryMode" | "autoXmlConfidenceThreshold"
  >
>;

export async function getAutomationSettings() {
  const { data } = await apiClient.get<AutomationSettings>(
    "/settings/automation",
  );
  return data;
}

export async function updateAutomationSettings(
  payload: UpdateAutomationSettings,
) {
  const { data } = await apiClient.patch<AutomationSettings>(
    "/settings/automation",
    payload,
  );
  return data;
}

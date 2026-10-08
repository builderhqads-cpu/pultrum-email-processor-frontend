import { apiClient } from "./api-client";

export type SyncMode = "MANUAL" | "AUTOMATIC";
export type DeliveryMode = "MANUAL" | "SELECTIVE" | "AUTONOMOUS";

export type AutomationSettings = {
  id: string;
  syncMode: SyncMode;
  deliveryMode: DeliveryMode;
  autoXmlConfidenceThreshold: number;
  // XML-sent confirmation reply (Niek 2026-10-07) — editable template.
  // Base Subject/Body = Dutch (default); En/De are optional per-language
  // overrides, chosen by the customer e-mail language (Renato 2026-10-08).
  xmlConfirmationEnabled?: boolean;
  xmlConfirmationSubject?: string | null;
  xmlConfirmationBody?: string | null;
  xmlConfirmationSubjectEn?: string | null;
  xmlConfirmationBodyEn?: string | null;
  xmlConfirmationSubjectDe?: string | null;
  xmlConfirmationBodyDe?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateAutomationSettings = Partial<
  Pick<
    AutomationSettings,
    | "syncMode"
    | "deliveryMode"
    | "autoXmlConfidenceThreshold"
    | "xmlConfirmationEnabled"
    | "xmlConfirmationSubject"
    | "xmlConfirmationBody"
    | "xmlConfirmationSubjectEn"
    | "xmlConfirmationBodyEn"
    | "xmlConfirmationSubjectDe"
    | "xmlConfirmationBodyDe"
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

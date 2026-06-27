import {apiClient, ApiError} from './api-client';
import type {
  EnqueuedResponse,
  OrderStatus,
  OrderType,
  Department,
  CustomerReplyDraft,
  TransportOrder,
  TransportOrderDetailResponse,
  TransportOrderListItem
} from '@/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeOrder(input: Partial<TransportOrder> & {id?: unknown}): TransportOrder {
  const id = typeof input.id === 'string' ? input.id : String(input.id ?? '');

  return {
    id,
    emailMessageId: typeof input.emailMessageId === 'string' ? input.emailMessageId : String(input.emailMessageId ?? ''),
    department: (input.department ?? 'UNKNOWN') as Department,
    type: (input.type ?? 'UNKNOWN') as OrderType,
    status: (input.status ?? 'UNKNOWN') as OrderStatus,
    customerEmail: typeof input.customerEmail === 'string' ? input.customerEmail : String(input.customerEmail ?? ''),
    customerName: input.customerName ?? null,
    originalOrderReference: input.originalOrderReference ?? null,
    overallConfidence: typeof input.overallConfidence === 'number' ? input.overallConfidence : input.overallConfidence ?? null,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : '',
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : undefined,
    fields: asArray(input.fields),
    missingFields: asArray(input.missingFields),
    validationWarnings: asArray(input.validationWarnings),
    aiRequests: asArray(input.aiRequests),
    xmlDeliveries: asArray(input.xmlDeliveries)
  };
}

export async function listOrders() {
  const {data} = await apiClient.get('/orders');
  if (!Array.isArray(data)) {
    throw new ApiError({
      message: 'Unexpected response from GET /orders (expected array)',
      data
    });
  }
  return data as TransportOrderListItem[];
}

export async function getOrder(id: string) {
  const {data} = await apiClient.get(`/orders/${id}`);
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Unexpected response from GET /orders/:id (expected object)',
      data
    });
  }

  // Support both legacy response shape (order object) and the current shape:
  // { order, fields, missingFields, email, aiRequests, xmlDeliveries }.
  const record = data as Record<string, unknown>;
  if ('order' in record && isRecord(record.order)) {
    const payload = data as TransportOrderDetailResponse;
    const order = payload.order as Partial<TransportOrder>;

    return normalizeOrder({
      ...order,
      fields: asArray(payload.fields),
      missingFields: asArray(payload.missingFields),
      validationWarnings: asArray(payload.validationWarnings),
      aiRequests: asArray(payload.aiRequests),
      xmlDeliveries: asArray(payload.xmlDeliveries)
    });
  }

  const legacy = data as Partial<TransportOrder>;
  return normalizeOrder(legacy);
}

export async function reprocessOrder(id: string) {
  const {data} = await apiClient.post<EnqueuedResponse>(`/orders/${id}/reprocess`);
  return data;
}

export async function getOrderXmlPreview(id: string) {
  const {data} = await apiClient.get<{xml: string}>(`/orders/${id}/xml-preview`);
  return data;
}

export async function sendOrderAiRequest(id: string) {
  const {data} = await apiClient.post<EnqueuedResponse>(`/orders/${id}/send-ai-request`);
  return data;
}

export async function generateOrderReplyDraft(id: string) {
  const {data} = await apiClient.post<EnqueuedResponse>(`/orders/${id}/generate-reply-draft`);
  return data;
}

export async function generateOrderAiReply(id: string) {
  const {data} = await apiClient.post<CustomerReplyDraft>(`/orders/${id}/generate-ai-reply`);
  return data;
}

export async function sendOrderXml(id: string) {
  const {data} = await apiClient.post<EnqueuedResponse>(`/orders/${id}/send-xml`);
  return data;
}

export async function getOrderReplyDraft(id: string) {
  const {data} = await apiClient.get<CustomerReplyDraft>(`/orders/${id}/reply-draft`);
  return data;
}

export async function updateOrderReplyDraft(
  id: string,
  input: {toEmail?: string; subject?: string; body?: string}
) {
  const {data} = await apiClient.put<CustomerReplyDraft>(`/orders/${id}/reply-draft`, input);
  return data;
}

export async function sendOrderReply(id: string) {
  const {data} = await apiClient.post<{ok: boolean; mocked?: boolean; messageId?: string | null}>(
    `/orders/${id}/send-reply`
  );
  return data;
}

import type {OrderStatus, TransportOrderListItem} from '@/types';

export const queueStatusMap = {
  all: [] as OrderStatus[],
  waiting: ['WAITING_CUSTOMER_RESPONSE', 'MISSING_INFORMATION'] as OrderStatus[],
  ready: ['READY_TO_XML'] as OrderStatus[],
  processing: ['AI_PROCESSING', 'PROCESSING'] as OrderStatus[],
  sent: ['SENT_TO_CREATIVE_GEARS', 'CREATIVE_GEARS_ACCEPTED'] as OrderStatus[],
  error: ['FAILED', 'CREATIVE_GEARS_REJECTED'] as OrderStatus[]
} as const;

export const queueTabKeys = [
  'all',
  'waiting',
  'ready',
  'processing',
  'sent',
  'error',
  'today'
] as const;

export type QueueTabKey = (typeof queueTabKeys)[number];

export function isQueueTabKey(value: string | null): value is QueueTabKey {
  return value != null && (queueTabKeys as readonly string[]).includes(value);
}

export function getOrderLastUpdated(item: TransportOrderListItem) {
  return item.updatedAt || item.createdAt;
}

export function getOrderOperationalPriority(status: OrderStatus) {
  if (queueStatusMap.error.includes(status)) return 1;
  if (queueStatusMap.waiting.includes(status)) return 2;
  if (queueStatusMap.ready.includes(status)) return 3;
  if (queueStatusMap.processing.includes(status)) return 4;
  return 5;
}

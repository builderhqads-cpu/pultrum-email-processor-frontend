import type {EmailStatus, OrderStatus} from '@/types';

/** How often to refetch while something is actively being processed. */
export const STATUS_POLL_MS = 5000;

// Order statuses that are transient (the pipeline is expected to move them on
// its own). While in these, we poll so the UI updates without a manual reload.
// Statuses that wait on a human/customer (MISSING_INFORMATION,
// WAITING_CUSTOMER_RESPONSE, MANUAL_REVIEW) or are final
// (CREATIVE_GEARS_ACCEPTED/REJECTED, FAILED) are intentionally excluded.
const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  'EMAIL_RECEIVED',
  'PROCESSING',
  'AI_PROCESSING',
  'NEW_ORDER',
  'MODIFICATION_DETECTED',
  'READY_TO_XML',
  'XML_GENERATED',
  'SENT_TO_CREATIVE_GEARS'
]);

const ACTIVE_EMAIL_STATUSES = new Set<EmailStatus>(['RECEIVED', 'PROCESSING']);

export function isActiveOrderStatus(status: string | null | undefined) {
  return Boolean(status && ACTIVE_ORDER_STATUSES.has(status as OrderStatus));
}

export function isActiveEmailStatus(status: string | null | undefined) {
  return Boolean(status && ACTIVE_EMAIL_STATUSES.has(status as EmailStatus));
}

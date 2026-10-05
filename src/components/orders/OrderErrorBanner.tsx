'use client';

import {useMemo} from 'react';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';
import {AlertTriangle, RefreshCw} from 'lucide-react';

import {useOrderActions} from '@/hooks/use-order-actions';
import {Button} from '@/components/ui/button';
import type {TransportOrder} from '@/types';

type ErrorKind = 'ai' | 'xml' | 'rejected' | 'generic';

function toTime(value: string | null | undefined) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Error visibility + one-click retry (Renato 2026-10-05). When an order ends in
 * a failure the planner should SEE why (AI extraction failed, XML delivery
 * failed, Creative Gears rejected) and be able to retry without hunting through
 * the actions list — the exact pain from the router-timeout incident. The retry
 * reuses the normal reprocess so it goes back through the whole pipeline.
 */
export function OrderErrorBanner({
  order,
  orderId,
  onRetry
}: {
  order: TransportOrder;
  orderId: string;
  onRetry: () => Promise<unknown> | unknown;
}) {
  const t = useTranslations('orders.detail.errorBanner');
  const actions = useOrderActions(orderId);

  const problem = useMemo(() => resolveProblem(order), [order]);

  if (!problem) return null;

  // Smart retry (Renato 2026-10-05): the right action depends on WHERE it broke.
  // A delivery that failed/was rejected already has a valid XML — resending it
  // (after the planner fixes a field) is the fix. An AI/pipeline failure needs
  // the whole order reprocessed.
  const mode: 'resend' | 'reprocess' =
    problem.kind === 'xml' || problem.kind === 'rejected' ? 'resend' : 'reprocess';
  const action = mode === 'resend' ? actions.sendXml : actions.reprocess;

  async function retry() {
    const toastId = toast.loading(mode === 'resend' ? t('resending') : t('retrying'));
    try {
      await action.mutateAsync();
      toast.success(mode === 'resend' ? t('resendQueued') : t('retryQueued'), {id: toastId});
      await onRetry();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? t('retryError'), {id: toastId});
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 space-y-1">
            <div className="text-sm font-semibold text-destructive">
              {t(`kind.${problem.kind}`)}
            </div>
            {problem.message ? (
              <div className="whitespace-pre-wrap break-words text-sm text-foreground/80 [overflow-wrap:anywhere]">
                {problem.message}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{t('noMessage')}</div>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={action.loading}
          onClick={retry}
        >
          <RefreshCw className={`h-4 w-4 ${action.loading ? 'animate-spin' : ''}`} />
          {mode === 'resend' ? t('resend') : t('retry')}
        </Button>
      </div>
    </div>
  );
}

/** Pick the most relevant failure to surface, or null when the order is fine. */
function resolveProblem(
  order: TransportOrder
): {kind: ErrorKind; message: string | null} | null {
  const aiFailed = (order.aiExtraction?.status || '').toUpperCase() === 'FAILED';

  const latestXml = [...order.xmlDeliveries].sort(
    (a, b) =>
      toTime(b.sentAt || b.updatedAt || b.createdAt) -
      toTime(a.sentAt || a.updatedAt || a.createdAt)
  )[0];
  const xmlStatus = (latestXml?.status || '').toUpperCase();

  // Creative Gears rejected the XML: show the rejection reason.
  if (xmlStatus === 'REJECTED' || order.status === 'CREATIVE_GEARS_REJECTED') {
    return {kind: 'rejected', message: latestXml?.errorMessage ?? null};
  }
  // XML delivery failed outright (transport/endpoint error).
  if (xmlStatus === 'FAILED') {
    return {kind: 'xml', message: latestXml?.errorMessage ?? null};
  }
  // AI extraction failed (e.g. router timeout / credit error).
  if (aiFailed) {
    return {kind: 'ai', message: order.aiExtraction?.reason ?? null};
  }
  // Pipeline ended in FAILED without a more specific signal.
  if (order.status === 'FAILED') {
    return {kind: 'generic', message: order.aiExtraction?.reason ?? null};
  }
  return null;
}

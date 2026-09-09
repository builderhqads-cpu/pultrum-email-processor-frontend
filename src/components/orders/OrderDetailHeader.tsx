'use client';

import {ChevronLeft, ChevronRight, ChevronsUpDown, Layers} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';

import {Link, useRouter} from '@/i18n/navigation';
import {PageHeader} from '@/components/layout/PageHeader';
import {Badge} from '@/components/ui/badge';
import {Button, buttonVariants} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {cn} from '@/lib/utils';
import type {Locale} from '@/i18n/routing';
import type {TransportOrder} from '@/types';

function shortId(id: string) {
  return id.split('-')[0] ?? id.slice(0, 8);
}

export function OrderDetailHeader({
  order,
  orderId
}: {
  orderId: string;
  order?: TransportOrder;
}) {
  const tOrders = useTranslations('orders');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const batch = batchLabels[locale] ?? batchLabels.en;

  // Niek: show the factuurreferentie as the order's reference (not the TR-number).
  const invoiceReference =
    order?.fields?.find((f) => f.key === 'invoice_reference')?.value || null;

  return (
    <PageHeader
      backLink={{href: '/orders', label: tOrders('detail.backToOrders')}}
      title={`${tOrders('detailTitle')} #${shortId(orderId)}`}
      subtitle={
        order ? (
          <div className="min-w-0 space-y-1">
            <div className="truncate" title={order.customerEmail || tCommon('na')}>
              {order.customerEmail || tCommon('na')}
            </div>
            {invoiceReference ? (
              <div
                className="truncate font-mono text-xs font-medium text-foreground"
                title={invoiceReference}
              >
                {invoiceReference}
              </div>
            ) : null}
            {order.batch ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <BatchNav
                  batch={order.batch}
                  currentOrderId={orderId}
                  indicator={batch.indicator}
                  pickerItem={batch.pickerItem}
                />
                {order.batch.subject ? (
                  <span
                    className="min-w-0 truncate text-xs font-medium text-foreground"
                    title={order.batch.subject}
                  >
                    {order.batch.subject}
                  </span>
                ) : null}
                {order.externalReference ? (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {order.externalReference}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="break-all font-mono text-xs [overflow-wrap:anywhere]">{orderId}</div>
          </div>
        ) : (
          <span className="break-all font-mono text-xs [overflow-wrap:anywhere]">{orderId}</span>
        )
      }
      status={order ? <StatusBadge status={order.status ?? tCommon('na')} /> : null}
      actions={
        order?.emailMessageId ? (
          <Link
            href={`/emails?selected=${order.emailMessageId}`}
            className={buttonVariants({variant: 'outline', size: 'sm'})}
          >
            {tOrders('detail.openOriginalEmail')}
          </Link>
        ) : null
      }
    />
  );
}

type BatchInfo = NonNullable<TransportOrder['batch']>;

/**
 * Batch navigation: prev/next between the batch's orders plus a picker to jump to
 * any of them. When the batch has a single order it renders just the badge.
 */
function BatchNav({
  batch,
  currentOrderId,
  indicator,
  pickerItem
}: {
  batch: BatchInfo;
  currentOrderId: string;
  indicator: (seq: number | null, total: number) => string;
  pickerItem: (seq: number | null) => string;
}) {
  const router = useRouter();
  const orders = batch.orders ?? [];
  const idx = orders.findIndex((o) => o.id === currentOrderId);
  const prev = idx > 0 ? orders[idx - 1] : null;
  const next = idx >= 0 && idx < orders.length - 1 ? orders[idx + 1] : null;

  if (orders.length <= 1) {
    return (
      <Badge
        variant="outline"
        className="shrink-0 gap-1 border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300"
      >
        <Layers className="h-3.5 w-3.5" />
        {indicator(batch.sequence, batch.total)}
      </Badge>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {prev ? (
        <Link
          href={`/orders/${prev.id}`}
          aria-label="previous order"
          className={buttonVariants({variant: 'outline', size: 'icon-sm'})}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <Button variant="outline" size="icon-sm" disabled aria-label="previous order">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300"
            />
          }
        >
          <Layers className="h-3.5 w-3.5" />
          {indicator(batch.sequence, batch.total)}
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-80 min-w-[20rem] overflow-y-auto overflow-x-hidden"
        >
          {orders.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onClick={() => router.push(`/orders/${o.id}`)}
              className={cn(
                'flex items-center justify-between gap-4 text-xs',
                o.id === currentOrderId && 'font-semibold'
              )}
            >
              <span className="whitespace-nowrap">{pickerItem(o.sequence)}</span>
              {o.reference ? (
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {o.reference}
                </span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {next ? (
        <Link
          href={`/orders/${next.id}`}
          aria-label="next order"
          className={buttonVariants({variant: 'outline', size: 'icon-sm'})}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <Button variant="outline" size="icon-sm" disabled aria-label="next order">
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

const batchLabels: Record<
  Locale,
  {
    indicator: (seq: number | null, total: number) => string;
    pickerItem: (seq: number | null) => string;
  }
> = {
  pt: {
    indicator: (seq, total) => `Ordem ${seq ?? '?'} de ${total}`,
    pickerItem: (seq) => `Ordem ${seq ?? '?'}`
  },
  en: {
    indicator: (seq, total) => `Order ${seq ?? '?'} of ${total}`,
    pickerItem: (seq) => `Order ${seq ?? '?'}`
  },
  nl: {
    indicator: (seq, total) => `Order ${seq ?? '?'} van ${total}`,
    pickerItem: (seq) => `Order ${seq ?? '?'}`
  }
};

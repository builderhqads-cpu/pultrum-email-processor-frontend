'use client';

import {Layers} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';

import {Link} from '@/i18n/navigation';
import {PageHeader} from '@/components/layout/PageHeader';
import {Badge} from '@/components/ui/badge';
import {buttonVariants} from '@/components/ui/button';
import {StatusBadge} from '@/components/ui/StatusBadge';
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
                <Badge variant="outline" className="shrink-0 gap-1 border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300">
                  <Layers className="h-3.5 w-3.5" />
                  {batch.indicator(order.batch.sequence, order.batch.total)}
                </Badge>
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

const batchLabels: Record<
  Locale,
  {indicator: (seq: number | null, total: number) => string}
> = {
  pt: {indicator: (seq, total) => `Ordem ${seq ?? '?'} de ${total}`},
  en: {indicator: (seq, total) => `Order ${seq ?? '?'} of ${total}`},
  nl: {indicator: (seq, total) => `Order ${seq ?? '?'} van ${total}`}
};

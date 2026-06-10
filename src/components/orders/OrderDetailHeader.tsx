'use client';

import {useTranslations} from 'next-intl';

import {Link} from '@/i18n/navigation';
import {PageHeader} from '@/components/layout/PageHeader';
import {buttonVariants} from '@/components/ui/button';
import {StatusBadge} from '@/components/ui/StatusBadge';
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

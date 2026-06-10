import {Link} from '@/i18n/navigation';
import {buttonVariants} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {useTranslations} from 'next-intl';

// Placeholder data until API integration.
const stubOrders = [
  {id: '10001'},
  {id: '10002'},
  {id: '10003'}
];

export function OrdersListStub() {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('orders.stubTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stubOrders.map((order) => (
          <div key={order.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {t('orders.detailTitle')} #{order.id}
              </div>
            </div>
            <Link
              href={`/orders/${order.id}`}
              className={cn(buttonVariants({variant: 'secondary', size: 'sm'}))}
            >
              {t('common.open')}
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useTranslations} from 'next-intl';

export function OrderDetailStub({id}: {id: string}) {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('orders.stubTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {t('orders.stubDetails')} <span className="font-mono">{id}</span>.
      </CardContent>
    </Card>
  );
}

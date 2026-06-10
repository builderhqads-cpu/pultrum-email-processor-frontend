import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useTranslations} from 'next-intl';

export function DashboardOverviewStub() {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.stubTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {t('dashboard.stubDetails')}
      </CardContent>
    </Card>
  );
}

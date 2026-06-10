import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useTranslations} from 'next-intl';

export function EmailsListStub() {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('emails.stubTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {t('emails.stubDetails')}
      </CardContent>
    </Card>
  );
}

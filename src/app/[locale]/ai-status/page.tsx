import {getTranslations, setRequestLocale} from 'next-intl/server';
import {PageHeader} from '@/components/layout/PageHeader';
import {AiStatusScreen} from '@/components/settings/AiStatusScreen';
import type {Locale} from '@/i18n/routing';

export default async function AiStatusPage({
  params
}: {
  params: Promise<{locale: Locale}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations({locale, namespace: 'navigation'});

  return (
    <div className="mx-auto min-w-0 w-full space-y-6">
      <PageHeader title={t('aiStatus')} />
      <AiStatusScreen />
    </div>
  );
}

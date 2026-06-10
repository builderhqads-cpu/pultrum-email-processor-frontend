import {getTranslations, setRequestLocale} from 'next-intl/server';
import {PageHeader} from '@/components/layout/PageHeader';
import {SettingsScreen} from '@/components/settings/SettingsScreen';

export default async function SettingsPage(props: PageProps<'/[locale]/settings'>) {
  const {locale} = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations({locale, namespace: 'settings'});

  return (
    <div className="mx-auto min-w-0 w-full space-y-6">
      <PageHeader title={t('title')} />
      <SettingsScreen />
    </div>
  );
}

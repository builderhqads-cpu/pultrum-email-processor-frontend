import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';

import {EmailDetailsView} from '@/components/emails/EmailDetailsView';

export default async function EmailDetailsPage(
  props: PageProps<'/[locale]/emails/[id]'>
) {
  const {locale, id} = await props.params;
  setRequestLocale(locale);

  if (!id) notFound();

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl space-y-6">
      <EmailDetailsView id={id} />
    </div>
  );
}

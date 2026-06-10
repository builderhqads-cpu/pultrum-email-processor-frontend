import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {OrderDetailsView} from '@/components/orders/OrderDetailsView';

export default async function OrderDetailsPage(
  props: PageProps<'/[locale]/orders/[id]'>
) {
  const {locale, id} = await props.params;
  setRequestLocale(locale);

  if (!id) notFound();

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1500px] space-y-6">
      <OrderDetailsView id={id} />
    </div>
  );
}

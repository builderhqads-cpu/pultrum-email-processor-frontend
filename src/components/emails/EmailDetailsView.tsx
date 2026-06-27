'use client';

import {useLocale, useTranslations} from 'next-intl';

import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {useEmail} from '@/hooks/use-email';
import {PageHeader} from '@/components/layout/PageHeader';
import {EmailDetailsCard} from '@/components/emails/EmailDetailsCard';
import {BatchOrdersCard} from '@/components/emails/BatchOrdersCard';
import {OrderActionsBar} from '@/components/orders/OrderActionsBar';
import {Button, buttonVariants} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {formatDateTime} from '@/components/orders/order-detail-utils';

function shortId(id: string) {
  return id.split('-')[0] ?? id.slice(0, 8);
}

export function EmailDetailsView({id}: {id: string}) {
  const t = useTranslations('emails.detail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const email = useEmail(id);

  if (email.loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <div className="rounded-2xl border bg-background/90 px-4 py-4 shadow-sm sm:px-5">
            <div className="space-y-3">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {tCommon('loading')}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (email.error) {
    return (
      <div className="space-y-6">
        <PageHeader backLink={{href: '/emails', label: t('backToEmails')}} title={t('title')} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('errorTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">{String(email.error.message)}</div>
            <Button onClick={() => email.refetch()}>{tCommon('tryAgain')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!email.data) {
    return (
      <div className="space-y-6">
        <PageHeader backLink={{href: '/emails', label: t('backToEmails')}} title={t('title')} />

        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('empty')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const linkedOrder = email.data.order;
  const batch = email.data.batch;

  return (
    <div className="space-y-6">
      <PageHeader
        backLink={{href: '/emails', label: t('backToEmails')}}
        title={email.data.subject || t('title')}
        subtitle={
          <div className="min-w-0 space-y-1">
            <div className="truncate" title={email.data.fromEmail || tCommon('na')}>
              {email.data.fromEmail || tCommon('na')}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(email.data.receivedAt, locale)}
            </div>
            <div className="break-all font-mono text-xs [overflow-wrap:anywhere]">{id}</div>
          </div>
        }
        status={<StatusBadge status={email.data.status ?? tCommon('na')} />}
        actions={
          linkedOrder ? (
            <Link
              href={`/orders/${linkedOrder.id}`}
              className={buttonVariants({variant: 'outline', size: 'sm'})}
            >
              {t('openLinkedOrder')} #{shortId(linkedOrder.id)}
            </Link>
          ) : null
        }
      />

      {linkedOrder ? (
        <OrderActionsBar
          orderId={linkedOrder.id}
          canSendXml={linkedOrder.status === 'READY_TO_XML'}
          onAfterAction={() => email.refetch()}
        />
      ) : null}

      {batch && email.data.orders?.length ? (
        <BatchOrdersCard
          batch={batch}
          orders={email.data.orders}
          locale={locale}
        />
      ) : null}

      <EmailDetailsCard email={email.data} />
    </div>
  );
}

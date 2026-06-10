'use client';

import {useMemo, type ComponentType} from 'react';
import {useLocale, useMessages, useTranslations} from 'next-intl';
import {
  Bot,
  ChevronRight,
  Inbox,
  Send,
  TriangleAlert,
  UserRoundSearch,
  Workflow
} from 'lucide-react';

import {useEmails} from '@/hooks/use-emails';
import {useOrders} from '@/hooks/use-orders';
import {useMounted} from '@/hooks/use-mounted';
import {PageHeader} from '@/components/layout/PageHeader';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {Link, useRouter} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import type {EmailMessageListItem, TransportOrderListItem} from '@/types';
import {Skeleton} from '@/components/ui/skeleton';
import {EmptyState} from '@/components/ui/empty-state';
import {getMessageString, type Messages} from '@/i18n/message-utils';
import {getOrderLastUpdated, getOrderOperationalPriority, queueStatusMap} from '@/lib/order-queue';
import {cn} from '@/lib/utils';

function shortId(id: string) {
  return id.split('-')[0] ?? id.slice(0, 8);
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function isToday(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const messages = useMessages() as Messages;
  const locale = useLocale() as Locale;
  const router = useRouter();

  const emails = useEmails();
  const orders = useOrders();
  const mounted = useMounted();

  const emailsById = useMemo(() => {
    const list = (emails.data ?? []) as EmailMessageListItem[];
    return new Map(list.map((email) => [email.id, email]));
  }, [emails.data]);

  const stats = useMemo(() => {
    const emailsData = emails.data ?? [];
    const ordersData = orders.data ?? [];

    const waitingCustomer = ordersData.filter((o) => queueStatusMap.waiting.includes(o.status)).length;
    const readyToXml = ordersData.filter((o) => o.status === 'READY_TO_XML').length;
    const sentToCreativeGears = ordersData.filter((o) =>
      queueStatusMap.sent.includes(o.status)
    ).length;
    const processingAi = ordersData.filter((o) => queueStatusMap.processing.includes(o.status)).length;
    const errors = ordersData.filter((o) => queueStatusMap.error.includes(o.status)).length;
    const emailsReceivedToday = emailsData.filter((email) => isToday(email.receivedAt)).length;

    return {
      waitingCustomer,
      readyToXml,
      processingAi,
      sentToCreativeGears,
      errors,
      emailsReceivedToday
    };
  }, [emails.data, orders.data]);

  const workQueue = useMemo(() => {
    const list = (orders.data ?? []) as TransportOrderListItem[];

    return [...list]
      .sort((a, b) => {
        const priorityDiff = getOrderOperationalPriority(a.status) - getOrderOperationalPriority(b.status);
        if (priorityDiff !== 0) return priorityDiff;

        const aTime = new Date(getOrderLastUpdated(a)).getTime();
        const bTime = new Date(getOrderLastUpdated(b)).getTime();
        return bTime - aTime;
      })
      .slice(0, 25);
  }, [orders.data]);

  const hasError = Boolean(emails.error || orders.error);
  const isLoading = emails.loading || orders.loading;

  async function refetchAll() {
    await Promise.all([emails.refetch(), orders.refetch()]);
  }

  return (
    <div className="mx-auto flex min-w-0 w-full flex-col gap-5">
      <PageHeader
        title={t('title')}
        actions={
          <Button variant="outline" size="sm" onClick={refetchAll} disabled={!mounted || isLoading}>
            {tCommon('refetch')}
          </Button>
        }
      />

      {hasError ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('errors.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {emails.error ? <div>{String(emails.error.message)}</div> : null}
              {orders.error ? <div>{String(orders.error.message)}</div> : null}
            </div>
            <div>
              <Button onClick={refetchAll}>{tCommon('tryAgain')}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Compact metric banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCell
          title={t('cards.waitingCustomer')}
          value={stats.waitingCustomer}
          href="/orders?queue=waiting"
          loading={isLoading}
          icon={UserRoundSearch}
          tone="warning"
          actionLabel={tCommon('open')}
        />
        <MetricCell
          title={t('cards.readyToXml')}
          value={stats.readyToXml}
          href="/orders?queue=ready"
          loading={isLoading}
          icon={Workflow}
          tone="success"
          actionLabel={tCommon('open')}
        />
        <MetricCell
          title={t('cards.processingAi')}
          value={stats.processingAi}
          href="/orders?queue=processing"
          loading={isLoading}
          icon={Bot}
          tone="info"
          actionLabel={tCommon('open')}
        />
        <MetricCell
          title={t('cards.errors')}
          value={stats.errors}
          href="/orders?queue=error"
          loading={isLoading}
          icon={TriangleAlert}
          tone="danger"
          actionLabel={tCommon('open')}
        />
        <MetricCell
          title={t('cards.sentToCreativeGears')}
          value={stats.sentToCreativeGears}
          href="/orders?queue=sent"
          loading={isLoading}
          icon={Send}
          tone="violet"
          actionLabel={tCommon('open')}
        />
        <MetricCell
          title={t('cards.emailsReceivedToday')}
          value={stats.emailsReceivedToday}
          href="/orders?queue=today"
          loading={isLoading}
          icon={Inbox}
          tone="slate"
          actionLabel={tCommon('open')}
        />
      </div>

      {/* Expanded work queue (triage) */}
      <Card className="flex min-h-[60vh] min-w-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">{t('workQueue.title')}</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 flex-1 overflow-auto">
          <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
            <colgroup>
              <col className="w-[88px]" />
              <col className="w-[22%]" />
              <col className="w-[28%]" />
              <col className="w-[140px]" />
              <col className="w-[16%]" />
              <col className="w-[150px]" />
              <col className="w-[52px]" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.04em] text-muted-foreground">
                <th className="border-b px-3 py-2 font-semibold">{t('workQueue.columns.id')}</th>
                <th className="border-b px-3 py-2 font-semibold">{t('workQueue.columns.customer')}</th>
                <th className="border-b px-3 py-2 font-semibold">{t('workQueue.columns.subject')}</th>
                <th className="border-b px-3 py-2 font-semibold">{t('workQueue.columns.aiConfidence')}</th>
                <th className="border-b px-3 py-2 font-semibold">{t('workQueue.columns.status')}</th>
                <th className="border-b px-3 py-2 font-semibold">{t('workQueue.columns.updatedAt')}</th>
                <th className="border-b px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {workQueue.map((order) => {
                const relatedEmail = order.emailMessageId ? emailsById.get(order.emailMessageId) : undefined;
                const href = `/orders/${order.id}`;

                return (
                  <tr
                    key={order.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(href)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(href);
                      }
                    }}
                    className="cursor-pointer outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/60"
                  >
                    <td className="border-b px-3 py-2 font-mono text-xs">{shortId(order.id)}</td>
                    <td className="border-b px-3 py-2">
                      <div className="truncate font-medium" title={order.customerEmail || tCommon('na')}>
                        {order.customerEmail || tCommon('na')}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {order.department
                          ? getMessageString(messages, `enums.department.${order.department}`) ?? order.department
                          : tCommon('na')}
                      </div>
                    </td>
                    <td className="border-b px-3 py-2">
                      <div className="truncate" title={relatedEmail?.subject || tCommon('na')}>
                        {relatedEmail?.subject || tCommon('na')}
                      </div>
                      <div className="truncate text-xs text-muted-foreground" title={relatedEmail?.fromEmail || tCommon('na')}>
                        {relatedEmail?.fromEmail || tCommon('na')}
                      </div>
                    </td>
                    <td className="border-b px-3 py-2">
                      <ConfidenceBar value={order.overallConfidence} />
                    </td>
                    <td className="border-b px-3 py-2">
                      <div className="min-w-0">
                        <StatusBadge status={order.status ?? tCommon('na')} />
                      </div>
                    </td>
                    <td className="border-b px-3 py-2 text-xs text-muted-foreground">
                      {formatDateTime(getOrderLastUpdated(order), locale)}
                    </td>
                    <td className="border-b px-3 py-2 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
              {!workQueue.length && !isLoading ? (
                <tr>
                  <td className="px-3 py-6" colSpan={7}>
                    <EmptyState
                      icon={Inbox}
                      title={t('workQueue.title')}
                      description={t('workQueue.empty')}
                      className="border-0 bg-transparent py-4 shadow-none"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfidenceBar({value}: {value: number | null}) {
  if (value == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const ratio = Math.max(0, Math.min(1, value));

  return (
    <div className="inline-flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-violet-500" style={{width: `${ratio * 100}%`}} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
    </div>
  );
}

function MetricCell({
  title,
  value,
  href,
  loading,
  icon: Icon,
  tone,
  actionLabel
}: {
  title: string;
  value: number;
  href: string;
  loading: boolean;
  icon: ComponentType<{className?: string}>;
  tone: 'warning' | 'success' | 'info' | 'danger' | 'violet' | 'slate';
  actionLabel: string;
}) {
  const toneClassName = {
    warning:
      'border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/20',
    success:
      'border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-emerald-950/20',
    info: 'border-sky-200 bg-sky-50 hover:border-sky-300 dark:border-sky-900/40 dark:bg-sky-950/20',
    danger:
      'border-rose-200 bg-rose-50 hover:border-rose-300 dark:border-rose-900/40 dark:bg-rose-950/20',
    violet:
      'border-violet-200 bg-violet-50 hover:border-violet-300 dark:border-violet-900/40 dark:bg-violet-950/20',
    slate:
      'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/30'
  }[tone];

  return (
    <Link
      href={href}
      className={cn('block rounded-xl border p-3 transition-colors', toneClassName)}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      {loading ? (
        <Skeleton className="mt-1.5 h-7 w-10" />
      ) : (
        <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
      )}
      <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{actionLabel}</div>
    </Link>
  );
}

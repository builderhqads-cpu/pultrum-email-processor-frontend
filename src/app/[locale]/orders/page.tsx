'use client';

import {Fragment, useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {ChevronRight, ExternalLink, MoreHorizontal, PackageSearch, Search} from 'lucide-react';
import {useLocale, useMessages, useTranslations} from 'next-intl';

import type {Locale} from '@/i18n/routing';
import {usePathname, useRouter} from '@/i18n/navigation';
import {useOrders} from '@/hooks/use-orders';
import {useEmails} from '@/hooks/use-emails';
import {useMounted} from '@/hooks/use-mounted';
import type {Department, EmailMessageListItem, TransportOrderListItem} from '@/types';

import {PageHeader} from '@/components/layout/PageHeader';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Pagination} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {Skeleton} from '@/components/ui/skeleton';
import {EmptyState} from '@/components/ui/empty-state';
import {getMessageString, type Messages} from '@/i18n/message-utils';
import {getOrderLastUpdated, isQueueTabKey, type QueueTabKey, queueStatusMap, queueTabKeys} from '@/lib/order-queue';
import {cn} from '@/lib/utils';

const departmentValues = ['OPEN_TRANSPORT', 'STUK_GOED'] as const;

function isDepartmentValue(value: string): value is Department {
  return (departmentValues as readonly string[]).includes(value);
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

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

function getRowAccent(status: string) {
  if (status === 'WAITING_CUSTOMER_RESPONSE' || status === 'MISSING_INFORMATION') {
    return 'border-l-2 border-l-yellow-400';
  }
  if (status === 'READY_TO_XML' || status === 'CREATIVE_GEARS_ACCEPTED') {
    return 'border-l-2 border-l-emerald-400';
  }
  if (status === 'FAILED' || status === 'CREATIVE_GEARS_REJECTED') {
    return 'border-l-2 border-l-destructive/70';
  }
  if (status === 'AI_PROCESSING' || status === 'PROCESSING') {
    return 'border-l-2 border-l-sky-400';
  }
  return 'border-l-2 border-l-transparent';
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

function humanizeAction(action: string) {
  const lower = action.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function ConfidenceCell({value}: {value: number | null}) {
  if (value == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const ratio = Math.max(0, Math.min(1, value));
  // Green for strong confidence (>= 0.80), amber below.
  const barColor = value >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500';
  const textColor = value >= 0.8 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300';

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', barColor)} style={{width: `${ratio * 100}%`}} />
      </div>
      <span className={cn('text-xs font-medium tabular-nums', textColor)}>{value.toFixed(2)}</span>
    </div>
  );
}

export default function OrdersPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const messages = useMessages() as Messages;
  const uiLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orders = useOrders();
  const emails = useEmails();
  const mounted = useMounted();

  const [q, setQ] = useState('');
  const [department, setDepartment] = useState<'all' | Department>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const queueTab = useMemo<QueueTabKey>(() => {
    const rawQueue = searchParams.get('queue');
    return isQueueTabKey(rawQueue) ? rawQueue : 'all';
  }, [searchParams]);

  const emailsById = useMemo(() => {
    const list = (emails.data ?? []) as EmailMessageListItem[];
    return new Map(list.map((email) => [email.id, email]));
  }, [emails.data]);

  // How many orders each batch produced, so the list can show "12/20" (Niek).
  const batchTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of (orders.data ?? []) as TransportOrderListItem[]) {
      if (item.batchImportId) {
        map.set(item.batchImportId, (map.get(item.batchImportId) ?? 0) + 1);
      }
    }
    return map;
  }, [orders.data]);

  const baseFiltered = useMemo(() => {
    const list = (orders.data ?? []) as TransportOrderListItem[];
    const query = normalize(q);

    return [...list]
      .filter((item) => {
        if (department !== 'all' && item.department !== department) return false;

        if (query) {
          const relatedEmail = item.emailMessageId ? emailsById.get(item.emailMessageId) : undefined;
          const hay = `${item.customerEmail ?? ''} ${shortId(item.id)} ${item.invoiceReference ?? ''} ${item.externalReference ?? ''} ${relatedEmail?.subject ?? ''}`.toLowerCase();
          if (!hay.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(getOrderLastUpdated(a)).getTime();
        const bTime = new Date(getOrderLastUpdated(b)).getTime();
        return bTime - aTime;
      });
  }, [orders.data, q, department, emailsById]);

  const filtered = useMemo(() => {
    if (queueTab === 'today') {
      return baseFiltered.filter((item) => {
        const relatedEmail = item.emailMessageId ? emailsById.get(item.emailMessageId) : undefined;
        return isToday(relatedEmail?.receivedAt);
      });
    }

    const statuses = queueStatusMap[queueTab];
    if (!statuses.length) return baseFiltered;
    return baseFiltered.filter((item) => statuses.includes(item.status));
  }, [baseFiltered, emailsById, queueTab]);

  // Batch orders bundle into one collapsible group (Niek); single orders stay
  // standalone. A batch appears at the position of its most recent order (the
  // list is already sorted newest-first).
  const orderGroups = useMemo(() => {
    const byBatch = new Map<string, TransportOrderListItem[]>();
    const groups: Array<
      | {kind: 'single'; key: string; item: TransportOrderListItem}
      | {kind: 'batch'; key: string; items: TransportOrderListItem[]}
    > = [];
    for (const item of filtered) {
      if (item.batchImportId) {
        const existing = byBatch.get(item.batchImportId);
        if (existing) existing.push(item);
        else {
          const created = [item];
          byBatch.set(item.batchImportId, created);
          groups.push({kind: 'batch', key: item.batchImportId, items: created});
        }
      } else {
        groups.push({kind: 'single', key: item.id, item});
      }
    }
    for (const group of groups) {
      if (group.kind === 'batch') {
        group.items.sort((a, b) => (a.batchSequence ?? 0) - (b.batchSequence ?? 0));
      }
    }
    return groups;
  }, [filtered]);

  const groupPageSize = 50;
  const [page, setPage] = useState(1);

  // Filtering/searching changes the result set, so an old page number could land
  // on an empty view. Snap back to the first page whenever the set changes.
  useEffect(() => {
    setPage(1);
  }, [q, department, queueTab]);

  const pageCount = Math.max(1, Math.ceil(orderGroups.length / groupPageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedGroups = useMemo(
    () =>
      orderGroups.slice(
        (currentPage - 1) * groupPageSize,
        currentPage * groupPageSize,
      ),
    [orderGroups, currentPage],
  );
  const visibleOrders = useMemo(
    () => pagedGroups.flatMap((g) => (g.kind === 'batch' ? g.items : [g.item])),
    [pagedGroups],
  );

  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const toggleBatch = (key: string) =>
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const isLoading = orders.loading;
  const hasError = Boolean(orders.error);

  const allVisibleSelected =
    visibleOrders.length > 0 && visibleOrders.every((item) => selected.has(item.id));

  function toggleAll() {
    setSelected((prev) => {
      if (visibleOrders.every((item) => prev.has(item.id))) {
        const next = new Set(prev);
        visibleOrders.forEach((item) => next.delete(item.id));
        return next;
      }
      const next = new Set(prev);
      visibleOrders.forEach((item) => next.add(item.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleQueueTabChange(nextQueue: QueueTabKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQueue === 'all') params.delete('queue');
    else params.set('queue', nextQueue);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function openOrder(id: string) {
    router.push(`/orders/${id}`);
  }

  const renderOrderRow = (
    item: TransportOrderListItem,
    opts: {nested?: boolean} = {}
  ) => {
    const updatedAt = getOrderLastUpdated(item);
    const isSelected = selected.has(item.id);
    const relatedEmail = item.emailMessageId
      ? emailsById.get(item.emailMessageId)
      : undefined;

    return (
      <TableRow
        key={item.id}
        onClick={() => openOrder(item.id)}
        className={cn(
          'cursor-pointer',
          getRowAccent(item.status),
          opts.nested && 'bg-muted/10',
          isSelected && 'bg-muted/60'
        )}
      >
        <TableCell onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            aria-label={t('table.selectRow')}
            checked={isSelected}
            onChange={() => toggleOne(item.id)}
            className="h-4 w-4 accent-primary"
          />
        </TableCell>
        <TableCell className="whitespace-normal">
          <div
            className={cn(
              'truncate text-sm text-foreground',
              opts.nested && 'pl-4'
            )}
            title={item.customerEmail || tCommon('na')}
          >
            {item.customerEmail || tCommon('na')}
          </div>
          <div
            className={cn(
              'truncate text-xs text-muted-foreground',
              opts.nested && 'pl-4'
            )}
          >
            {getMessageString(messages, `enums.orderType.${item.type}`) ?? item.type}
          </div>
          {item.invoiceReference || item.externalReference ? (
            <div
              className={cn(
                'mt-1 flex flex-wrap items-center gap-1.5',
                opts.nested && 'pl-4'
              )}
            >
              {item.batchImportId ? (
                <span className="rounded bg-sky-100 px-1 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                  {item.batchSequence != null &&
                  batchTotals.get(item.batchImportId)
                    ? `Batch ${item.batchSequence}/${batchTotals.get(item.batchImportId)}`
                    : 'Batch'}
                </span>
              ) : null}
              {/* Niek: factuurreferentie is the primary reference. */}
              {item.invoiceReference ? (
                <span
                  className="truncate font-mono text-[11px] font-medium text-foreground"
                  title={item.invoiceReference}
                >
                  {item.invoiceReference}
                </span>
              ) : null}
              {item.externalReference ? (
                <span
                  className="truncate font-mono text-[11px] text-muted-foreground"
                  title={item.externalReference}
                >
                  {item.externalReference}
                </span>
              ) : null}
            </div>
          ) : null}
        </TableCell>
        <TableCell className="whitespace-normal">
          <div
            className="line-clamp-2 text-sm text-foreground"
            title={relatedEmail?.subject || tCommon('na')}
          >
            {relatedEmail?.subject || tCommon('na')}
          </div>
        </TableCell>
        <TableCell>
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
            {shortId(item.id)}
          </span>
        </TableCell>
        <TableCell>
          <ConfidenceCell value={item.overallConfidence} />
        </TableCell>
        <TableCell>
          <StatusBadge status={item.status ?? tCommon('na')} />
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {updatedAt ? formatDateTime(updatedAt, uiLocale) : tCommon('na')}
        </TableCell>
        <TableCell className="text-sm">
          {item.lastAudit ? (
            <div className="min-w-0">
              <div
                className="truncate text-foreground"
                title={
                  getMessageString(messages, `orders.auditActions.${item.lastAudit.action}`) ??
                  humanizeAction(item.lastAudit.action)
                }
              >
                {getMessageString(messages, `orders.auditActions.${item.lastAudit.action}`) ??
                  humanizeAction(item.lastAudit.action)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(item.lastAudit.createdAt, uiLocale)}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{tCommon('na')}</span>
          )}
        </TableCell>
        <TableCell onClick={(event) => event.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('table.columns.actions')}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openOrder(item.id)}>
                <ExternalLink className="h-4 w-4" />
                {tCommon('open')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-4 lg:h-[calc(100vh-7rem)]">
      <PageHeader
        title={t('title')}
        subtitle={t('queueSubtitle')}
        actions={
          <Button variant="outline" size="sm" onClick={() => orders.refetch()} disabled={!mounted || orders.loading}>
            {tCommon('refetch')}
          </Button>
        }
      />

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-3 border-b">
          <div className="flex min-w-0 items-center gap-3">
            <CardTitle className="shrink-0 text-base">{t('table.title')}</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t('filters.searchPlaceholder')}
                className="h-8 pl-8"
              />
            </div>
          </div>
          <div className="shrink-0 text-xs text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} ${t('table.selected')}`
              : t('filters.showing', {count: visibleOrders.length, total: filtered.length, pageSize: groupPageSize})}
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-auto p-0">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label={t('table.selectAll')}
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-primary"
                  />
                </TableHead>
                <TableHead className="min-w-[220px]">{t('table.columns.customer')}</TableHead>
                <TableHead className="min-w-[200px]">{t('table.columns.subject')}</TableHead>
                <TableHead className="w-[120px]">{t('table.columns.id')}</TableHead>
                <TableHead className="w-[150px]">{t('table.columns.confidence')}</TableHead>
                <TableHead className="w-[190px]">{t('table.columns.status')}</TableHead>
                <TableHead className="w-[170px]">{t('table.columns.updatedAt')}</TableHead>
                <TableHead className="min-w-[180px]">{t('table.columns.audit')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>

              {/* Inline column filters */}
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-1.5" />
                <TableHead className="py-1.5" />
                <TableHead className="py-1.5" />
                <TableHead className="py-1.5" />
                <TableHead className="py-1.5" />
                <TableHead className="py-1.5">
                  <Select
                    value={queueTab}
                    onValueChange={(value) => {
                      if (isQueueTabKey(value)) handleQueueTabChange(value);
                    }}
                  >
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue placeholder={t('filters.all')}>
                        {t(`quickFilters.tabs.${queueTab}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {queueTabKeys.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`quickFilters.tabs.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="py-1.5" />
                <TableHead className="py-1.5">
                  <Select
                    value={department}
                    onValueChange={(value) => {
                      if (!value || value === 'all') return setDepartment('all');
                      if (isDepartmentValue(value)) setDepartment(value);
                    }}
                  >
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue placeholder={t('filters.department')}>
                        {department === 'all'
                          ? t('filters.all')
                          : (getMessageString(messages, `enums.department.${department}`) ?? department)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all')}</SelectItem>
                      {departmentValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {getMessageString(messages, `enums.department.${value}`) ?? value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="py-1.5" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {pagedGroups.map((group) => {
                if (group.kind === 'single') return renderOrderRow(group.item);

                const expanded = expandedBatches.has(group.key);
                const first = group.items[0];
                const relatedEmail = first.emailMessageId
                  ? emailsById.get(first.emailMessageId)
                  : undefined;

                return (
                  <Fragment key={group.key}>
                    <TableRow
                      className="cursor-pointer bg-muted/30 hover:bg-muted/50"
                      onClick={() => toggleBatch(group.key)}
                    >
                      <TableCell>
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            expanded && 'rotate-90'
                          )}
                        />
                      </TableCell>
                      <TableCell colSpan={8}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                            Batch · {group.items.length}
                          </span>
                          <span
                            className="truncate text-sm font-medium text-foreground"
                            title={relatedEmail?.subject || tCommon('na')}
                          >
                            {relatedEmail?.subject || tCommon('na')}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {first.customerEmail}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded
                      ? group.items.map((item) =>
                          renderOrderRow(item, {nested: true})
                        )
                      : null}
                  </Fragment>
                );
              })}

              {isLoading ? <OrdersTableSkeleton /> : null}

              {!isLoading && !hasError && orderGroups.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="py-10">
                    <EmptyState
                      icon={PackageSearch}
                      title={t('table.title')}
                      description={t('empty')}
                      className="border-0 bg-transparent shadow-none"
                    />
                  </TableCell>
                </TableRow>
              ) : null}

              {hasError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="py-6">
                    <div className="space-y-3">
                      <div className="text-sm text-destructive">{String(orders.error?.message)}</div>
                      <Button onClick={() => orders.refetch()}>{tCommon('tryAgain')}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>

        {!isLoading && !hasError ? (
          <Pagination
            page={currentPage}
            pageSize={groupPageSize}
            total={orderGroups.length}
            onPageChange={setPage}
          />
        ) : null}
      </Card>
    </div>
  );
}

function OrdersTableSkeleton() {
  return (
    <>
      {Array.from({length: 10}).map((_, idx) => (
        <TableRow key={`sk:${idx}`} className="hover:bg-transparent">
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-44" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-7 w-7" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

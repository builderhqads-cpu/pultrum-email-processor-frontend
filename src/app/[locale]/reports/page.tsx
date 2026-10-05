'use client';

import {useMemo, useState} from 'react';
import {useLocale} from 'next-intl';
import {Download, Lock} from 'lucide-react';
import {toast} from 'sonner';

import type {Locale} from '@/i18n/routing';
import type {EmailStatsGroupBy, EmailStatsRow} from '@/types';
import {useAuth} from '@/hooks/use-auth';
import {isAuditAdmin} from '@/lib/audit-access';
import {useEmailStats} from '@/hooks/use-email-stats';
import {downloadEmailStatsCsv} from '@/lib/api';
import {cn} from '@/lib/utils';

import {PageHeader} from '@/components/layout/PageHeader';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

type Preset = '7d' | '30d' | 'month' | 'custom';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(preset: Preset): {from: string; to: string} {
  const today = new Date();
  const to = ymd(today);
  if (preset === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return {from: ymd(first), to};
  }
  const days = preset === '7d' ? 7 : 30;
  const from = new Date(today.getTime() - (days - 1) * 86400000);
  return {from: ymd(from), to};
}

export default function ReportsPage() {
  const locale = useLocale() as Locale;
  const labels = pageLabels[locale] ?? pageLabels.en;
  const {user, status} = useAuth();

  const [preset, setPreset] = useState<Preset>('30d');
  const [range, setRange] = useState(() => presetRange('30d'));
  const [groupBy, setGroupBy] = useState<EmailStatsGroupBy>('customer');
  const [downloading, setDownloading] = useState(false);

  function applyPreset(next: Preset) {
    setPreset(next);
    if (next !== 'custom') setRange(presetRange(next));
  }

  // Charts + summary always come from the daily grouping.
  const dayStats = useEmailStats({
    from: range.from,
    to: range.to,
    groupBy: 'day',
    enabled: isAuditAdmin(user?.email)
  });
  // The detail table follows the selected grouping (deduped by react-query when
  // it is also 'day').
  const tableStats = useEmailStats({
    from: range.from,
    to: range.to,
    groupBy,
    enabled: isAuditAdmin(user?.email)
  });

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 4
      }),
    [locale]
  );
  const fmtCost = (n: number) => money.format(n || 0);
  const fmtInt = (n: number) => new Intl.NumberFormat(locale).format(n || 0);

  const summary = dayStats.data?.summary;
  const dayRows = useMemo(
    () =>
      [...(dayStats.data?.rows ?? [])].sort((a, b) =>
        (a.date ?? '').localeCompare(b.date ?? '')
      ),
    [dayStats.data]
  );

  async function exportCsv() {
    setDownloading(true);
    try {
      await downloadEmailStatsCsv({from: range.from, to: range.to, groupBy});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : labels.exportError);
    } finally {
      setDownloading(false);
    }
  }

  // Access gate (UI only; the backend guard is the real gate).
  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <PageHeader title={labels.title} />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!isAuditAdmin(user?.email)) {
    return (
      <div className="space-y-4">
        <PageHeader title={labels.title} />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">{labels.restricted}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showDate = groupBy === 'day' || groupBy === 'day_customer';
  const showCustomer = groupBy === 'customer' || groupBy === 'day_customer';
  const showModelGroup = groupBy === 'model';
  const showModelInfo = groupBy !== 'model';
  const colCount =
    (showModelGroup ? 1 : 0) +
    (showDate ? 1 : 0) +
    (showCustomer ? 1 : 0) +
    (showModelInfo ? 1 : 0) +
    5;

  return (
    <div className="space-y-5">
      <PageHeader title={labels.title} />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{labels.period}</span>
            <div className="flex flex-wrap gap-1">
              {(['7d', '30d', 'month', 'custom'] as Preset[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={preset === p ? 'default' : 'outline'}
                  className="h-8"
                  onClick={() => applyPreset(p)}
                >
                  {labels.presets[p]}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{labels.from}</span>
              <Input
                type="date"
                value={range.from}
                max={range.to}
                className="h-8 w-[150px]"
                onChange={(e) => {
                  setPreset('custom');
                  setRange((r) => ({...r, from: e.target.value}));
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{labels.to}</span>
              <Input
                type="date"
                value={range.to}
                min={range.from}
                className="h-8 w-[150px]"
                onChange={(e) => {
                  setPreset('custom');
                  setRange((r) => ({...r, to: e.target.value}));
                }}
              />
            </div>
          </div>

          <div className="ml-auto flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{labels.groupBy}</span>
              <Select
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as EmailStatsGroupBy)}
              >
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue>{labels.groups[groupBy]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{labels.groups.day}</SelectItem>
                  <SelectItem value="customer">{labels.groups.customer}</SelectItem>
                  <SelectItem value="model">{labels.groups.model}</SelectItem>
                  <SelectItem value="day_customer">{labels.groups.day_customer}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-2"
              onClick={exportCsv}
              disabled={downloading || !tableStats.data?.rows.length}
            >
              <Download className="h-4 w-4" />
              {downloading ? labels.exporting : labels.exportCsv}
            </Button>
          </div>
        </CardContent>
      </Card>

      {dayStats.error ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <div className="text-sm text-destructive">{String(dayStats.error.message)}</div>
            <Button onClick={() => dayStats.refetch()}>{labels.retry}</Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label={labels.cards.emails} value={summary ? fmtInt(summary.totalEmails) : '—'} loading={dayStats.isPending} />
        <SummaryCard label={labels.cards.cost} value={summary ? fmtCost(summary.totalCostUsd) : '—'} loading={dayStats.isPending} accent />
        <SummaryCard label={labels.cards.avgCost} value={summary ? fmtCost(summary.avgCostPerEmail) : '—'} loading={dayStats.isPending} />
        <SummaryCard label={labels.cards.customers} value={summary ? fmtInt(summary.customerCount) : '—'} loading={dayStats.isPending} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label={labels.cards.calls} value={summary ? fmtInt(summary.totalCalls) : '—'} loading={dayStats.isPending} muted />
        <SummaryCard label={labels.cards.succeeded} value={summary ? fmtInt(summary.succeeded) : '—'} loading={dayStats.isPending} muted />
        <SummaryCard label={labels.cards.failed} value={summary ? fmtInt(summary.failed) : '—'} loading={dayStats.isPending} muted />
        <SummaryCard
          label={labels.cards.timezone}
          value={summary?.timezone ?? '—'}
          loading={dayStats.isPending}
          muted
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{labels.chartEmails}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              rows={dayRows}
              value={(r) => r.emails}
              color="bg-sky-400 dark:bg-sky-500"
              format={fmtInt}
              emptyLabel={labels.empty}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{labels.chartCost}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              rows={dayRows}
              value={(r) => r.costUsd}
              color="bg-emerald-400 dark:bg-emerald-500"
              format={fmtCost}
              emptyLabel={labels.empty}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {labels.detail} · {labels.groups[groupBy]}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {showModelGroup ? <TableHead>{labels.col.model}</TableHead> : null}
                  {showDate ? <TableHead>{labels.col.date}</TableHead> : null}
                  {showCustomer ? <TableHead>{labels.col.customer}</TableHead> : null}
                  {showModelInfo ? <TableHead>{labels.col.model}</TableHead> : null}
                  <TableHead className="text-right">{labels.col.emails}</TableHead>
                  <TableHead className="text-right">{labels.col.calls}</TableHead>
                  <TableHead className="text-right">{labels.col.cost}</TableHead>
                  <TableHead className="text-right">{labels.col.avgCost}</TableHead>
                  <TableHead className="text-right">{labels.col.failed}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableStats.isPending ? (
                  Array.from({length: 6}).map((_, i) => (
                    <TableRow key={`sk:${i}`}>
                      <TableCell colSpan={colCount}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : tableStats.data?.rows.length ? (
                  tableStats.data.rows.map((row, i) => (
                    <TableRow key={`${row.date ?? ''}:${row.customer ?? ''}:${row.model ?? ''}:${i}`}>
                      {showModelGroup ? (
                        <TableCell className="font-mono text-xs">{row.model}</TableCell>
                      ) : null}
                      {showDate ? (
                        <TableCell className="font-mono text-xs">{row.date}</TableCell>
                      ) : null}
                      {showCustomer ? (
                        <TableCell className="text-sm">{row.customer}</TableCell>
                      ) : null}
                      {showModelInfo ? (
                        <TableCell className="font-mono text-[11px] text-muted-foreground">{row.model}</TableCell>
                      ) : null}
                      <TableCell className="text-right tabular-nums">{fmtInt(row.emails)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{fmtInt(row.calls)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{fmtCost(row.costUsd)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{fmtCost(row.avgCostPerEmail)}</TableCell>
                      <TableCell className={cn('text-right tabular-nums', row.failed ? 'text-destructive' : 'text-muted-foreground')}>
                        {fmtInt(row.failed)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={colCount} className="py-10 text-center text-sm text-muted-foreground">
                      {labels.empty}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{labels.costNote}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  loading,
  accent,
  muted
}: {
  label: string;
  value: string;
  loading?: boolean;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-20" />
        ) : (
          <div
            className={cn(
              'mt-1 text-2xl font-bold tabular-nums',
              accent
                ? 'text-emerald-600 dark:text-emerald-400'
                : muted
                  ? 'text-foreground/80'
                  : 'text-foreground'
            )}
          >
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BarChart({
  rows,
  value,
  color,
  format,
  emptyLabel
}: {
  rows: EmailStatsRow[];
  value: (r: EmailStatsRow) => number;
  color: string;
  format: (n: number) => string;
  emptyLabel: string;
}) {
  if (!rows.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  const max = Math.max(1, ...rows.map(value));
  const BAR_AREA = 130; // px — the tallest bar; labels sit below.
  return (
    <div className="flex h-40 items-end gap-0.5 overflow-x-auto pb-1">
      {rows.map((r, i) => {
        const v = value(r);
        const label = (r.date ?? '').slice(5); // MM-DD
        return (
          <div
            key={`${r.date}:${i}`}
            className="flex min-w-[10px] flex-1 flex-col items-center justify-end gap-1"
            title={`${r.date}: ${format(v)}`}
          >
            <div
              className={cn('w-full rounded-t transition-all', color)}
              style={{height: `${Math.max(2, (v / max) * BAR_AREA)}px`}}
            />
            <span className="w-full truncate text-center text-[9px] text-muted-foreground">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const pageLabels: Record<
  Locale,
  {
    title: string;
    restricted: string;
    period: string;
    from: string;
    to: string;
    groupBy: string;
    presets: Record<Preset, string>;
    groups: Record<EmailStatsGroupBy, string>;
    cards: {
      emails: string;
      cost: string;
      avgCost: string;
      customers: string;
      calls: string;
      succeeded: string;
      failed: string;
      timezone: string;
    };
    chartEmails: string;
    chartCost: string;
    detail: string;
    col: {
      date: string;
      customer: string;
      model: string;
      emails: string;
      calls: string;
      cost: string;
      avgCost: string;
      failed: string;
    };
    exportCsv: string;
    exporting: string;
    exportError: string;
    empty: string;
    retry: string;
    costNote: string;
  }
> = {
  pt: {
    title: 'Relatórios / Auditoria',
    restricted: 'Acesso restrito. Esta área é exclusiva da Renovo.',
    period: 'Período',
    from: 'De',
    to: 'Até',
    groupBy: 'Agrupar por',
    presets: {'7d': '7 dias', '30d': '30 dias', month: 'Este mês', custom: 'Personalizado'},
    groups: {day: 'Dia', customer: 'Cliente', model: 'Modelo', day_customer: 'Dia × Cliente'},
    cards: {
      emails: 'E-mails',
      cost: 'Custo total',
      avgCost: 'Custo médio/e-mail',
      customers: 'Clientes',
      calls: 'Chamadas IA',
      succeeded: 'Sucesso',
      failed: 'Falhas',
      timezone: 'Fuso'
    },
    chartEmails: 'E-mails por dia',
    chartCost: 'Custo por dia',
    detail: 'Detalhamento',
    col: {
      date: 'Dia',
      customer: 'Cliente',
      model: 'Modelo',
      emails: 'E-mails',
      calls: 'Chamadas',
      cost: 'Custo',
      avgCost: 'Médio/e-mail',
      failed: 'Falhas'
    },
    exportCsv: 'Exportar CSV',
    exporting: 'Exportando...',
    exportError: 'Falha ao exportar',
    empty: 'Sem dados no período.',
    retry: 'Tentar novamente',
    costNote:
      'Custo em USD, somado por chamada ao router (1 por e-mail, sem duplicar por pedido). Disponível a partir da ativação da auditoria de custo.'
  },
  en: {
    title: 'Reports / Audit',
    restricted: 'Access restricted. This area is Renovo-only.',
    period: 'Period',
    from: 'From',
    to: 'To',
    groupBy: 'Group by',
    presets: {'7d': '7 days', '30d': '30 days', month: 'This month', custom: 'Custom'},
    groups: {day: 'Day', customer: 'Customer', model: 'Model', day_customer: 'Day × Customer'},
    cards: {
      emails: 'Emails',
      cost: 'Total cost',
      avgCost: 'Avg cost/email',
      customers: 'Customers',
      calls: 'AI calls',
      succeeded: 'Succeeded',
      failed: 'Failed',
      timezone: 'Timezone'
    },
    chartEmails: 'Emails per day',
    chartCost: 'Cost per day',
    detail: 'Breakdown',
    col: {
      date: 'Day',
      customer: 'Customer',
      model: 'Model',
      emails: 'Emails',
      calls: 'Calls',
      cost: 'Cost',
      avgCost: 'Avg/email',
      failed: 'Failed'
    },
    exportCsv: 'Export CSV',
    exporting: 'Exporting...',
    exportError: 'Export failed',
    empty: 'No data in this period.',
    retry: 'Try again',
    costNote:
      'Cost in USD, summed per router call (1 per email, not duplicated per order). Available from the cost-audit rollout onward.'
  },
  nl: {
    title: 'Rapporten / Audit',
    restricted: 'Toegang beperkt. Dit gedeelte is alleen voor Renovo.',
    period: 'Periode',
    from: 'Van',
    to: 'Tot',
    groupBy: 'Groeperen op',
    presets: {'7d': '7 dagen', '30d': '30 dagen', month: 'Deze maand', custom: 'Aangepast'},
    groups: {day: 'Dag', customer: 'Klant', model: 'Model', day_customer: 'Dag × Klant'},
    cards: {
      emails: 'E-mails',
      cost: 'Totale kosten',
      avgCost: 'Gem. kosten/e-mail',
      customers: 'Klanten',
      calls: 'AI-aanroepen',
      succeeded: 'Geslaagd',
      failed: 'Mislukt',
      timezone: 'Tijdzone'
    },
    chartEmails: 'E-mails per dag',
    chartCost: 'Kosten per dag',
    detail: 'Uitsplitsing',
    col: {
      date: 'Dag',
      customer: 'Klant',
      model: 'Model',
      emails: 'E-mails',
      calls: 'Aanroepen',
      cost: 'Kosten',
      avgCost: 'Gem./e-mail',
      failed: 'Mislukt'
    },
    exportCsv: 'CSV exporteren',
    exporting: 'Exporteren...',
    exportError: 'Export mislukt',
    empty: 'Geen gegevens in deze periode.',
    retry: 'Opnieuw proberen',
    costNote:
      'Kosten in USD, per router-aanroep opgeteld (1 per e-mail, niet gedupliceerd per opdracht). Beschikbaar vanaf de start van de kostenaudit.'
  }
};

'use client';

import {useLocale, useTranslations} from 'next-intl';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {useCreativeGearsStatus} from '@/hooks/use-cg-status';
import type {CreativeGearsStatus} from '@/types';
import {cn} from '@/lib/utils';

function StatusPill({
  status
}: {
  status: CreativeGearsStatus['status'] | 'unavailable';
}) {
  const t = useTranslations('settings.cgStatus');
  const map = {
    operational: {
      label: t('statusOperational'),
      className:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300',
      dot: 'bg-emerald-500'
    },
    incident: {
      label: t('statusIncident'),
      className:
        'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300',
      dot: 'bg-red-500'
    },
    not_configured: {
      label: t('statusNotConfigured'),
      className: 'border-border bg-muted text-muted-foreground',
      dot: 'bg-muted-foreground/50'
    },
    unavailable: {
      label: t('statusUnavailable'),
      className:
        'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300',
      dot: 'bg-amber-500'
    }
  } as const;
  const s = map[status] ?? map.not_configured;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        s.className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

function UptimeStat({label, value}: {label: string; value: number}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
        {value.toFixed(3)}%
      </div>
    </div>
  );
}

export function CreativeGearsStatusCard() {
  const t = useTranslations('settings.cgStatus');
  const locale = useLocale();
  const {data, loading, error} = useCreativeGearsStatus();

  const dt = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        {error ? (
          <StatusPill status="unavailable" />
        ) : data ? (
          <StatusPill status={data.status} />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('loading')}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {String(error.message)}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4 border-b pb-4">
              <UptimeStat label={t('uptime7')} value={data.uptime.d7} />
              <UptimeStat label={t('uptime30')} value={data.uptime.d30} />
              <UptimeStat label={t('uptime90')} value={data.uptime.d90} />
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('recentDeliveries')}
              </div>
              {data.deliveries.length ? (
                <ul className="divide-y">
                  {data.deliveries.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-sm"
                    >
                      <StatusBadge status={d.status} />
                      <span className="font-mono text-xs text-foreground">
                        {d.reference ?? '—'}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {dt.format(new Date(d.at))}
                      </span>
                      {d.errorMessage ? (
                        <span className="w-full text-xs text-destructive [overflow-wrap:anywhere] sm:w-auto">
                          — {d.errorMessage}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-sm text-muted-foreground">
                  {t('noDeliveries')}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {t('windowNote', {days: data.windowDays})}
              {data.lastDeliveryAt
                ? ` · ${t('lastDelivery', {when: dt.format(new Date(data.lastDeliveryAt))})}`
                : ''}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

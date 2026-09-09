'use client';

import {useLocale, useTranslations} from 'next-intl';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useAiStatus} from '@/hooks/use-ai-status';
import type {AiServiceStatus} from '@/types';
import {cn} from '@/lib/utils';

function formatDuration(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr ? `${d}d ${hr}h` : `${d}d`;
}

function StatusPill({
  status
}: {
  status: AiServiceStatus['status'] | 'unavailable';
}) {
  const t = useTranslations('settings.aiStatus');
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

export function AiServiceStatusCard() {
  const t = useTranslations('settings.aiStatus');
  const locale = useLocale();
  const {data, loading, error} = useAiStatus();

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

            {data.status === 'incident' && data.ongoingSince ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {t('ongoingSince', {since: dt.format(new Date(data.ongoingSince))})}
              </div>
            ) : null}

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('recentEvents')}
              </div>
              {data.events.length ? (
                <ul className="divide-y">
                  {data.events.map((e, i) => (
                    <li
                      key={`${e.at}-${i}`}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-sm"
                    >
                      <span
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-full',
                          e.type === 'recovery' ? 'bg-emerald-500' : 'bg-red-500'
                        )}
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {dt.format(new Date(e.at))}
                      </span>
                      <span className="font-medium text-foreground">
                        {e.type === 'recovery' ? t('recovery') : t('incident')}
                      </span>
                      {e.type === 'recovery' && e.durationMs != null ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {formatDuration(e.durationMs)}
                        </span>
                      ) : null}
                      {e.type === 'incident' && e.message ? (
                        <span className="text-xs text-muted-foreground">
                          — {e.message}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-sm text-muted-foreground">
                  {t('noEvents')}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {t('windowNote', {days: data.windowDays})}
              {data.lastRequestAt
                ? ` · ${t('lastRequest', {when: dt.format(new Date(data.lastRequestAt))})}`
                : ''}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

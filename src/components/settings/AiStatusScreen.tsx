'use client';

import type {ReactNode} from 'react';
import {useTranslations} from 'next-intl';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {useHealth} from '@/hooks/use-health';
import {cn} from '@/lib/utils';
import {AiServiceStatusCard} from './AiServiceStatusCard';

function Field({
  label,
  value,
  mono
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border bg-background/70 px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          'min-w-0 text-sm text-foreground',
          mono && 'break-all font-mono text-xs [overflow-wrap:anywhere]'
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ConfiguredIndicator({ok}: {ok: boolean}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          ok ? 'bg-emerald-500' : 'bg-red-500'
        )}
      />
      <StatusBadge status={ok ? 'CONFIGURED' : 'NOT_CONFIGURED'} />
    </span>
  );
}

export function AiStatusScreen() {
  const t = useTranslations('settings');
  const health = useHealth();
  const aiConfigured = Boolean(health.data?.config?.ai?.apiConfigured);
  const endpoint = health.data?.config?.ai?.endpoint;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{t('ai.title')}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('ai.description')}
            </p>
          </div>
          <ConfiguredIndicator ok={aiConfigured} />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3">
          <Field
            label={t('ai.endpoint')}
            value={endpoint || t('ai.endpointUnset')}
            mono
          />
        </CardContent>
      </Card>

      <AiServiceStatusCard />
    </div>
  );
}

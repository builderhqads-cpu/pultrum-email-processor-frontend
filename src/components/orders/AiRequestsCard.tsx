'use client';

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/ui/StatusBadge';
import type {AiRequest} from '@/types';
import type {Locale} from '@/i18n/routing';
import {formatDateTime, safeJson} from './order-detail-utils';

export function AiRequestsCard({aiRequests}: {aiRequests: AiRequest[]}) {
  const t = useTranslations('orders.detail');
  const locale = useLocale() as Locale;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('aiRequests.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {aiRequests.length ? (
          <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
            {aiRequests.map((r) => {
              const key = r.id;
              const open = Boolean(expanded[key]);
              return (
                <div key={r.id} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={r.status} />
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatDateTime(r.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpanded((s) => ({...s, [key]: !open}))}
                    >
                      {open ? t('json.hide') : t('json.show')}
                    </Button>
                  </div>

                  {open ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground">{t('aiRequests.payload')}</div>
                        <pre className="mt-1 max-h-72 overflow-auto rounded-lg border bg-muted/20 p-3 text-xs">
                          <code>{safeJson(r.payloadJson)}</code>
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{t('aiRequests.response')}</div>
                        <pre className="mt-1 max-h-72 overflow-auto rounded-lg border bg-muted/20 p-3 text-xs">
                          <code>{safeJson(r.responseJson)}</code>
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('aiRequests.empty')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

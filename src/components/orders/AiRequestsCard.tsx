'use client';

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type {AiRequest} from '@/types';
import type {Locale} from '@/i18n/routing';
import {formatDateTime, safeJson} from './order-detail-utils';

export function AiRequestsCard({aiRequests}: {aiRequests: AiRequest[]}) {
  const t = useTranslations('orders.detail');
  const locale = useLocale() as Locale;
  // "Show" opens a wide centered modal (same as the XML preview) so the payload
  // and response JSON are comfortable to read (Renato 2026-09-09), instead of
  // expanding inline in the card.
  const [selected, setSelected] = useState<AiRequest | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('aiRequests.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {aiRequests.length ? (
          <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
            {aiRequests.map((r) => (
              <div key={r.id} className="rounded-lg border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.type ? (
                        <span className="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
                          {t(`aiRequests.types.${r.type}`)}
                        </span>
                      ) : null}
                      <StatusBadge status={r.status} />
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(r.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(r)}
                  >
                    {t('json.show')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('aiRequests.empty')}
          </div>
        )}
      </CardContent>

      {/* Wide centered modal with the request/response JSON. */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="grid max-h-[85vh] w-[92vw] max-w-5xl grid-rows-[auto_minmax(0,1fr)] sm:max-w-5xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {t('aiRequests.title')}
                  {selected.type ? (
                    <span className="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
                      {t(`aiRequests.types.${selected.type}`)}
                    </span>
                  ) : null}
                  <StatusBadge status={selected.status} />
                </DialogTitle>
                <DialogDescription>
                  {formatDateTime(selected.createdAt, locale)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    {t('aiRequests.payload')}
                  </div>
                  <pre className="overflow-x-auto rounded-lg border bg-muted/20 p-3 text-xs">
                    <code>{safeJson(selected.payloadJson)}</code>
                  </pre>
                </div>
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    {t('aiRequests.response')}
                  </div>
                  <pre className="overflow-x-auto rounded-lg border bg-muted/20 p-3 text-xs">
                    <code>{safeJson(selected.responseJson)}</code>
                  </pre>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

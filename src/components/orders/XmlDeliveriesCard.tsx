'use client';

import {useState} from 'react';
import {FileCode2} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {toast} from 'sonner';

import {getOrderXmlPreview} from '@/lib/api';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import type {XmlDelivery} from '@/types';
import type {Locale} from '@/i18n/routing';
import {cn} from '@/lib/utils';
import {formatDateTime} from './order-detail-utils';

function toTime(value: string | null | undefined) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function XmlDeliveriesCard({
  xmlDeliveries,
  orderId,
  canPreview
}: {
  xmlDeliveries: XmlDelivery[];
  orderId?: string;
  canPreview?: boolean;
}) {
  const t = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const [selected, setSelected] = useState<XmlDelivery | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewXml, setPreviewXml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const latestDelivery =
    [...xmlDeliveries].sort(
      (a, b) => toTime(b.createdAt) - toTime(a.createdAt)
    )[0] ?? null;

  // A single, consistent "View XML" entry point: show the latest delivery's XML
  // when one exists, otherwise generate an on-demand preview from current data.
  const showViewButton =
    xmlDeliveries.length > 0 || (Boolean(orderId) && Boolean(canPreview));

  async function openPreview() {
    if (!orderId) return;
    setPreviewOpen(true);
    setPreviewXml(null);
    setPreviewLoading(true);
    try {
      const result = await getOrderXmlPreview(orderId);
      setPreviewXml(result.xml);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? t('xmlDeliveries.previewError'));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleView() {
    if (latestDelivery) {
      setSelected(latestDelivery);
    } else {
      void openPreview();
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">{t('xmlDeliveries.title')}</CardTitle>
        {showViewButton ? (
          <Button variant="outline" size="sm" onClick={handleView}>
            <FileCode2 className="h-4 w-4" />
            {t('xmlDeliveries.view')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {xmlDeliveries.length ? (
          <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
            {xmlDeliveries.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setSelected(x)}
                className={cn(
                  'block w-full rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status={x.status} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDateTime(x.createdAt, locale)}
                  </span>
                </div>
                {x.errorMessage ? (
                  <div className="mt-1 text-sm text-destructive">{x.errorMessage}</div>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('xmlDeliveries.empty')}
          </div>
        )}
      </CardContent>

      {/* Delivery details */}
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-4xl">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {t('xmlDeliveries.title')}
                  <StatusBadge status={selected.status} />
                </SheetTitle>
                <SheetDescription>
                  {formatDateTime(selected.createdAt, locale)}
                </SheetDescription>
              </SheetHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-auto px-4 pb-4">
                {selected.errorMessage ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {selected.errorMessage}
                  </div>
                ) : null}

                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    {t('xmlDeliveries.xmlPayload')}
                  </div>
                  <pre className="overflow-auto rounded-lg border bg-muted/20 p-3 text-xs">
                    <code>{selected.xmlPayload}</code>
                  </pre>
                </div>

                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    {t('xmlDeliveries.response')}
                  </div>
                  <pre className="overflow-auto rounded-lg border bg-muted/20 p-3 text-xs">
                    <code>{selected.responsePayload ?? ''}</code>
                  </pre>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* On-demand preview (no delivery yet) */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle>{t('xmlDeliveries.previewTitle')}</SheetTitle>
            <SheetDescription>{t('xmlDeliveries.previewDescription')}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
            {previewLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {tCommon('loading')}
              </div>
            ) : (
              <pre className="overflow-auto rounded-lg border bg-muted/20 p-3 text-xs">
                <code>{previewXml ?? ''}</code>
              </pre>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}

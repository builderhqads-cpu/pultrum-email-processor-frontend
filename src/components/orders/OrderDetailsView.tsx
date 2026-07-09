'use client';

import {useState, type ReactNode} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import {useOrder} from '@/hooks/use-order';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import type {Locale} from '@/i18n/routing';
import {OrderDetailHeader} from '@/components/orders/OrderDetailHeader';
import {OrderActionsBar} from '@/components/orders/OrderActionsBar';
import {OriginalEmailCard} from '@/components/orders/OriginalEmailCard';
import {OrderStatusSummary} from '@/components/orders/OrderStatusSummary';
import {OrderFieldsCard} from '@/components/orders/OrderFieldsCard';
import {MissingFieldsCard} from '@/components/orders/MissingFieldsCard';
import {RequiredMissingSummary} from '@/components/orders/RequiredMissingSummary';
import {AiRequestsCard} from '@/components/orders/AiRequestsCard';
import {XmlDeliveriesCard} from '@/components/orders/XmlDeliveriesCard';
import {Skeleton} from '@/components/ui/skeleton';
import {CustomerReplyCard} from '@/components/orders/CustomerReplyCard';
import {OrderCollapsibleSection} from './OrderCollapsibleSection';

type DataTab = 'detected' | 'missing';

function hasValue(value: unknown) {
  if (value == null) return false;
  return String(value).trim().length > 0;
}

function canManuallySendXml(status: string, missingFieldsCount: number) {
  if (missingFieldsCount > 0) return false;
  return (
    status === 'READY_TO_XML' ||
    status === 'CREATIVE_GEARS_REJECTED' ||
    status === 'FAILED'
  );
}

export function OrderDetailsView({id}: {id: string}) {
  const order = useOrder(id);
  const t = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const labels = detailLayoutLabels[locale] ?? detailLayoutLabels.en;
  const [dataTab, setDataTab] = useState<DataTab>('detected');

  if (order.loading) {
    return <OrderDetailSkeleton />;
  }

  if (order.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('errorTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">{String(order.error.message)}</div>
          <Button onClick={() => order.refetch()}>{tCommon('tryAgain')}</Button>
        </CardContent>
      </Card>
    );
  }

  if (!order.data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t('empty')}
        </CardContent>
      </Card>
    );
  }

  const data = order.data;
  const detectedCount = data.fields.filter((field) => hasValue(field.value)).length;
  const missingCount = data.missingFields.length + data.validationWarnings.length;
  const canSendXml = canManuallySendXml(data.status, data.missingFields.length);

  return (
    <div className="space-y-6">
      <OrderDetailHeader orderId={id} order={data} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Left: original email + advanced */}
        <div className="min-w-0 space-y-6">
          <OriginalEmailCard emailMessageId={data.emailMessageId} />
          <OrderCollapsibleSection title={labels.advancedTitle} description={labels.advancedDescription}>
            <AiRequestsCard aiRequests={data.aiRequests} />
          </OrderCollapsibleSection>
        </div>

        {/* Center: detected data with tabs */}
        <div className="min-w-0 space-y-6">
          <RequiredMissingSummary missingFields={data.missingFields} />
          <Card className="min-w-0 overflow-hidden">
            <div className="flex flex-wrap gap-1 border-b px-3">
              <TabButton active={dataTab === 'detected'} onClick={() => setDataTab('detected')}>
                {labels.detectedTab}
                <Badge variant="outline">{detectedCount}</Badge>
              </TabButton>
              <TabButton active={dataTab === 'missing'} onClick={() => setDataTab('missing')}>
                {labels.missingTab}
                <Badge
                  variant="outline"
                  className={
                    missingCount > 0
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : undefined
                  }
                >
                  {missingCount}
                </Badge>
              </TabButton>
            </div>
            <CardContent className="pt-5">
              {dataTab === 'detected' ? (
                <OrderFieldsCard fields={data.fields} hideHeader />
              ) : (
                <MissingFieldsCard
                  fields={data.fields}
                  missingFields={data.missingFields}
                  validationWarnings={data.validationWarnings}
                  hideHeader
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: timeline + audit/xml + quick actions */}
        <div className="min-w-0 space-y-6">
          <OrderStatusSummary order={data} />
          <XmlDeliveriesCard
            xmlDeliveries={data.xmlDeliveries}
            orderId={id}
            canPreview={canSendXml}
          />
          <CustomerReplyCard orderId={id} order={data} onAfterSend={() => order.refetch()} />
          <OrderActionsBar
            orderId={id}
            canSendXml={canSendXml}
            onAfterAction={() => order.refetch()}
            sticky={false}
            title={labels.quickActions}
          />
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
      ) : null}
    </button>
  );
}

const detailLayoutLabels: Record<Locale, {
  quickActions: string;
  advancedTitle: string;
  advancedDescription: string;
  detectedTab: string;
  missingTab: string;
}> = {
  pt: {
    quickActions: 'Acoes rapidas',
    advancedTitle: 'Avancado',
    advancedDescription: 'Requisicoes de IA e dados de apoio para investigacao.',
    detectedTab: 'Dados extraidos',
    missingTab: 'Campos faltantes'
  },
  en: {
    quickActions: 'Quick actions',
    advancedTitle: 'Advanced',
    advancedDescription: 'AI requests and supporting data for investigation.',
    detectedTab: 'Detected fields',
    missingTab: 'Missing fields'
  },
  nl: {
    quickActions: 'Snelle acties',
    advancedTitle: 'Geavanceerd',
    advancedDescription: 'AI-verzoeken en ondersteunende data voor onderzoek.',
    detectedTab: 'Gedetecteerde velden',
    missingTab: 'Ontbrekende velden'
  }
};

function OrderDetailSkeleton() {
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <SectionSkeleton rows={6} />
        </div>
        <div className="min-w-0 space-y-6">
          <SectionSkeleton rows={10} />
        </div>
        <div className="min-w-0 space-y-6">
          <SectionSkeleton rows={5} />
          <SectionSkeleton rows={3} />
          <SectionSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton({rows}: {rows: number}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({length: rows}).map((_, idx) => (
          <Skeleton key={`section-sk:${idx}`} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

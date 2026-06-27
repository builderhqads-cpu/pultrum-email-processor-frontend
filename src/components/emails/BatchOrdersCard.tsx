'use client';

import {Mail, Send, SquarePen} from 'lucide-react';

import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import type {BatchImportSummary, BatchOrderItem} from '@/types/api';
import {useReplyDraft} from '@/hooks/use-reply-draft';
import {Badge} from '@/components/ui/badge';
import {buttonVariants} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {cn} from '@/lib/utils';

export function BatchOrdersCard({
  batch,
  orders,
  locale
}: {
  batch: BatchImportSummary;
  orders: BatchOrderItem[];
  locale: Locale;
}) {
  const t = batchLabels[locale] ?? batchLabels.en;

  // The batch has ONE consolidated reply, held on the primary order (lowest
  // sequence). Surface it here so it's reachable from the email / any order.
  const anchor = [...orders].sort(
    (a, b) => (a.batchSequence ?? 0) - (b.batchSequence ?? 0)
  )[0];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="text-base">{t.title}</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            {t.subtitle(batch.totalCreated)}
          </div>
        </div>
        <Badge variant="outline" className="shrink-0">
          {batch.totalCreated}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t.detected} value={batch.totalDetected} />
          <Stat label={t.created} value={batch.totalCreated} />
          <Stat
            label={t.failed}
            value={batch.totalFailed}
            tone={batch.totalFailed > 0 ? 'danger' : undefined}
          />
        </div>

        {anchor ? <ConsolidatedReply anchorId={anchor.id} t={t} /> : null}

        <div className="flex flex-col gap-2">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  #{order.batchSequence ?? index + 1}
                </span>
                <span
                  className="truncate font-mono text-sm [overflow-wrap:anywhere]"
                  title={order.externalReference || t.noReference}
                >
                  {order.externalReference || t.noReference}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={order.status} />
                <Link
                  href={`/orders/${order.id}`}
                  className={buttonVariants({variant: 'outline', size: 'sm'})}
                >
                  {t.open}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConsolidatedReply({
  anchorId,
  t
}: {
  anchorId: string;
  t: BatchLabels;
}) {
  const draft = useReplyDraft(anchorId, true);
  // No consolidated reply means nothing is missing across the batch.
  if (draft.isLoading || draft.error || !draft.data) return null;

  const sent = draft.data.status === 'SENT';

  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">
              {t.replyTitle}
            </div>
            <div className="truncate text-xs text-muted-foreground" title={draft.data.subject}>
              {draft.data.subject || t.replyTitle}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={sent ? 'secondary' : 'outline'}>
            {sent ? t.replySent : t.replyDraft}
          </Badge>
          <Link
            href={`/orders/${anchorId}`}
            className={buttonVariants({variant: 'secondary', size: 'sm'})}
          >
            {sent ? <Send className="h-4 w-4" /> : <SquarePen className="h-4 w-4" />}
            {t.replyOpen}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone?: 'danger';
}) {
  return (
    <div className="rounded-xl border bg-background p-3 text-center">
      <div
        className={cn(
          'text-lg font-semibold',
          tone === 'danger' ? 'text-destructive' : 'text-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

type BatchLabels = {
  title: string;
  subtitle: (n: number) => string;
  detected: string;
  created: string;
  failed: string;
  open: string;
  noReference: string;
  replyTitle: string;
  replyDraft: string;
  replySent: string;
  replyOpen: string;
};

const batchLabels: Record<Locale, BatchLabels> = {
  pt: {
    title: 'Lote detectado',
    subtitle: (n) => `${n} ordens criadas a partir deste e-mail`,
    detected: 'Detectadas',
    created: 'Criadas',
    failed: 'Falhas',
    open: 'Abrir',
    noReference: 'Sem referência',
    replyTitle: 'Resposta consolidada',
    replyDraft: 'Rascunho',
    replySent: 'Enviada',
    replyOpen: 'Abrir resposta'
  },
  en: {
    title: 'Batch detected',
    subtitle: (n) => `${n} orders created from this email`,
    detected: 'Detected',
    created: 'Created',
    failed: 'Failed',
    open: 'Open',
    noReference: 'No reference',
    replyTitle: 'Consolidated reply',
    replyDraft: 'Draft',
    replySent: 'Sent',
    replyOpen: 'Open reply'
  },
  nl: {
    title: 'Batch gedetecteerd',
    subtitle: (n) => `${n} orders aangemaakt uit deze e-mail`,
    detected: 'Gedetecteerd',
    created: 'Aangemaakt',
    failed: 'Mislukt',
    open: 'Openen',
    noReference: 'Geen referentie',
    replyTitle: 'Geconsolideerd antwoord',
    replyDraft: 'Concept',
    replySent: 'Verzonden',
    replyOpen: 'Antwoord openen'
  }
};

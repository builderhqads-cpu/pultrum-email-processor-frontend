'use client';

import {
  Bot,
  CheckCheck,
  ChevronDown,
  CircleAlert,
  CircleCheckBig,
  FileCheck2,
  FileOutput,
  Mail,
  MessageSquareQuote,
  Send
} from 'lucide-react';
import {useLocale, useMessages, useTranslations} from 'next-intl';
import {useState} from 'react';

import {useEmail} from '@/hooks/use-email';
import {useReplyDraft} from '@/hooks/use-reply-draft';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {getMessageString, type Messages} from '@/i18n/message-utils';
import type {Locale} from '@/i18n/routing';
import type {AiExtractionSummary, CustomerReplyDraft, OrderStatus, TransportOrder, XmlDeliveryStatus} from '@/types';
import {formatDateTime} from './order-detail-utils';

type TimelineStepState = 'completed' | 'pending' | 'error' | 'skipped';

type TimelineStep = {
  id: string;
  label: string;
  date?: string | null;
  state: TimelineStepState;
  icon: React.ComponentType<{className?: string}>;
};

const laterThanValidation: OrderStatus[] = [
  'MISSING_INFORMATION',
  'WAITING_CUSTOMER_RESPONSE',
  'READY_TO_XML',
  'XML_GENERATED',
  'SENT_TO_CREATIVE_GEARS',
  'CREATIVE_GEARS_ACCEPTED',
  'CREATIVE_GEARS_REJECTED',
  'MANUAL_REVIEW'
];

const laterThanReady: OrderStatus[] = [
  'READY_TO_XML',
  'XML_GENERATED',
  'SENT_TO_CREATIVE_GEARS',
  'CREATIVE_GEARS_ACCEPTED',
  'CREATIVE_GEARS_REJECTED'
];

export function OrderStatusSummary({order}: {order: TransportOrder}) {
  const t = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const messages = useMessages() as Messages;
  const locale = useLocale() as Locale;

  const email = useEmail(order.emailMessageId);
  const replyDraft = useReplyDraft(order.id, true);

  const latestXmlDelivery = [...order.xmlDeliveries].sort((a, b) => toTime((b.sentAt || b.updatedAt || b.createdAt)) - toTime((a.sentAt || a.updatedAt || a.createdAt)))[0];
  const currentStatusLabel =
    getMessageString(messages, `enums.orderStatus.${order.status}`) ?? order.status ?? tCommon('na');

  const steps = buildTimelineSteps({
    order,
    emailReceivedAt: email.data?.receivedAt ?? null,
    replyDraft: replyDraft.data ?? null,
    aiExtraction: order.aiExtraction ?? null,
    latestXmlDeliveryStatus: latestXmlDelivery?.status ?? null,
    latestXmlDeliveryDate: latestXmlDelivery ? (latestXmlDelivery.sentAt || latestXmlDelivery.updatedAt || latestXmlDelivery.createdAt) : null,
    locale
  });

  const [expanded, setExpanded] = useState(false);
  // Current step = the furthest reached (last completed/error); fallback to first.
  const lastDoneIndex = steps.reduce(
    (acc, step, i) => (step.state === 'completed' || step.state === 'error' ? i : acc),
    -1
  );
  const currentIndex = lastDoneIndex >= 0 ? lastDoneIndex : 0;
  const visibleSteps = expanded
    ? steps.map((step, index) => ({step, index}))
    : [{step: steps[currentIndex], index: currentIndex}];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          <div className="min-w-0">
            <CardTitle className="text-base">{t('timeline.title')}</CardTitle>
            <div className="mt-1 truncate text-xs text-muted-foreground">{currentStatusLabel}</div>
          </div>
        </button>
        <StatusBadge status={order.status ?? tCommon('na')} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0 rounded-xl border bg-background px-4 py-3">
          {visibleSteps.map(({step, index}) => {
            const iconTone = step.state === 'completed'
              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
              : step.state === 'error'
                ? 'bg-destructive/10 text-destructive'
                : step.state === 'skipped'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-900/40 dark:text-slate-200'
                  : 'bg-muted text-muted-foreground';
            const lineTone = step.state === 'completed'
              ? 'bg-emerald-300 dark:bg-emerald-800'
              : step.state === 'error'
                ? 'bg-destructive/40'
                : step.state === 'skipped'
                  ? 'bg-slate-300 dark:bg-slate-700'
                  : 'bg-border';
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex gap-3 py-3">
                <div className="flex flex-col items-center">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconTone}`}>
                    <StepIcon className="h-4 w-4" />
                  </span>
                  {expanded && index < steps.length - 1 ? <span className={`mt-2 h-full min-h-6 w-px ${lineTone}`} /> : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-foreground">{step.label}</div>
                    <StepStateBadge state={step.state} locale={locale} />
                  </div>
                  {step.date ? (
                    <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(step.date, locale)}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function buildTimelineSteps({
  order,
  emailReceivedAt,
  replyDraft,
  aiExtraction,
  latestXmlDeliveryStatus,
  latestXmlDeliveryDate,
  locale
}: {
  order: TransportOrder;
  emailReceivedAt: string | null;
  replyDraft: CustomerReplyDraft | null;
  aiExtraction: AiExtractionSummary | null;
  latestXmlDeliveryStatus: XmlDeliveryStatus | string | null;
  latestXmlDeliveryDate: string | null;
  locale: Locale;
}): TimelineStep[] {
  const labels = timelineStepLabels[locale] ?? timelineStepLabels.en;

  const aiStatus = normalizeStatus(aiExtraction?.status);
  const aiCompleted =
    aiStatus === 'COMPLETED' ||
    order.fields.some((field) => field.source === 'AI' && (field.value ?? '').trim().length > 0);
  const aiFailed = aiStatus === 'FAILED';
  const aiSkipped = aiStatus === 'SKIPPED';
  // The AI step is skipped (not pending) when the pipeline moved past field
  // validation without the AI ever running — e.g. a customer reply filled the
  // gaps deterministically, so no AI extraction was recorded.
  const aiBranchSkipped =
    !aiCompleted &&
    !aiFailed &&
    order.status !== 'AI_PROCESSING' &&
    (aiSkipped || laterThanValidation.includes(order.status));
  const xmlFailed = normalizeStatus(latestXmlDeliveryStatus) === 'FAILED';
  const xmlRejected = normalizeStatus(latestXmlDeliveryStatus) === 'REJECTED' || order.status === 'CREATIVE_GEARS_REJECTED';
  const xmlAccepted = normalizeStatus(latestXmlDeliveryStatus) === 'ACCEPTED' || order.status === 'CREATIVE_GEARS_ACCEPTED';
  const replySent = replyDraft?.status === 'SENT';
  const replyDraftExists = Boolean(replyDraft);
  // The customer-reply branch is skipped (not pending) when the order reached
  // READY_TO_XML or beyond without ever generating/sending a reply draft.
  const replyBranchSkipped =
    !replyDraftExists && !replySent && laterThanReady.includes(order.status);

  return [
    {
      id: 'email_received',
      label: labels.emailReceived,
      date: emailReceivedAt,
      state: emailReceivedAt || order.emailMessageId ? 'completed' : 'pending',
      icon: Mail
    },
    {
      id: 'ai_processed',
      label: labels.aiProcessed,
      date: aiExtraction?.date ?? (aiBranchSkipped ? order.updatedAt || null : null),
      state: aiFailed
        ? 'error'
        : aiCompleted
          ? 'completed'
          : aiBranchSkipped
            ? 'skipped'
            : 'pending',
      icon: Bot
    },
    {
      id: 'fields_validated',
      label: labels.fieldsValidated,
      date: laterThanValidation.includes(order.status) || order.status === 'FAILED' ? order.updatedAt || null : null,
      state: order.status === 'FAILED' ? 'error' : laterThanValidation.includes(order.status) ? 'completed' : 'pending',
      icon: FileCheck2
    },
    {
      id: 'reply_generated',
      label: labels.replyGenerated,
      date: replyDraft?.createdAt ?? replyDraft?.updatedAt ?? null,
      state: replyDraftExists ? 'completed' : replyBranchSkipped ? 'skipped' : 'pending',
      icon: MessageSquareQuote
    },
    {
      id: 'reply_sent',
      label: labels.replySent,
      date: replyDraft?.sentAt ?? null,
      state: replySent ? 'completed' : replyBranchSkipped ? 'skipped' : 'pending',
      icon: Send
    },
    {
      id: 'customer_replied',
      label: labels.customerReplied,
      date: null,
      state:
        replySent && laterThanReady.includes(order.status)
          ? 'completed'
          : replySent && order.status === 'FAILED'
            ? 'error'
            : replyBranchSkipped
              ? 'skipped'
              : 'pending',
      icon: CheckCheck
    },
    {
      id: 'ready_for_xml',
      label: labels.readyForXml,
      date: laterThanReady.includes(order.status) ? order.updatedAt || null : null,
      state:
        order.status === 'CREATIVE_GEARS_REJECTED' || order.status === 'FAILED'
          ? 'error'
          : laterThanReady.includes(order.status)
            ? 'completed'
            : 'pending',
      icon: CircleCheckBig
    },
    {
      id: 'xml_sent',
      label: labels.xmlSent,
      date: latestXmlDeliveryDate,
      state:
        xmlFailed
          ? 'error'
          : latestXmlDeliveryStatus && normalizeStatus(latestXmlDeliveryStatus) !== 'PENDING'
            ? 'completed'
            : 'pending',
      icon: FileOutput
    },
    {
      id: 'creative_gears',
      label: labels.creativeGears,
      date: xmlAccepted || xmlRejected ? latestXmlDeliveryDate : null,
      state: xmlRejected ? 'error' : xmlAccepted ? 'completed' : 'pending',
      icon: CircleAlert
    }
  ];
}

function normalizeStatus(value: string | null | undefined) {
  return (value || '').trim().toUpperCase();
}

function toTime(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function StepStateBadge({state, locale}: {state: TimelineStepState; locale: Locale}) {
  const label = stepStateLabels[locale]?.[state] ?? stepStateLabels.en[state];
  const className =
    state === 'completed'
      ? 'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200'
      : state === 'error'
        ? 'border-destructive/40 bg-destructive/10 text-destructive'
        : state === 'skipped'
          ? 'border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200'
          : 'border-border bg-muted text-muted-foreground';

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${className}`}>
      {label}
    </span>
  );
}

const timelineStepLabels: Record<Locale, {
  emailReceived: string;
  aiProcessed: string;
  fieldsValidated: string;
  replyGenerated: string;
  replySent: string;
  customerReplied: string;
  readyForXml: string;
  xmlSent: string;
  creativeGears: string;
}> = {
  pt: {
    emailReceived: 'Email recebido',
    aiProcessed: 'IA processou pedido',
    fieldsValidated: 'Campos validados',
    replyGenerated: 'Resposta ao cliente gerada',
    replySent: 'Resposta enviada',
    customerReplied: 'Cliente respondeu',
    readyForXml: 'Pronto para XML',
    xmlSent: 'XML enviado',
    creativeGears: 'Creative Gears aceitou/rejeitou'
  },
  en: {
    emailReceived: 'Email received',
    aiProcessed: 'AI processed order',
    fieldsValidated: 'Fields validated',
    replyGenerated: 'Customer reply generated',
    replySent: 'Reply sent',
    customerReplied: 'Customer replied',
    readyForXml: 'Ready for XML',
    xmlSent: 'XML sent',
    creativeGears: 'Creative Gears accepted/rejected'
  },
  nl: {
    emailReceived: 'E-mail ontvangen',
    aiProcessed: 'AI verwerkte bestelling',
    fieldsValidated: 'Velden gevalideerd',
    replyGenerated: 'Klantantwoord gegenereerd',
    replySent: 'Antwoord verzonden',
    customerReplied: 'Klant reageerde',
    readyForXml: 'Klaar voor XML',
    xmlSent: 'XML verzonden',
    creativeGears: 'Creative Gears geaccepteerd/afgewezen'
  }
};

const stepStateLabels: Record<Locale, Record<TimelineStepState, string>> = {
  pt: {
    completed: 'Concluido',
    pending: 'Pendente',
    error: 'Erro',
    skipped: 'Pulado'
  },
  en: {
    completed: 'Completed',
    pending: 'Pending',
    error: 'Error',
    skipped: 'Skipped'
  },
  nl: {
    completed: 'Voltooid',
    pending: 'Open',
    error: 'Fout',
    skipped: 'Overgeslagen'
  }
};

'use client';

import {useLocale, useTranslations} from 'next-intl';

import {useEmail} from '@/hooks/use-email';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {Locale} from '@/i18n/routing';
import {formatDateTime} from './order-detail-utils';
import {OrderCollapsibleSection} from './OrderCollapsibleSection';
import {AttachmentCards} from '@/components/attachments/AttachmentCards';

export function OriginalEmailCard({emailMessageId}: {emailMessageId: string}) {
  const t = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const labels = emailSectionLabels[locale] ?? emailSectionLabels.en;

  const email = useEmail(emailMessageId);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="text-base">{t('originalEmail.title')}</CardTitle>
          <div className="mt-1 break-all font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {emailMessageId}
          </div>
        </div>
        {email.data ? <StatusBadge status={email.data.status ?? tCommon('na')} /> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {email.loading ? (
          <div className="text-sm text-muted-foreground">{tCommon('loading')}</div>
        ) : email.error ? (
          <div className="text-sm text-destructive">{String(email.error.message)}</div>
        ) : email.data ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard
                label={labels.senderDetails}
                value={email.data.fromName || email.data.fromEmail || tCommon('na')}
                secondary={email.data.fromName ? email.data.fromEmail : undefined}
              />
              <InfoCard
                label={t('originalEmail.receivedAt')}
                value={email.data.receivedAt ? formatDateTime(email.data.receivedAt, locale) : tCommon('na')}
              />
              <InfoCard
                label={t('originalEmail.subject')}
                value={email.data.subject || tCommon('na')}
                className="sm:col-span-2"
                title={email.data.subject || tCommon('na')}
              />
            </div>

            <OrderCollapsibleSection
              title={t('originalEmail.attachments')}
              description={labels.attachmentsDescription}
              defaultOpen={Boolean(email.data.attachments?.length)}
              badge={<Badge variant="outline">{email.data.attachments?.length ?? 0}</Badge>}
            >
              <AttachmentCards
                attachments={email.data.attachments}
                emptyLabel={t('originalEmail.noAttachments')}
              />
            </OrderCollapsibleSection>

            <OrderCollapsibleSection
              title={t('originalEmail.bodyText')}
              description={labels.bodyDescription}
              defaultOpen
            >
              {email.data.bodyText ? (
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-3 text-xs [overflow-wrap:anywhere]">
                  <code>{email.data.bodyText}</code>
                </pre>
              ) : (
                <div className="text-sm text-muted-foreground">{t('originalEmail.noBodyText')}</div>
              )}
            </OrderCollapsibleSection>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">{t('originalEmail.notLoaded')}</div>
        )}
      </CardContent>
    </Card>
  );
}

const emailSectionLabels: Record<Locale, {
  senderDetails: string;
  attachmentsDescription: string;
  bodyDescription: string;
}> = {
  pt: {
    senderDetails: 'Dados do remetente',
    attachmentsDescription: 'Arquivos enviados junto com o email original.',
    bodyDescription: 'Leia o conteudo completo sem perder a visao geral do pedido.'
  },
  en: {
    senderDetails: 'Sender details',
    attachmentsDescription: 'Files attached to the original email.',
    bodyDescription: 'Read the full message without losing the order context.'
  },
  nl: {
    senderDetails: 'Afzendergegevens',
    attachmentsDescription: 'Bestanden die bij de originele e-mail zijn meegestuurd.',
    bodyDescription: 'Lees het volledige bericht zonder het orderoverzicht te verliezen.'
  }
};

function InfoCard({
  label,
  value,
  secondary,
  className,
  title
}: {
  label: string;
  value: string;
  secondary?: string;
  className?: string;
  title?: string;
}) {
  return (
    <div className={className}>
      <div className="rounded-xl border bg-background p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 break-words text-sm font-medium [overflow-wrap:anywhere]" title={title ?? value}>{value}</div>
        {secondary ? <div className="mt-1 break-all text-xs text-muted-foreground [overflow-wrap:anywhere]">{secondary}</div> : null}
      </div>
    </div>
  );
}

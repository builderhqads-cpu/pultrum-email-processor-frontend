'use client';

import {useState} from 'react';
import {Mail} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';

import {useEmail} from '@/hooks/use-email';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {Locale} from '@/i18n/routing';
import {formatDateTime} from './order-detail-utils';
import {OrderCollapsibleSection} from './OrderCollapsibleSection';
import {AttachmentCards} from '@/components/attachments/AttachmentCards';
import {EmailOriginalDialog} from '@/components/emails/EmailOriginalDialog';

export function OriginalEmailCard({emailMessageId}: {emailMessageId: string}) {
  const t = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const labels = emailSectionLabels[locale] ?? emailSectionLabels.en;
  const [originalOpen, setOriginalOpen] = useState(false);

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
        <div className="flex shrink-0 items-center gap-2">
          {email.data ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setOriginalOpen(true)}
            >
              <Mail className="h-4 w-4" />
              {labels.viewOriginal}
            </Button>
          ) : null}
          {email.data ? <StatusBadge status={email.data.status ?? tCommon('na')} /> : null}
        </div>
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
              defaultOpen={Boolean(
                email.data.attachments?.length || email.data.emailDocument
              )}
              badge={
                <Badge variant="outline">
                  {(email.data.attachments?.length ?? 0) +
                    (email.data.emailDocument ? 1 : 0)}
                </Badge>
              }
            >
              {email.data.emailDocument || email.data.attachments?.length ? (
                <div className="flex w-full flex-col gap-3">
                  {/* Niek 2026-09-11: the original e-mail itself is sent as an XML
                      document (type 19), so list it here alongside the files. */}
                  {email.data.emailDocument ? (
                    <div className="flex w-full min-w-0 items-start justify-between gap-3 rounded-xl border bg-background p-4 shadow-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                          <Mail className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium" title={email.data.emailDocument.fileName}>
                            {email.data.emailDocument.fileName}
                          </div>
                          <div className="text-xs text-muted-foreground">{labels.emailDocument}</div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300"
                      >
                        {email.data.emailDocument.documentType}
                        {email.data.emailDocument.concerns ? ` · ${email.data.emailDocument.concerns}` : ''}
                      </Badge>
                    </div>
                  ) : null}

                  {email.data.attachments?.length ? (
                    <AttachmentCards attachments={email.data.attachments} />
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {t('originalEmail.noAttachments')}
                </div>
              )}
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

      <EmailOriginalDialog
        emailMessageId={emailMessageId}
        attachments={email.data?.attachments}
        open={originalOpen}
        onOpenChange={setOriginalOpen}
      />
    </Card>
  );
}

const emailSectionLabels: Record<Locale, {
  senderDetails: string;
  attachmentsDescription: string;
  bodyDescription: string;
  viewOriginal: string;
  emailDocument: string;
}> = {
  pt: {
    senderDetails: 'Dados do remetente',
    attachmentsDescription: 'Todos os documentos enviados no XML (o e-mail e os anexos).',
    bodyDescription: 'Leia o conteudo completo sem perder a visao geral do pedido.',
    viewOriginal: 'Ver original',
    emailDocument: 'E-mail original (enviado no XML)'
  },
  en: {
    senderDetails: 'Sender details',
    attachmentsDescription: 'Every document sent in the XML (the e-mail and the attachments).',
    bodyDescription: 'Read the full message without losing the order context.',
    viewOriginal: 'View original',
    emailDocument: 'Original e-mail (sent in the XML)'
  },
  nl: {
    senderDetails: 'Afzendergegevens',
    attachmentsDescription: 'Alle documenten die in de XML worden meegestuurd (de e-mail en de bijlagen).',
    bodyDescription: 'Lees het volledige bericht zonder het orderoverzicht te verliezen.',
    viewOriginal: 'Origineel bekijken',
    emailDocument: 'Originele e-mail (meegestuurd in de XML)'
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

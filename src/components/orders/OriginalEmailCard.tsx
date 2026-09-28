'use client';

import {useState} from 'react';
import {Mail, FileX2, Undo2} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';

import {useEmail} from '@/hooks/use-email';
import {setOrderDocumentExcluded} from '@/lib/api';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {Locale} from '@/i18n/routing';
import {formatDateTime} from './order-detail-utils';
import {OrderCollapsibleSection} from './OrderCollapsibleSection';
import {AttachmentCards} from '@/components/attachments/AttachmentCards';
import {EmailOriginalDialog} from '@/components/emails/EmailOriginalDialog';

/** Sentinel document id for the original .eml (see backend). */
const EMAIL_DOC_ID = 'email';

export function OriginalEmailCard({
  emailMessageId,
  orderId,
  excludedDocumentIds
}: {
  emailMessageId: string;
  /** When set (order detail), each XML document gets an include/exclude toggle. */
  orderId?: string;
  excludedDocumentIds?: string[];
}) {
  const t = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const labels = emailSectionLabels[locale] ?? emailSectionLabels.en;
  const [originalOpen, setOriginalOpen] = useState(false);
  const queryClient = useQueryClient();

  const email = useEmail(emailMessageId);

  const excludedSet = new Set(excludedDocumentIds ?? []);

  // Niek: include/exclude one document from THIS order's XML (reversible).
  const toggleDocument = useMutation({
    mutationFn: ({documentId, excluded}: {documentId: string; excluded: boolean}) =>
      setOrderDocumentExcluded(orderId as string, documentId, excluded),
    onSuccess: (_data, {excluded}) => {
      toast.success(excluded ? labels.removedToast : labels.addedToast);
      queryClient.invalidateQueries({queryKey: ['orders', orderId]});
      queryClient.invalidateQueries({queryKey: ['orders']});
    },
    onError: () => toast.error(labels.toggleError)
  });

  const emailExcluded = excludedSet.has(EMAIL_DOC_ID);
  const exclusion = orderId
    ? {
        excludedIds: excludedSet,
        pendingId: toggleDocument.isPending
          ? toggleDocument.variables?.documentId ?? null
          : null,
        onToggle: (documentId: string, excluded: boolean) =>
          toggleDocument.mutate({documentId, excluded})
      }
    : undefined;

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
                    <div className="flex w-full min-w-0 flex-col gap-3 rounded-xl border bg-background p-4 shadow-sm">
                      <div className="flex w-full min-w-0 items-start justify-between gap-3">
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
                        {emailExcluded ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
                          >
                            <FileX2 className="h-3.5 w-3.5" />
                            {labels.excludedBadge}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300"
                          >
                            {email.data.emailDocument.documentType}
                            {email.data.emailDocument.concerns ? ` · ${email.data.emailDocument.concerns}` : ''}
                          </Badge>
                        )}
                      </div>
                      {orderId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={
                            emailExcluded
                              ? 'w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/20'
                              : 'w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-950/20'
                          }
                          disabled={toggleDocument.isPending && toggleDocument.variables?.documentId === EMAIL_DOC_ID}
                          onClick={() =>
                            toggleDocument.mutate({documentId: EMAIL_DOC_ID, excluded: !emailExcluded})
                          }
                        >
                          {emailExcluded ? (
                            <>
                              <Undo2 className="h-4 w-4" />
                              {labels.includeInXml}
                            </>
                          ) : (
                            <>
                              <FileX2 className="h-4 w-4" />
                              {labels.excludeFromXml}
                            </>
                          )}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {email.data.attachments?.length ? (
                    <AttachmentCards attachments={email.data.attachments} exclusion={exclusion} />
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
  excludedBadge: string;
  excludeFromXml: string;
  includeInXml: string;
  removedToast: string;
  addedToast: string;
  toggleError: string;
}> = {
  pt: {
    senderDetails: 'Dados do remetente',
    attachmentsDescription: 'Todos os documentos enviados no XML (o e-mail e os anexos).',
    bodyDescription: 'Leia o conteudo completo sem perder a visao geral do pedido.',
    viewOriginal: 'Ver original',
    emailDocument: 'E-mail original (enviado no XML)',
    excludedBadge: 'Fora do XML',
    excludeFromXml: 'Tirar do XML',
    includeInXml: 'Incluir no XML',
    removedToast: 'Documento retirado do XML deste pedido',
    addedToast: 'Documento incluido no XML deste pedido',
    toggleError: 'Falha ao atualizar o documento'
  },
  en: {
    senderDetails: 'Sender details',
    attachmentsDescription: 'Every document sent in the XML (the e-mail and the attachments).',
    bodyDescription: 'Read the full message without losing the order context.',
    viewOriginal: 'View original',
    emailDocument: 'Original e-mail (sent in the XML)',
    excludedBadge: 'Excluded',
    excludeFromXml: 'Remove from XML',
    includeInXml: 'Add back to XML',
    removedToast: "Document removed from this order's XML",
    addedToast: "Document added back to this order's XML",
    toggleError: 'Failed to update the document'
  },
  nl: {
    senderDetails: 'Afzendergegevens',
    attachmentsDescription: 'Alle documenten die in de XML worden meegestuurd (de e-mail en de bijlagen).',
    bodyDescription: 'Lees het volledige bericht zonder het orderoverzicht te verliezen.',
    viewOriginal: 'Origineel bekijken',
    emailDocument: 'Originele e-mail (meegestuurd in de XML)',
    excludedBadge: 'Uitgesloten',
    excludeFromXml: 'Uit XML halen',
    includeInXml: 'Weer in XML',
    removedToast: 'Document uit de XML van deze opdracht gehaald',
    addedToast: 'Document weer in de XML van deze opdracht',
    toggleError: 'Bijwerken van het document is mislukt'
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

'use client';

import {useMemo, useState} from 'react';
import {FileText, Mail, Send, SquarePen} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {toast} from 'sonner';

import type {Locale} from '@/i18n/routing';
import type {OrderStatus, TransportOrder} from '@/types';
import {ApiError} from '@/lib/api';
import {useOrderActions} from '@/hooks/use-order-actions';
import {useReplyDraft, useSendReply, useUpdateReplyDraft} from '@/hooks/use-reply-draft';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {EmptyState} from '@/components/ui/empty-state';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {Textarea} from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

const visibleStatuses: OrderStatus[] = ['MISSING_INFORMATION', 'WAITING_CUSTOMER_RESPONSE'];

function isNotFound(err: unknown) {
  return err instanceof ApiError && err.status === 404;
}

function normalizeEscapes(input: string) {
  return (input || '')
    .replace(/\\\\r\\\\n/g, '\n')
    .replace(/\\\\n/g, '\n')
    .replace(/\\\\r/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n');
}

function bodyPreview(input: string) {
  const normalized = normalizeEscapes(input).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

export function CustomerReplyCard({
  orderId,
  order,
  onAfterSend
}: {
  orderId: string;
  order: TransportOrder;
  onAfterSend: () => Promise<unknown> | unknown;
}) {
  const t = useTranslations('orders.detail.replyDraft');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const labels = replyLabels[locale] ?? replyLabels.en;
  const actions = useOrderActions(orderId);

  const enabled = useMemo(() => visibleStatuses.includes(order.status), [order.status]);

  const draftQuery = useReplyDraft(orderId, enabled);
  const updateDraft = useUpdateReplyDraft(orderId);
  const sendReply = useSendReply(orderId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const sent = draftQuery.data?.status === 'SENT';
  // Editing/resending stays allowed after a send (e.g. reminders).
  const canEdit = Boolean(draftQuery.data);
  const hasChanges =
    Boolean(draftQuery.data) &&
    (toEmail !== (draftQuery.data?.toEmail || '') ||
      subject !== (draftQuery.data?.subject || '') ||
      body !== normalizeEscapes(draftQuery.data?.body || ''));

  if (!enabled) return null;

  function syncDraftToForm() {
    if (!draftQuery.data) return;
    setToEmail(draftQuery.data.toEmail || '');
    setSubject(draftQuery.data.subject || '');
    setBody(normalizeEscapes(draftQuery.data.body || ''));
  }

  async function onSave() {
    if (!draftQuery.data || !canEdit) return;
    const toastId = toast.loading(t('saving'));
    try {
      await updateDraft.mutateAsync({toEmail, subject, body});
      toast.success(t('saveSuccess'), {id: toastId});
      await draftQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? t('saveError'), {id: toastId});
    }
  }

  async function onSend({persistEditorChanges = false}: {persistEditorChanges?: boolean} = {}) {
    const toastId = toast.loading(t('sending'));
    try {
      if (persistEditorChanges && draftQuery.data && canEdit && hasChanges) {
        await updateDraft.mutateAsync({toEmail, subject, body});
      }
      await sendReply.mutateAsync();
      toast.success(t('sendSuccess'), {id: toastId});
      setEditorOpen(false);
      await onAfterSend();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? t('sendError'), {id: toastId});
    }
  }

  async function onGenerateViaAi() {
    const toastId = toast.loading(t('generating'));
    try {
      await actions.generateAiReply.mutateAsync();
      toast.success(t('generateSuccess'), {id: toastId});
      await draftQuery.refetch();
      await onAfterSend();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? t('generateError'), {id: toastId});
    }
  }

  if (draftQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (draftQuery.error && !isNotFound(draftQuery.error)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-destructive">{String(draftQuery.error.message)}</div>
          <Button variant="outline" size="sm" onClick={() => draftQuery.refetch()}>
            {tCommon('tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!draftQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={t('title')}
            description={t('noDraft')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={onGenerateViaAi}
                disabled={actions.generateAiReply.loading}
              >
                {actions.generateAiReply.loading ? tCommon('loading') : t('generate')}
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{t('title')}</CardTitle>
            <div className="mt-1 text-sm text-muted-foreground">
              {sent ? labels.sentStatus : labels.draftStatus}
            </div>
          </div>
          <Badge variant={sent ? 'secondary' : 'outline'}>
            {sent ? t('sent') : labels.draftBadge}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <ReplyInfoRow icon={<Mail className="h-4 w-4" />} label={t('to')} value={draftQuery.data.toEmail || tCommon('na')} />
          <ReplyInfoRow icon={<FileText className="h-4 w-4" />} label={t('subject')} value={draftQuery.data.subject || tCommon('na')} />

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">{labels.preview}</div>
            <div className="rounded-xl border bg-background p-3 text-sm text-foreground">
              {bodyPreview(draftQuery.data.body) || tCommon('na')}
            </div>
          </div>

          {sent ? (
            <div className="rounded-xl border bg-background p-3 text-xs text-muted-foreground">
              {t('sentReadonly')}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  syncDraftToForm();
                  setEditorOpen(true);
                }}
              >
                <SquarePen className="h-4 w-4" />
                {labels.edit}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="secondary" size="sm" className="gap-2" disabled={sendReply.isPending} />}
                >
                  <Send className="h-4 w-4" />
                  {sendReply.isPending
                    ? tCommon('loading')
                    : sent
                      ? t('resend')
                      : t('send')}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('confirmDesc')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                    <AlertDialogClose onClick={() => onSend()}>
                      {sent ? t('resend') : t('send')}
                    </AlertDialogClose>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{labels.edit}</DialogTitle>
            <DialogDescription>{labels.modalDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">{t('to')}</div>
                <Input value={toEmail} onChange={(e) => setToEmail(e.target.value)} disabled={!canEdit} />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">{t('subject')}</div>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canEdit} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">{t('body')}</div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={!canEdit}
                className="min-h-72"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onSave}
              disabled={!canEdit || !hasChanges || updateDraft.isPending}
            >
              {updateDraft.isPending ? tCommon('loading') : t('save')}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="secondary" disabled={!canEdit || sendReply.isPending} />}
              >
                {sendReply.isPending ? tCommon('loading') : t('send')}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('confirmDesc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogClose onClick={() => onSend({persistEditorChanges: true})}>
                    {t('send')}
                  </AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReplyInfoRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="truncate text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

const replyLabels: Record<Locale, {
  draftStatus: string;
  sentStatus: string;
  draftBadge: string;
  preview: string;
  edit: string;
  modalDescription: string;
}> = {
  pt: {
    draftStatus: 'Rascunho pronto para revisao',
    sentStatus: 'Historico da ultima resposta enviada',
    draftBadge: 'Rascunho',
    preview: 'Preview do corpo',
    edit: 'Editar resposta',
    modalDescription: 'Revise, ajuste e salve antes de enviar ao cliente.'
  },
  en: {
    draftStatus: 'Draft ready for review',
    sentStatus: 'History of the last sent reply',
    draftBadge: 'Draft',
    preview: 'Body preview',
    edit: 'Edit reply',
    modalDescription: 'Review, adjust, and save before sending to the customer.'
  },
  nl: {
    draftStatus: 'Concept klaar voor controle',
    sentStatus: 'Historie van het laatst verzonden antwoord',
    draftBadge: 'Concept',
    preview: 'Voorbeeld van de inhoud',
    edit: 'Antwoord bewerken',
    modalDescription: 'Controleer, pas aan en sla op voordat je naar de klant verzendt.'
  }
};

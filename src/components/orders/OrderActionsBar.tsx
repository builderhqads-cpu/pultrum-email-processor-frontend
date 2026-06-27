'use client';

import {useTranslations} from 'next-intl';
import {toast} from 'sonner';

import {ApiError} from '@/lib/api';
import {useOrderActions} from '@/hooks/use-order-actions';
import {useReplyDraft, useSendReply} from '@/hooks/use-reply-draft';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
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

function isNotFound(err: unknown) {
  return err instanceof ApiError && err.status === 404;
}

export function OrderActionsBar({
  orderId,
  canSendXml,
  onAfterAction,
  title,
  sticky = true,
  className
}: {
  orderId: string;
  canSendXml: boolean;
  onAfterAction: () => Promise<unknown> | unknown;
  title?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  const t = useTranslations('orders.detail');
  const tReply = useTranslations('orders.detail.replyDraft');
  const actions = useOrderActions(orderId);
  const sendReply = useSendReply(orderId);
  const draftQuery = useReplyDraft(orderId, true);

  const canSendReply = Boolean(draftQuery.data) && draftQuery.data?.status !== 'SENT';

  async function runAction(opts: {
    label: string;
    success: string;
    errorFallback: string;
    fn: () => Promise<unknown>;
  }) {
    const toastId = toast.loading(opts.label);
    try {
      await opts.fn();
      toast.success(opts.success, {id: toastId});
      await onAfterAction();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? opts.errorFallback, {id: toastId});
    }
  }

  return (
    <div
      className={cn(
        'min-w-0 rounded-2xl border bg-background/95 p-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80',
        sticky && 'sticky top-16 z-10',
        className
      )}
    >
      <div className="flex flex-col gap-3">
        {title ? <div className="text-sm font-semibold text-foreground">{title}</div> : null}
        <div className="grid grid-cols-1 gap-2">
          <ConfirmAction
            title={t('confirm.replyAiTitle')}
            description={t('confirm.replyAiDesc')}
            actionLabel={t('actions.generateReply')}
            variant="outline"
            loading={actions.generateAiReply.loading}
            onConfirm={() =>
              runAction({
                label: t('actions.generateReply'),
                success: t('toast.generateReplySuccess'),
                errorFallback: t('toast.generateReplyError'),
                fn: () => actions.generateAiReply.mutateAsync()
              })
            }
          />

          <ConfirmAction
            title={tReply('confirmTitle')}
            description={tReply('confirmDesc')}
            actionLabel={tReply('send')}
            variant="secondary"
            disabled={!canSendReply}
            loading={sendReply.isPending}
            onConfirm={() =>
              runAction({
                label: tReply('send'),
                success: tReply('sendSuccess'),
                errorFallback: tReply('sendError'),
                fn: () => sendReply.mutateAsync()
              })
            }
          />

          <ConfirmAction
            title={t('confirm.xmlTitle')}
            description={t('confirm.xmlDesc')}
            actionLabel={t('actions.sendXml')}
            variant="outline"
            disabled={!canSendXml}
            loading={actions.sendXml.loading}
            onConfirm={() =>
              runAction({
                label: t('actions.sendXml'),
                success: t('toast.sendXmlSuccess'),
                errorFallback: t('toast.sendXmlError'),
                fn: () => actions.sendXml.mutateAsync()
              })
            }
          />

          <ConfirmAction
            title={t('confirm.reprocessTitle')}
            description={t('confirm.reprocessDesc')}
            actionLabel={t('actions.reprocess')}
            variant="outline"
            loading={actions.reprocess.loading}
            onConfirm={() =>
              runAction({
                label: t('actions.reprocess'),
                success: t('toast.reprocessSuccess'),
                errorFallback: t('toast.reprocessError'),
                fn: () => actions.reprocess.mutateAsync()
              })
            }
          />
        </div>

        <div className="flex flex-col gap-1 text-xs text-destructive">
          {draftQuery.error && !isNotFound(draftQuery.error) ? (
            <div>{String(draftQuery.error.message)}</div>
          ) : null}
          {sendReply.error ? <div>{String(sendReply.error.message)}</div> : null}
          {actions.reprocess.error ? <div>{String(actions.reprocess.error.message)}</div> : null}
          {actions.generateAiReply.error ? <div>{String(actions.generateAiReply.error.message)}</div> : null}
          {actions.sendXml.error ? <div>{String(actions.sendXml.error.message)}</div> : null}
        </div>
      </div>
    </div>
  );
}

function ConfirmAction({
  title,
  description,
  actionLabel,
  variant = 'secondary',
  className,
  disabled,
  loading,
  onConfirm
}: {
  title: string;
  description: string;
  actionLabel: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
  loading: boolean;
  onConfirm: () => void;
}) {
  const tCommon = useTranslations('common');

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant={variant}
            size="sm"
            className={cn(
              'h-auto w-full justify-center whitespace-normal px-3 py-2 text-center leading-5',
              className
            )}
            disabled={disabled || loading}
          />
        }
      >
        {loading ? tCommon('loading') : actionLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
          <AlertDialogClose onClick={onConfirm}>{actionLabel}</AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

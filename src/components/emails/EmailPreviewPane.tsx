'use client';

import {
  AlertTriangle,
  Bot,
  ExternalLink,
  Inbox,
  RefreshCw,
  SearchCheck,
  Trash2
} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';

import {Link} from '@/i18n/navigation';
import {useEmail} from '@/hooks/use-email';
import {useOrderActions} from '@/hooks/use-order-actions';
import {useEmailClassificationActions} from '@/hooks/use-email-classification';
import {EmailDetailsCard} from '@/components/emails/EmailDetailsCard';
import {Button, buttonVariants} from '@/components/ui/button';
import {EmptyState} from '@/components/ui/empty-state';
import {Skeleton} from '@/components/ui/skeleton';

export function EmailPreviewPane({
  emailId,
  deleteLabel,
  deleting,
  onDeleteRequest
}: {
  emailId: string;
  deleteLabel: string;
  deleting: boolean;
  onDeleteRequest: () => void;
}) {
  const t = useTranslations('emails.detail');
  const tOrder = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const email = useEmail(emailId);
  const order = email.data?.order ?? null;
  const actions = useOrderActions(order?.id ?? '');
  const classification = useEmailClassificationActions();

  async function runOrderAction(opts: {
    fn: () => Promise<unknown>;
    label: string;
    success: string;
    error: string;
  }) {
    const toastId = toast.loading(opts.label);
    try {
      await opts.fn();
      toast.success(opts.success, {id: toastId});
      await email.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? opts.error, {id: toastId});
    }
  }

  const actionBar = (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-end gap-2 border-b bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/80">
      {order ? (
        <>
          <Link
            href={`/orders/${order.id}`}
            className={buttonVariants({variant: 'outline', size: 'sm'})}
          >
            <ExternalLink className="h-4 w-4" />
            {t('openLinkedOrder')}
          </Link>
          <Button
            size="sm"
            disabled={actions.processWithAi.loading}
            onClick={() =>
              runOrderAction({
                fn: () => actions.processWithAi.mutateAsync(),
                label: tOrder('actions.processWithAi'),
                success: tOrder('toast.processWithAiSuccess'),
                error: tOrder('toast.processWithAiError')
              })
            }
          >
            <Bot className="h-4 w-4" />
            {tOrder('actions.processWithAi')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={actions.reprocess.loading}
            onClick={() =>
              runOrderAction({
                fn: () => actions.reprocess.mutateAsync(),
                label: tOrder('actions.reprocess'),
                success: tOrder('toast.reprocessSuccess'),
                error: tOrder('toast.reprocessError')
              })
            }
          >
            <RefreshCw className="h-4 w-4" />
            {tOrder('actions.reprocess')}
          </Button>
        </>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        disabled={classification.reclassify.isPending}
        onClick={() =>
          runOrderAction({
            fn: () => classification.reclassify.mutateAsync(emailId),
            label: t('classification.reclassify'),
            success: t('classification.reclassifySuccess'),
            error: t('classification.reclassifyError')
          })
        }
      >
        <SearchCheck className="h-4 w-4" />
        {t('classification.reclassify')}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={deleting}
        onClick={onDeleteRequest}
      >
        <Trash2 className="h-4 w-4" />
        {deleteLabel}
      </Button>
    </div>
  );

  if (email.loading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {actionBar}
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (email.error) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {actionBar}
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {String(email.error.message)}
          </div>
          <Button className="mt-3" onClick={() => email.refetch()}>
            {tCommon('tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  if (!email.data) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {actionBar}
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <EmptyState icon={Inbox} title={t('empty')} description={t('empty')} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {actionBar}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {email.data.isTransportOrder === false ? (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              {t('classification.notTransportTitle')}
            </div>
            {email.data.classificationReason ? (
              <div className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
                {email.data.classificationReason}
              </div>
            ) : null}
            <Button
              className="mt-3"
              size="sm"
              disabled={classification.processAnyway.isPending}
              onClick={() =>
                runOrderAction({
                  fn: () => classification.processAnyway.mutateAsync(emailId),
                  label: t('classification.processAnyway'),
                  success: t('classification.processAnywaySuccess'),
                  error: t('classification.processAnywayError')
                })
              }
            >
              {t('classification.processAnyway')}
            </Button>
          </div>
        ) : null}
        <EmailDetailsCard email={email.data} />
      </div>
    </div>
  );
}

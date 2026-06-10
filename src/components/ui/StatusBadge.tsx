'use client';

import {Badge} from '@/components/ui/badge';
import type {EmailStatus, OrderStatus, XmlDeliveryStatus} from '@/types';
import {cn} from '@/lib/utils';
import {useMessages} from 'next-intl';
import {getMessageString, type Messages} from '@/i18n/message-utils';

export function StatusBadge({
  status,
  className
}: {
  status: EmailStatus | OrderStatus | XmlDeliveryStatus | string;
  className?: string;
}) {
  const messages = useMessages() as Messages;

  const label =
    getMessageString(messages, `enums.emailStatus.${status}`) ||
    getMessageString(messages, `enums.orderStatus.${status}`) ||
    getMessageString(messages, `enums.xmlDeliveryStatus.${status}`) ||
    getMessageString(messages, `enums.generic.${status}`) ||
    status;

  const tone =
    status === 'FAILED' || status === 'CREATIVE_GEARS_REJECTED' || status === 'REJECTED'
      ? 'red'
      : status === 'MISSING_INFORMATION' || status === 'WAITING_CUSTOMER_RESPONSE'
        ? 'yellow'
      : status === 'READY_TO_XML' || status === 'CREATIVE_GEARS_ACCEPTED' || status === 'ACCEPTED'
          ? 'green'
        : status === 'AI_PROCESSING' || status === 'PROCESSING'
          ? 'blue'
            : status === 'MANUAL_REVIEW'
              ? 'purple'
              : status === 'PROCESSED' || status === 'SUCCEEDED'
                ? 'neutral'
                : 'outline';

  const toneClassName =
    tone === 'red'
      ? 'border-destructive/30 bg-destructive/10 text-destructive'
      : tone === 'yellow'
        ? 'border-yellow-300/80 bg-yellow-100 text-yellow-950 dark:border-yellow-900/40 dark:bg-yellow-950/40 dark:text-yellow-200'
        : tone === 'blue'
          ? 'border-blue-300/80 bg-blue-100 text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200'
          : tone === 'green'
            ? 'border-emerald-300/80 bg-emerald-100 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200'
            : tone === 'purple'
              ? 'border-violet-300/80 bg-violet-100 text-violet-950 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-200'
              : tone === 'neutral'
                ? 'border-border bg-muted text-foreground'
                : undefined;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex max-w-full min-w-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]',
        toneClassName,
        className
      )}
      title={label}
    >
      <span className="block min-w-0 truncate">{label}</span>
    </Badge>
  );
}

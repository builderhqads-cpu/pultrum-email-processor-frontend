'use client';

import {useLocale, useMessages, useTranslations} from 'next-intl';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {getMessageString, type Messages} from '@/i18n/message-utils';
import type {Locale} from '@/i18n/routing';
import {formatDateTime} from '@/components/orders/order-detail-utils';
import type {EmailMessage} from '@/types';
import {EmailOriginalView} from '@/components/emails/EmailOriginalView';

export function EmailDetailsCard({email}: {email: EmailMessage}) {
  const t = useTranslations('emails.detail');
  const tCommon = useTranslations('common');
  const messages = useMessages() as Messages;
  const locale = useLocale() as Locale;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="truncate text-base" title={email.subject || tCommon('na')}>
            {email.subject || tCommon('na')}
          </CardTitle>
          <div className="mt-1 truncate text-sm text-muted-foreground" title={email.fromEmail || tCommon('na')}>
            {email.fromEmail || tCommon('na')}
          </div>
        </div>
        <StatusBadge status={email.status ?? tCommon('na')} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">{t('labels.mailbox')}</div>
            <div className="truncate">{email.mailbox.email}</div>
            <div className="text-xs text-muted-foreground">
              {email.mailbox.department
                ? getMessageString(messages, `enums.department.${email.mailbox.department}`) ?? email.mailbox.department
                : tCommon('na')}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('labels.receivedAt')}</div>
            <div>{formatDateTime(email.receivedAt, locale)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('labels.hasAttachments')}</div>
            <div>{email.hasAttachments ? t('yes') : t('no')}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('labels.conversation')}</div>
            <div className="break-all font-mono text-xs [overflow-wrap:anywhere]">
              {email.conversationId ?? tCommon('na')}
            </div>
          </div>
        </div>

        {/* The email as received (rendered HTML + attachment chips), which is
            clearer and more faithful than the raw text + big attachment cards. */}
        <EmailOriginalView
          emailMessageId={email.id}
          attachments={email.attachments}
          heightClassName="h-[52vh]"
        />
      </CardContent>
    </Card>
  );
}

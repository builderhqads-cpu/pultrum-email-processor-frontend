'use client';

import {useLocale} from 'next-intl';

import type {Attachment} from '@/types';
import type {Locale} from '@/i18n/routing';
import {EmailOriginalView} from '@/components/emails/EmailOriginalView';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function EmailOriginalDialog({
  emailMessageId,
  attachments,
  open,
  onOpenChange
}: {
  emailMessageId: string;
  attachments?: Attachment[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = useLocale() as Locale;
  const labels = dialogLabels[locale] ?? dialogLabels.en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.subtitle}</DialogDescription>
        </DialogHeader>

        {/* Only fetch/render once the dialog is open. */}
        {open ? (
          <EmailOriginalView
            emailMessageId={emailMessageId}
            attachments={attachments}
          />
        ) : null}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

const dialogLabels: Record<Locale, {title: string; subtitle: string}> = {
  pt: {
    title: 'E-mail original',
    subtitle: 'Como o e-mail chegou na caixa de entrada.'
  },
  en: {
    title: 'Original email',
    subtitle: 'How the email arrived in the inbox.'
  },
  nl: {
    title: 'Originele e-mail',
    subtitle: 'Zoals de e-mail in de inbox aankwam.'
  }
};

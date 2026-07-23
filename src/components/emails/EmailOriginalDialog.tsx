'use client';

import {useMemo, useState} from 'react';
import {AlertTriangle, ImageOff, LoaderCircle} from 'lucide-react';
import {useLocale} from 'next-intl';

import type {Attachment} from '@/types';
import type {Locale} from '@/i18n/routing';
import {useEmailOriginal} from '@/hooks/use-email-original';
import {AttachmentCards} from '@/components/attachments/AttachmentCards';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

/**
 * Wrap the (trusted-by-us but authored-by-a-stranger) email HTML in a locked-down
 * document. Two independent guards:
 *  - the iframe `sandbox=""` disables scripts, forms and navigation;
 *  - a CSP meta blocks everything except inline styles and images. Remote images
 *    (tracking pixels) are only allowed when the user opts in.
 */
function buildSrcDoc(html: string, allowRemoteImages: boolean) {
  const imgSrc = allowRemoteImages ? 'img-src data: https: http:' : 'img-src data:';
  const csp = [
    "default-src 'none'",
    imgSrc,
    "style-src 'unsafe-inline'",
    'font-src data:'
  ].join('; ');

  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>html,body{margin:0;padding:12px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:14px;word-break:break-word;overflow-wrap:anywhere}img{max-width:100%;height:auto}a{pointer-events:none}</style></head><body>${html}</body></html>`;
}

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
  const [showRemote, setShowRemote] = useState(false);

  // Only fetch once the dialog is open.
  const original = useEmailOriginal(emailMessageId, open);
  const data = original.data;

  const srcDoc = useMemo(
    () => (data?.html ? buildSrcDoc(data.html, showRemote) : ''),
    [data?.html, showRemote]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>
            {data?.subject || labels.subtitle}
          </DialogDescription>
        </DialogHeader>

        {original.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {labels.loading}
          </div>
        ) : original.error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{String(original.error.message)}</span>
          </div>
        ) : data && data.source !== 'empty' ? (
          <div className="space-y-3">
            {attachments && attachments.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">
                  {labels.attachments} ({attachments.length})
                </div>
                <AttachmentCards attachments={attachments} variant="compact" />
              </div>
            ) : null}

            {data.hasRemoteImages && !showRemote ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                <span className="flex items-center gap-2">
                  <ImageOff className="h-4 w-4 shrink-0" />
                  {labels.remoteBlocked}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRemote(true)}
                >
                  {labels.showImages}
                </Button>
              </div>
            ) : null}

            <iframe
              // Locked down: no scripts, forms or navigation. See buildSrcDoc.
              sandbox=""
              srcDoc={srcDoc}
              title={labels.title}
              className="h-[60vh] w-full rounded-lg border bg-white"
            />
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {labels.empty}
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

const dialogLabels: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    loading: string;
    empty: string;
    remoteBlocked: string;
    showImages: string;
    attachments: string;
  }
> = {
  pt: {
    title: 'E-mail original',
    subtitle: 'Como o e-mail chegou na caixa de entrada.',
    loading: 'Carregando e-mail...',
    empty: 'Sem conteudo para exibir.',
    remoteBlocked: 'Imagens externas bloqueadas (podem rastrear a abertura).',
    showImages: 'Exibir imagens',
    attachments: 'Anexos'
  },
  en: {
    title: 'Original email',
    subtitle: 'How the email arrived in the inbox.',
    loading: 'Loading email...',
    empty: 'Nothing to display.',
    remoteBlocked: 'External images blocked (they can track when it is opened).',
    showImages: 'Show images',
    attachments: 'Attachments'
  },
  nl: {
    title: 'Originele e-mail',
    subtitle: 'Zoals de e-mail in de inbox aankwam.',
    loading: 'E-mail laden...',
    empty: 'Niets om weer te geven.',
    remoteBlocked: 'Externe afbeeldingen geblokkeerd (kunnen openen volgen).',
    showImages: 'Afbeeldingen tonen',
    attachments: 'Bijlagen'
  }
};

'use client';

import {useState} from 'react';
import {AlertTriangle, CheckCircle2, Download, Eye, FileText, ImageIcon, LoaderCircle} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';

import type {Attachment, Locale} from '@/types';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {cn} from '@/lib/utils';

type AttachmentCardsProps = {
  attachments?: Attachment[] | null;
  emptyLabel?: string;
};

export function AttachmentCards({
  attachments,
  emptyLabel
}: AttachmentCardsProps) {
  const locale = useLocale() as Locale;
  const tCommon = useTranslations('common');
  const labels = attachmentLabels[locale] ?? attachmentLabels.en;
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);

  const list = attachments ?? [];
  const selectedAttachment =
    list.find((attachment) => attachment.id === selectedAttachmentId) ?? null;

  if (!list.length) {
    return <div className="text-sm text-muted-foreground">{emptyLabel ?? labels.noAttachments}</div>;
  }

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        {list.map((attachment) => {
          const extractionStatus = getAttachmentExtractionStatus(attachment);
          const extractionTone = getAttachmentExtractionTone(extractionStatus);
          const canViewExtractedText = Boolean(attachment.extractedText?.trim());
          const canDownload = Boolean(attachment.downloadUrl || attachment.contentBase64);

          return (
            <div
              key={attachment.id}
              className="flex w-full min-w-0 flex-col rounded-xl border bg-background p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div
                    className="line-clamp-2 text-sm font-medium break-all [overflow-wrap:anywhere]"
                    title={attachment.fileName || tCommon('na')}
                  >
                    {attachment.fileName || tCommon('na')}
                  </div>
                  <div
                    className="text-xs text-muted-foreground break-all [overflow-wrap:anywhere]"
                    title={attachment.mimeType || tCommon('na')}
                  >
                    {attachment.mimeType || tCommon('na')}
                  </div>
                </div>
                <Badge className={cn('shrink-0', extractionTone.badgeClassName)} variant="outline">
                  {extractionTone.icon}
                  <span>{labels.statuses[extractionStatus] ?? extractionStatus}</span>
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm xl:grid-cols-2">
                <MetaItem label={labels.typeLabel} value={attachment.mimeType || tCommon('na')} />
                <MetaItem label={labels.sizeLabel} value={formatAttachmentSize(attachment.size)} />
                <MetaItem
                  label={labels.extractionLabel}
                  value={labels.statuses[extractionStatus] ?? extractionStatus}
                />
                <MetaItem
                  label={labels.methodLabel}
                  value={attachment.extractionMethod || tCommon('na')}
                />
              </div>

              {extractionStatus === 'FAILED' ? (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{labels.failedAlert}</span>
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full min-w-0 whitespace-normal break-words"
                  onClick={() => setSelectedAttachmentId(attachment.id)}
                  disabled={!canViewExtractedText}
                >
                  <Eye className="h-4 w-4" />
                  {labels.viewExtractedText}
                </Button>

                {canDownload ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full min-w-0 whitespace-normal break-words"
                    onClick={() => downloadAttachment(attachment)}
                  >
                    <Download className="h-4 w-4" />
                    {labels.download}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(selectedAttachment)} onOpenChange={(open) => !open && setSelectedAttachmentId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{labels.extractedTextTitle}</DialogTitle>
            <DialogDescription>
              {selectedAttachment?.fileName ?? tCommon('na')}
            </DialogDescription>
          </DialogHeader>

          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-xs text-foreground/90">
            {selectedAttachment?.extractedText ?? tCommon('na')}
          </pre>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetaItem({label, value}: {label: string; value: string}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className="text-sm break-all [overflow-wrap:anywhere]"
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function formatAttachmentSize(size?: number | null) {
  if (size == null || Number.isNaN(size)) return '0 B';

  if (size < 1024) return `${size} B`;

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function isImageAttachment(attachment: Attachment) {
  const mime = (attachment.mimeType || '').toLowerCase();
  const name = (attachment.fileName || '').toLowerCase();
  return mime.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|tiff?)$/.test(name);
}

function getAttachmentExtractionStatus(attachment: Attachment) {
  if (attachment.extractedText?.trim()) return 'SUCCESS';
  // Images are attached as-is but not text-extracted (computer vision is
  // paused). Show a neutral state, never an extraction-failure error.
  if (isImageAttachment(attachment)) return 'IMAGE';
  if (attachment.extractionStatus) return attachment.extractionStatus;
  if (attachment.contentBase64) return 'PENDING';
  return 'FAILED';
}

function getAttachmentExtractionTone(status: string) {
  switch (status) {
    case 'SUCCESS':
      return {
        badgeClassName: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />
      };
    case 'FAILED':
      return {
        badgeClassName: 'border-destructive/30 bg-destructive/5 text-destructive',
        icon: <AlertTriangle className="h-3.5 w-3.5" />
      };
    case 'OCR_REQUIRED':
      return {
        badgeClassName: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-900/40 dark:bg-yellow-950/20 dark:text-yellow-300',
        icon: <FileText className="h-3.5 w-3.5" />
      };
    case 'IMAGE':
      return {
        badgeClassName: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
        icon: <ImageIcon className="h-3.5 w-3.5" />
      };
    default:
      return {
        badgeClassName: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300',
        icon: <LoaderCircle className="h-3.5 w-3.5" />
      };
  }
}

function downloadAttachment(attachment: Attachment) {
  if (typeof window === 'undefined') return;

  if (attachment.downloadUrl) {
    window.open(attachment.downloadUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!attachment.contentBase64) return;

  const byteString = window.atob(attachment.contentBase64);
  const bytes = new Uint8Array(byteString.length);

  for (let index = 0; index < byteString.length; index += 1) {
    bytes[index] = byteString.charCodeAt(index);
  }

  const blob = new Blob([bytes], {
    type: attachment.mimeType || 'application/octet-stream'
  });

  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = attachment.fileName || 'attachment';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

const attachmentLabels: Record<
  Locale,
  {
    noAttachments: string;
    typeLabel: string;
    sizeLabel: string;
    extractionLabel: string;
    methodLabel: string;
    viewExtractedText: string;
    download: string;
    extractedTextTitle: string;
    failedAlert: string;
    statuses: Record<string, string>;
  }
> = {
  pt: {
    noAttachments: 'Sem anexos',
    typeLabel: 'Tipo',
    sizeLabel: 'Tamanho',
    extractionLabel: 'Status de extracao',
    methodLabel: 'Metodo',
    viewExtractedText: 'Visualizar texto extraido',
    download: 'Baixar',
    extractedTextTitle: 'Texto extraido do anexo',
    failedAlert: 'Falha na extracao do texto deste anexo.',
    statuses: {
      PENDING: 'Pendente',
      SUCCESS: 'Extraido',
      FAILED: 'Falhou',
      OCR_REQUIRED: 'OCR necessario',
      IMAGE: 'Imagem anexada'
    }
  },
  en: {
    noAttachments: 'No attachments',
    typeLabel: 'Type',
    sizeLabel: 'Size',
    extractionLabel: 'Extraction status',
    methodLabel: 'Method',
    viewExtractedText: 'View extracted text',
    download: 'Download',
    extractedTextTitle: 'Extracted text from attachment',
    failedAlert: 'Text extraction failed for this attachment.',
    statuses: {
      PENDING: 'Pending',
      SUCCESS: 'Extracted',
      FAILED: 'Failed',
      OCR_REQUIRED: 'OCR required',
      IMAGE: 'Image attached'
    }
  },
  nl: {
    noAttachments: 'Geen bijlagen',
    typeLabel: 'Type',
    sizeLabel: 'Grootte',
    extractionLabel: 'Extractiestatus',
    methodLabel: 'Methode',
    viewExtractedText: 'Geextraheerde tekst bekijken',
    download: 'Downloaden',
    extractedTextTitle: 'Geextraheerde tekst van bijlage',
    failedAlert: 'Tekstextractie is mislukt voor deze bijlage.',
    statuses: {
      PENDING: 'In behandeling',
      SUCCESS: 'Geextraheerd',
      FAILED: 'Mislukt',
      OCR_REQUIRED: 'OCR nodig',
      IMAGE: 'Afbeelding bijgevoegd'
    }
  }
};

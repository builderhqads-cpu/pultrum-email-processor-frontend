'use client';

import {useEffect, useState} from 'react';
import {AlertTriangle, CheckCircle2, Download, ExternalLink, Eye, FileText, ImageIcon, LoaderCircle} from 'lucide-react';
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
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);

  const list = attachments ?? [];
  const selectedAttachment =
    list.find((attachment) => attachment.id === selectedAttachmentId) ?? null;
  const previewAttachment =
    list.find((attachment) => attachment.id === previewAttachmentId) ?? null;

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
          const canViewFile = canDownload && isViewableAttachment(attachment);
          // DOCX/XLS can't render in a browser tab, so they open an in-app
          // preview (DOCX -> HTML, XLS -> tables) instead.
          const canPreviewOffice = canDownload && isOfficePreviewable(attachment);

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
                {canViewFile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full min-w-0 whitespace-normal break-words"
                    onClick={() => viewAttachment(attachment)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {labels.viewFile}
                  </Button>
                ) : null}

                {canPreviewOffice ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full min-w-0 whitespace-normal break-words"
                    onClick={() => setPreviewAttachmentId(attachment.id)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {labels.viewFile}
                  </Button>
                ) : null}

                {canViewExtractedText ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full min-w-0 whitespace-normal break-words"
                    onClick={() => setSelectedAttachmentId(attachment.id)}
                  >
                    <Eye className="h-4 w-4" />
                    {labels.viewExtractedText}
                  </Button>
                ) : null}

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

      <OfficePreviewDialog
        attachment={previewAttachment}
        labels={labels}
        onClose={() => setPreviewAttachmentId(null)}
      />
    </>
  );
}

/** In-app preview for DOCX (-> HTML) and XLS/XLSX (-> tables). The conversion
 *  libraries are loaded on demand so they don't weigh on the main bundle. */
function OfficePreviewDialog({
  attachment,
  labels,
  onClose
}: {
  attachment: Attachment | null;
  labels: AttachmentLabels;
  onClose: () => void;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    html?: string;
    error?: boolean;
  }>({loading: true});

  useEffect(() => {
    if (!attachment) return;
    let cancelled = false;
    setState({loading: true});

    (async () => {
      try {
        const buffer = await getAttachmentArrayBuffer(attachment);
        if (!buffer) throw new Error('no-content');
        const kind = officeKind(attachment);
        let html = '';

        if (kind === 'docx') {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({arrayBuffer: buffer});
          html = (result.value || '').trim();
        } else if (kind === 'xls') {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(buffer, {type: 'array'});
          html = workbook.SheetNames.map((name) => {
            const sheet = workbook.Sheets[name];
            const table = XLSX.utils.sheet_to_html(sheet);
            return `<h3>${escapeHtml(name)}</h3>${table}`;
          }).join('');
        }

        if (!cancelled) setState({loading: false, html});
      } catch {
        if (!cancelled) setState({loading: false, error: true});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachment]);

  return (
    <Dialog open={Boolean(attachment)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{labels.previewTitle}</DialogTitle>
          <DialogDescription>{attachment?.fileName ?? ''}</DialogDescription>
        </DialogHeader>

        {state.loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {labels.previewLoading}
          </div>
        ) : state.error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{labels.previewError}</span>
          </div>
        ) : state.html ? (
          <div
            className="max-h-[70vh] overflow-auto rounded-lg border bg-background p-4 text-sm leading-relaxed [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-semibold [&_p]:my-2 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1"
            // mammoth/SheetJS emit structured, script-free HTML built from the
            // document model (no raw passthrough), so this is safe to render.
            dangerouslySetInnerHTML={{__html: state.html}}
          />
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {labels.previewEmpty}
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
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
  if (attachment.extractionStatus === 'FAILED') return 'FAILED';
  if (attachment.extractionStatus === 'OCR_REQUIRED') return 'OCR_REQUIRED';
  // Images stay neutral (computer vision paused).
  if (isImageAttachment(attachment)) return 'IMAGE';
  // Any other attachment with no extracted text: we no longer extract it (the
  // AI parses the .eml on its side). Show a neutral "attached" state instead of
  // a spinning "pending", and never an extraction-failure error.
  if (attachment.downloadUrl || attachment.contentBase64) return 'ATTACHED';
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
    case 'ATTACHED':
      return {
        badgeClassName: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
        icon: <FileText className="h-3.5 w-3.5" />
      };
    default:
      return {
        badgeClassName: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300',
        icon: <LoaderCircle className="h-3.5 w-3.5" />
      };
  }
}

function isViewableAttachment(attachment: Attachment) {
  const mime = (attachment.mimeType || '').toLowerCase();
  const name = (attachment.fileName || '').toLowerCase();
  return (
    mime === 'application/pdf' ||
    mime.startsWith('image/') ||
    /\.(pdf|jpe?g|png|webp|gif|bmp|tiff?)$/.test(name)
  );
}

function officeKind(attachment: Attachment): 'docx' | 'xls' | null {
  const mime = (attachment.mimeType || '').toLowerCase();
  const name = (attachment.fileName || '').toLowerCase();
  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    /\.docx$/.test(name)
  ) {
    return 'docx';
  }
  if (
    mime === 'application/vnd.ms-excel' ||
    mime ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    /\.(xlsx?|xlsm|csv)$/.test(name)
  ) {
    return 'xls';
  }
  return null;
}

function isOfficePreviewable(attachment: Attachment) {
  return officeKind(attachment) !== null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Get the raw bytes of an attachment (stored base64 first, else the URL). */
async function getAttachmentArrayBuffer(
  attachment: Attachment
): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined') return null;

  if (attachment.contentBase64) {
    const byteString = window.atob(attachment.contentBase64);
    const bytes = new Uint8Array(byteString.length);
    for (let index = 0; index < byteString.length; index += 1) {
      bytes[index] = byteString.charCodeAt(index);
    }
    return bytes.buffer;
  }

  if (attachment.downloadUrl) {
    const response = await fetch(attachment.downloadUrl, {
      credentials: 'include'
    });
    if (!response.ok) return null;
    return response.arrayBuffer();
  }

  return null;
}

/** Open the attachment in a new tab (browser renders PDFs/images inline). */
function viewAttachment(attachment: Attachment) {
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
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  // Revoke later so the new tab has time to load the document.
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
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

type AttachmentLabels = {
  noAttachments: string;
  typeLabel: string;
  sizeLabel: string;
  extractionLabel: string;
  methodLabel: string;
  viewFile: string;
  viewExtractedText: string;
  download: string;
  extractedTextTitle: string;
  failedAlert: string;
  previewTitle: string;
  previewLoading: string;
  previewError: string;
  previewEmpty: string;
  statuses: Record<string, string>;
};

const attachmentLabels: Record<Locale, AttachmentLabels> = {
  pt: {
    noAttachments: 'Sem anexos',
    typeLabel: 'Tipo',
    sizeLabel: 'Tamanho',
    extractionLabel: 'Status de extracao',
    methodLabel: 'Metodo',
    viewFile: 'Visualizar anexo',
    viewExtractedText: 'Visualizar texto extraido',
    download: 'Baixar',
    extractedTextTitle: 'Texto extraido do anexo',
    failedAlert: 'Falha na extracao do texto deste anexo.',
    previewTitle: 'Visualizacao do anexo',
    previewLoading: 'Carregando visualizacao...',
    previewError: 'Nao foi possivel visualizar este arquivo. Tente baixar.',
    previewEmpty: 'Documento vazio.',
    statuses: {
      PENDING: 'Pendente',
      SUCCESS: 'Extraido',
      FAILED: 'Falhou',
      OCR_REQUIRED: 'OCR necessario',
      IMAGE: 'Imagem anexada',
      ATTACHED: 'Anexado'
    }
  },
  en: {
    noAttachments: 'No attachments',
    typeLabel: 'Type',
    sizeLabel: 'Size',
    extractionLabel: 'Extraction status',
    methodLabel: 'Method',
    viewFile: 'View file',
    viewExtractedText: 'View extracted text',
    download: 'Download',
    extractedTextTitle: 'Extracted text from attachment',
    failedAlert: 'Text extraction failed for this attachment.',
    previewTitle: 'Attachment preview',
    previewLoading: 'Loading preview...',
    previewError: 'Could not preview this file. Try downloading it.',
    previewEmpty: 'Empty document.',
    statuses: {
      PENDING: 'Pending',
      SUCCESS: 'Extracted',
      FAILED: 'Failed',
      OCR_REQUIRED: 'OCR required',
      IMAGE: 'Image attached',
      ATTACHED: 'Attached'
    }
  },
  nl: {
    noAttachments: 'Geen bijlagen',
    typeLabel: 'Type',
    sizeLabel: 'Grootte',
    extractionLabel: 'Extractiestatus',
    methodLabel: 'Methode',
    viewFile: 'Bijlage bekijken',
    viewExtractedText: 'Geextraheerde tekst bekijken',
    download: 'Downloaden',
    extractedTextTitle: 'Geextraheerde tekst van bijlage',
    failedAlert: 'Tekstextractie is mislukt voor deze bijlage.',
    previewTitle: 'Bijlage bekijken',
    previewLoading: 'Voorbeeld laden...',
    previewError: 'Kan dit bestand niet weergeven. Probeer te downloaden.',
    previewEmpty: 'Leeg document.',
    statuses: {
      PENDING: 'In behandeling',
      SUCCESS: 'Geextraheerd',
      FAILED: 'Mislukt',
      OCR_REQUIRED: 'OCR nodig',
      IMAGE: 'Afbeelding bijgevoegd',
      ATTACHED: 'Bijgevoegd'
    }
  }
};

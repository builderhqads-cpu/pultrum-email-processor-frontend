'use client';

import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import {toast} from 'sonner';
import {MailCheck} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {useAutomationSettings} from '@/hooks/use-automation-settings';
import type {Locale} from '@/i18n/routing';

type Lang = 'nl' | 'en' | 'de';
const LANGS: Lang[] = ['nl', 'en', 'de'];

const DEFAULT_BODY_NL = '{greeting},\n\nBedankt, we hebben de order(s) verwerkt.';

function greetingNow(lang: Lang): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Amsterdam',
      hour: '2-digit',
      hour12: false
    }).format(new Date())
  );
  const slot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const g: Record<Lang, Record<string, string>> = {
    nl: {morning: 'Goedemorgen', afternoon: 'Goedemiddag', evening: 'Goedenavond'},
    en: {morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening'},
    de: {morning: 'Guten Morgen', afternoon: 'Guten Tag', evening: 'Guten Abend'}
  };
  return g[lang][slot];
}

type Template = {subject: string; body: string};

const EMPTY: Record<Lang, Template> = {
  nl: {subject: '', body: DEFAULT_BODY_NL},
  en: {subject: '', body: ''},
  de: {subject: '', body: ''}
};

export function XmlConfirmationSettings() {
  const locale = useLocale() as Locale;
  const t = labels[locale] ?? labels.en;
  const {data, loading, update} = useAutomationSettings();

  const [enabled, setEnabled] = useState(false);
  const [activeLang, setActiveLang] = useState<Lang>('nl');
  const [tpl, setTpl] = useState<Record<Lang, Template>>(EMPTY);

  useEffect(() => {
    if (!data) return;
    setEnabled(Boolean(data.xmlConfirmationEnabled));
    setTpl({
      nl: {
        subject: data.xmlConfirmationSubject ?? '',
        body: (data.xmlConfirmationBody ?? '').trim() || DEFAULT_BODY_NL
      },
      en: {
        subject: data.xmlConfirmationSubjectEn ?? '',
        body: data.xmlConfirmationBodyEn ?? ''
      },
      de: {
        subject: data.xmlConfirmationSubjectDe ?? '',
        body: data.xmlConfirmationBodyDe ?? ''
      }
    });
  }, [data]);

  if (loading || !data) {
    return (
      <>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const setField = (lang: Lang, field: keyof Template, value: string) =>
    setTpl((prev) => ({...prev, [lang]: {...prev[lang], [field]: value}}));

  function save() {
    const toastId = toast.loading(t.saving);
    update.mutate(
      {
        xmlConfirmationEnabled: enabled,
        xmlConfirmationSubject: tpl.nl.subject.trim() || null,
        xmlConfirmationBody: tpl.nl.body.trim() || null,
        xmlConfirmationSubjectEn: tpl.en.subject.trim() || null,
        xmlConfirmationBodyEn: tpl.en.body.trim() || null,
        xmlConfirmationSubjectDe: tpl.de.subject.trim() || null,
        xmlConfirmationBodyDe: tpl.de.body.trim() || null
      },
      {
        onSuccess: () => toast.success(t.saved, {id: toastId}),
        onError: (err) => toast.error(err?.message ?? t.error, {id: toastId})
      }
    );
  }

  const active = tpl[activeLang];
  // Mirror the backend: an empty EN/DE body falls back to the Dutch one, so the
  // preview (and its greeting) must show exactly what the customer would get.
  const usesFallback = activeLang !== 'nl' && !active.body.trim();
  const previewLang: Lang = usesFallback ? 'nl' : activeLang;
  const previewSource = usesFallback
    ? tpl.nl.body.trim() || DEFAULT_BODY_NL
    : active.body.trim() || DEFAULT_BODY_NL;
  const preview = previewSource
    .replace(/\{greeting\}/g, greetingNow(previewLang))
    .replace(/\{orders\}/g, '- 11025-0185-01\n- 11025-0185-02');

  return (
    <>
      {/* Column: confirmation config (toggle, language, subject) */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailCheck className="h-4 w-4 text-muted-foreground" />
            {t.title}
          </CardTitle>
          <div className="text-sm text-muted-foreground">{t.description}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{t.enableLabel}</div>
              <div className="text-xs text-muted-foreground">{t.enableHint}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                  enabled ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          {/* Language tabs — picked automatically by the customer e-mail language. */}
          <div>
            <div className="text-xs font-medium text-muted-foreground">{t.langLabel}</div>
            <div className="mt-1 inline-flex rounded-md border p-0.5">
              {LANGS.map((lang) => {
                const hasContent = tpl[lang].body.trim().length > 0;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-3 py-1 text-sm transition-colors',
                      activeLang === lang
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t.langNames[lang]}
                    {lang !== 'nl' ? (
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          hasContent ? 'bg-emerald-400' : 'bg-muted-foreground/40'
                        )}
                        title={hasContent ? t.langFilled : t.langEmpty}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {activeLang === 'nl' ? t.langHintNl : t.langHintOptional}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column: subject + message editor + live preview */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {t.bodyLabel}
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t.langNames[activeLang]}
            </span>
          </CardTitle>
          <div className="text-sm text-muted-foreground">{t.bodyHint}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject (optional) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t.subjectLabel}</label>
            <Input
              value={active.subject}
              placeholder={t.subjectPlaceholder}
              onChange={(e) => setField(activeLang, 'subject', e.target.value)}
              className="h-11"
            />
            <div className="text-[11px] text-muted-foreground">{t.subjectHint}</div>
          </div>

          {/* Body template */}
          <textarea
            value={active.body}
            placeholder={activeLang === 'nl' ? '' : t.bodyPlaceholderOptional}
            onChange={(e) => setField(activeLang, 'body', e.target.value)}
            rows={10}
            className="min-h-56 w-full resize-y rounded-md border bg-background p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {/* Preview */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {t.previewLabel}
              {usesFallback ? (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  {t.previewFallback}
                </span>
              ) : null}
            </div>
            <pre className="min-h-32 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm text-foreground">
              {preview}
            </pre>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? t.saving : t.save}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

const labels: Record<
  Locale,
  {
    title: string;
    description: string;
    enableLabel: string;
    enableHint: string;
    langLabel: string;
    langNames: Record<Lang, string>;
    langFilled: string;
    langEmpty: string;
    langHintNl: string;
    langHintOptional: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    subjectHint: string;
    bodyLabel: string;
    bodyHint: string;
    bodyPlaceholderOptional: string;
    previewLabel: string;
    previewFallback: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
  }
> = {
  pt: {
    title: 'Confirmação automática',
    description:
      'Quando o pedido é aceito pelo Transpas, envia uma confirmação curta ao cliente, no idioma do e-mail dele.',
    enableLabel: 'Ativar confirmação automática',
    enableHint: 'Desligado = nenhuma confirmação é enviada.',
    langLabel: 'Idioma do texto',
    langNames: {nl: 'Holandês', en: 'Inglês', de: 'Alemão'},
    langFilled: 'Preenchido',
    langEmpty: 'Vazio (usa o holandês)',
    langHintNl: 'Holandês é o texto padrão. É ele que será usado quando o idioma do e-mail for desconhecido.',
    langHintOptional: 'Opcional. Se deixar em branco, o sistema envia o texto em holandês.',
    subjectLabel: 'Assunto (opcional)',
    subjectPlaceholder: 'Vazio = responde no mesmo assunto (Re: …)',
    subjectHint: 'Deixe vazio para responder no thread do e-mail original.',
    bodyLabel: 'Mensagem',
    bodyHint: 'Use {greeting} para a saudação por horário e {orders} para a lista de referências dos pedidos.',
    bodyPlaceholderOptional: 'Vazio = usa a mensagem em holandês',
    previewLabel: 'Prévia (agora)',
    previewFallback: 'usando o holandês',
    save: 'Salvar',
    saving: 'Salvando...',
    saved: 'Configuração salva',
    error: 'Falha ao salvar'
  },
  en: {
    title: 'Automatic confirmation',
    description:
      'When an order is accepted by Transpas, send a short confirmation to the customer, in their e-mail language.',
    enableLabel: 'Enable automatic confirmation',
    enableHint: 'Off = no confirmation is sent.',
    langLabel: 'Template language',
    langNames: {nl: 'Dutch', en: 'English', de: 'German'},
    langFilled: 'Filled',
    langEmpty: 'Empty (falls back to Dutch)',
    langHintNl: 'Dutch is the default text. It is used whenever the e-mail language is unknown.',
    langHintOptional: 'Optional. If left empty, the system sends the Dutch text.',
    subjectLabel: 'Subject (optional)',
    subjectPlaceholder: 'Empty = reply in the same subject (Re: …)',
    subjectHint: 'Leave empty to reply in the original e-mail thread.',
    bodyLabel: 'Message',
    bodyHint: 'Use {greeting} for the time-based greeting and {orders} for the list of order references.',
    bodyPlaceholderOptional: 'Empty = use the Dutch message',
    previewLabel: 'Preview (now)',
    previewFallback: 'using Dutch',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Settings saved',
    error: 'Failed to save'
  },
  nl: {
    title: 'Automatische bevestiging',
    description:
      'Wanneer een opdracht door Transpas is geaccepteerd, stuur een korte bevestiging naar de klant, in de taal van zijn e-mail.',
    enableLabel: 'Automatische bevestiging inschakelen',
    enableHint: 'Uit = er wordt geen bevestiging verzonden.',
    langLabel: 'Taal van de tekst',
    langNames: {nl: 'Nederlands', en: 'Engels', de: 'Duits'},
    langFilled: 'Ingevuld',
    langEmpty: 'Leeg (valt terug op Nederlands)',
    langHintNl: 'Nederlands is de standaardtekst. Die wordt gebruikt als de taal van de e-mail onbekend is.',
    langHintOptional: 'Optioneel. Laat je het leeg, dan stuurt het systeem de Nederlandse tekst.',
    subjectLabel: 'Onderwerp (optioneel)',
    subjectPlaceholder: 'Leeg = antwoord in hetzelfde onderwerp (Re: …)',
    subjectHint: 'Laat leeg om in de oorspronkelijke e-mailthread te antwoorden.',
    bodyLabel: 'Bericht',
    bodyHint: 'Gebruik {greeting} voor de begroeting op tijd en {orders} voor de lijst met opdrachtreferenties.',
    bodyPlaceholderOptional: 'Leeg = gebruik het Nederlandse bericht',
    previewLabel: 'Voorbeeld (nu)',
    previewFallback: 'gebruikt Nederlands',
    save: 'Opslaan',
    saving: 'Opslaan...',
    saved: 'Instellingen opgeslagen',
    error: 'Opslaan mislukt'
  }
};

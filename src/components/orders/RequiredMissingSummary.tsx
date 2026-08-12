'use client';

import {useLocale} from 'next-intl';
import {CircleAlert, CircleCheckBig} from 'lucide-react';

import type {Locale} from '@/i18n/routing';
import type {MissingField, OrderField} from '@/types';
import {cn} from '@/lib/utils';
import {computeCompleteness, isCustomerMissingField} from './order-field-classification';
import {fieldLabel} from './field-labels';

/**
 * At-a-glance summary of the order's completeness. Shows a weighted
 * "Volledigheid" meter (Niek: all required = 70% / ready for XML, recommended
 * fills the rest up to 100%) plus the list of REQUIRED missing fields that will
 * be requested in the customer reply.
 */
export function RequiredMissingSummary({
  missingFields,
  fields
}: {
  missingFields: MissingField[];
  fields: OrderField[];
}) {
  const locale = useLocale() as Locale;
  const labels = summaryLabels[locale] ?? summaryLabels.en;
  const required = missingFields.filter((f) => isCustomerMissingField(f));

  const completeness = computeCompleteness(fields);
  const ready = completeness.allRequiredPresent;
  const barColor = ready ? 'bg-emerald-500' : 'bg-amber-500';
  const pctColor = ready
    ? 'text-emerald-700 dark:text-emerald-300'
    : 'text-amber-700 dark:text-amber-300';

  return (
    <div className="space-y-3">
      {/* Volledigheid meter (weighted 70% required / 30% recommended). */}
      <div className="rounded-xl border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">
            {labels.completeness}
          </span>
          <span className={cn('text-sm font-bold tabular-nums', pctColor)}>
            {completeness.percent}%
          </span>
        </div>
        <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{width: `${completeness.percent}%`}}
          />
          {/* 70% = the XML-ready threshold (all required fields present). */}
          <span
            className="absolute inset-y-0 w-px bg-foreground/40"
            style={{left: '70%'}}
            aria-hidden
          />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            {labels.counts(
              completeness.requiredDone,
              completeness.requiredTotal,
              completeness.recommendedDone,
              completeness.recommendedTotal
            )}
          </span>
          <span>{labels.xmlThreshold}</span>
        </div>
      </div>

      {/* Required-missing detail: green when complete, red with the chips when not. */}
      {required.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CircleCheckBig className="h-4 w-4 shrink-0" />
          <span className="font-medium">{labels.complete}</span>
        </div>
      ) : (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <CircleAlert className="h-4 w-4 shrink-0" />
            {labels.title(required.length)}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {required.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
              >
                {fieldLabel(f.key, locale, f.label)}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {labels.willBeRequested}
          </div>
        </div>
      )}
    </div>
  );
}

const summaryLabels: Record<
  Locale,
  {
    complete: string;
    willBeRequested: string;
    title: (n: number) => string;
    completeness: string;
    xmlThreshold: string;
    counts: (rd: number, rt: number, cd: number, ct: number) => string;
  }
> = {
  nl: {
    complete: 'Alle verplichte velden zijn aanwezig — klaar voor XML.',
    willBeRequested: 'Deze velden worden in het antwoord opgevraagd.',
    title: (n) =>
      `${n} verplichte ${n === 1 ? 'veld ontbreekt' : 'velden ontbreken'}`,
    completeness: 'Volledigheid',
    xmlThreshold: '70% = klaar voor XML',
    counts: (rd, rt, cd, ct) =>
      `${rd}/${rt} verplicht · ${cd}/${ct} aanbevolen`
  },
  en: {
    complete: 'All required fields are present — ready for XML.',
    willBeRequested: 'These fields will be requested in the reply.',
    title: (n) => `${n} required field${n === 1 ? '' : 's'} missing`,
    completeness: 'Completeness',
    xmlThreshold: '70% = ready for XML',
    counts: (rd, rt, cd, ct) =>
      `${rd}/${rt} required · ${cd}/${ct} recommended`
  },
  pt: {
    complete: 'Todos os campos obrigatórios presentes — pronto para XML.',
    willBeRequested: 'Esses campos serão solicitados na resposta.',
    title: (n) =>
      `${n} campo${n === 1 ? '' : 's'} obrigatório${n === 1 ? '' : 's'} faltando`,
    completeness: 'Completude',
    xmlThreshold: '70% = pronto para XML',
    counts: (rd, rt, cd, ct) =>
      `${rd}/${rt} obrigatórios · ${cd}/${ct} recomendados`
  }
};

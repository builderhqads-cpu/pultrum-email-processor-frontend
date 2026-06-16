'use client';

import {useLocale} from 'next-intl';
import {CircleAlert, CircleCheckBig} from 'lucide-react';

import type {Locale} from '@/i18n/routing';
import type {MissingField} from '@/types';
import {isCustomerMissingField} from './order-field-classification';
import {fieldLabel} from './field-labels';

/**
 * At-a-glance summary of the REQUIRED missing fields (the minimum requirements
 * that will be requested in the customer reply). Always visible at the top of
 * the order detail; red when something is missing, green when complete.
 */
export function RequiredMissingSummary({
  missingFields
}: {
  missingFields: MissingField[];
}) {
  const locale = useLocale() as Locale;
  const labels = summaryLabels[locale] ?? summaryLabels.en;
  const required = missingFields.filter((f) => isCustomerMissingField(f));

  if (required.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <CircleCheckBig className="h-4 w-4 shrink-0" />
        <span className="font-medium">{labels.complete}</span>
      </div>
    );
  }

  return (
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
  );
}

const summaryLabels: Record<
  Locale,
  {complete: string; willBeRequested: string; title: (n: number) => string}
> = {
  nl: {
    complete: 'Alle verplichte velden zijn aanwezig — klaar voor XML.',
    willBeRequested: 'Deze velden worden in het antwoord opgevraagd.',
    title: (n) =>
      `${n} verplichte ${n === 1 ? 'veld ontbreekt' : 'velden ontbreken'}`
  },
  en: {
    complete: 'All required fields are present — ready for XML.',
    willBeRequested: 'These fields will be requested in the reply.',
    title: (n) => `${n} required field${n === 1 ? '' : 's'} missing`
  },
  pt: {
    complete: 'Todos os campos obrigatórios presentes — pronto para XML.',
    willBeRequested: 'Esses campos serão solicitados na resposta.',
    title: (n) =>
      `${n} campo${n === 1 ? '' : 's'} obrigatório${n === 1 ? '' : 's'} faltando`
  }
};

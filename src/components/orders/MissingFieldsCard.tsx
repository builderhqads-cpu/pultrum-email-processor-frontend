'use client';

import {useLocale} from 'next-intl';

import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import type {Locale} from '@/i18n/routing';
import type {MissingField, OrderField, ValidationWarning} from '@/types';
import {
  isCustomerMissingField,
  isOptionalRequirement
} from './order-field-classification';
import {OrderCollapsibleSection} from './OrderCollapsibleSection';
import {fieldLabel} from './field-labels';

type MissingItem = {
  id: string;
  key: string;
  label: string;
  reason: string | null;
};

export function MissingFieldsCard({
  fields,
  missingFields,
  validationWarnings,
  hideHeader
}: {
  fields: OrderField[];
  missingFields: MissingField[];
  validationWarnings: ValidationWarning[];
  hideHeader?: boolean;
}) {
  const locale = useLocale() as Locale;
  const labels = sectionLabels[locale] ?? sectionLabels.en;

  const requiredFields: MissingItem[] = missingFields
    .filter((field) => isCustomerMissingField(field))
    .map((field) => ({
      id: field.id,
      key: field.key,
      label: fieldLabel(field.key, locale, field.label),
      reason: labels.requiredReason
    }));

  const recommendedFields: MissingItem[] = validationWarnings
    .filter((field) => isCustomerMissingField(field))
    .map((field) => ({
      id: field.id,
      key: field.key,
      label: fieldLabel(field.key, locale, field.label),
      reason: labels.recommendedReason
    }));

  const optionalFields: MissingItem[] = fields
    .filter((field) => isOptionalRequirement(field.requirement))
    .filter((field) => field.missing)
    .filter((field) => isCustomerMissingField(field))
    .filter((field, index, all) => all.findIndex((item) => item.key === field.key) === index)
    .map((field) => ({
      id: field.id,
      key: field.key,
      label: fieldLabel(field.key, locale, field.label),
      reason: labels.optionalReason
    }));

  const totalMissing = requiredFields.length + recommendedFields.length + optionalFields.length;

  const body = (
    <div className="space-y-4">
      <Section
        title={labels.requiredTitle}
        description={labels.requiredDescription}
        emptyLabel={labels.requiredEmpty}
        items={requiredFields}
        defaultOpen
        tone="danger"
      />
      <Section
        title={labels.recommendedTitle}
        description={labels.recommendedDescription}
        emptyLabel={labels.recommendedEmpty}
        items={recommendedFields}
        defaultOpen
      />
      <Section
        title={labels.optionalTitle}
        description={labels.optionalDescription}
        emptyLabel={labels.optionalEmpty}
        items={optionalFields}
        defaultOpen={false}
      />
    </div>
  );

  if (hideHeader) {
    return body;
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{labels.titleWithCount(totalMissing)}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function Section({
  title,
  description,
  emptyLabel,
  items,
  defaultOpen,
  tone
}: {
  title: string;
  description: string;
  emptyLabel: string;
  items: MissingItem[];
  defaultOpen: boolean;
  tone?: 'danger';
}) {
  const danger = tone === 'danger';
  return (
    <OrderCollapsibleSection
      title={title}
      description={description}
      defaultOpen={defaultOpen}
      badge={
        <Badge
          variant="outline"
          className={
            danger && items.length
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : undefined
          }
        >
          {items.length}
        </Badge>
      }
    >
      {items.length ? (
        <div className="space-y-3">
          {items.map((field) => (
            <div
              key={field.id}
              className={cn(
                'min-w-0 rounded-lg border bg-background p-3',
                danger && 'border-destructive/40 bg-destructive/5'
              )}
            >
              <div
                className={cn(
                  'break-words text-sm font-medium',
                  danger && 'text-destructive'
                )}
              >
                {field.label}
              </div>
              {field.reason ? (
                <div className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {field.reason}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">{emptyLabel}</div>
      )}
    </OrderCollapsibleSection>
  );
}

const sectionLabels: Record<Locale, {
  titleWithCount: (count: number) => string;
  requiredTitle: string;
  recommendedTitle: string;
  optionalTitle: string;
  requiredDescription: string;
  recommendedDescription: string;
  optionalDescription: string;
  requiredEmpty: string;
  recommendedEmpty: string;
  optionalEmpty: string;
  optionalReason: string;
  requiredReason: string;
  recommendedReason: string;
}> = {
  pt: {
    titleWithCount: (count) => `Campos faltantes (${count})`,
    requiredTitle: 'Campos obrigatorios faltantes',
    recommendedTitle: 'Campos recomendados faltantes',
    optionalTitle: 'Campos opcionais',
    requiredDescription: 'Obrigatórios — solicitados na resposta ao cliente.',
    recommendedDescription: 'Recomendados — não solicitados (coleta futura).',
    optionalDescription: 'Opcionais — não solicitados (coleta futura).',
    requiredEmpty: 'Nenhum campo obrigatorio faltante.',
    recommendedEmpty: 'Nenhum aviso recomendado pendente.',
    optionalEmpty: 'Nenhum campo opcional pendente.',
    optionalReason: 'Opcional nao informado.',
    requiredReason: 'Não detectado no conteúdo do e-mail.',
    recommendedReason: 'Recomendado, mas não detectado no conteúdo do e-mail.'
  },
  en: {
    titleWithCount: (count) => `Missing fields (${count})`,
    requiredTitle: 'Missing required fields',
    recommendedTitle: 'Missing recommended fields',
    optionalTitle: 'Optional fields',
    requiredDescription: 'Required — requested in the customer reply.',
    recommendedDescription: 'Recommended — not requested (future collection).',
    optionalDescription: 'Optional — not requested (future collection).',
    requiredEmpty: 'No required fields are missing.',
    recommendedEmpty: 'No recommended warnings are pending.',
    optionalEmpty: 'No optional fields are pending.',
    optionalReason: 'Optional field not provided.',
    requiredReason: 'Not detected in email content.',
    recommendedReason: 'Recommended but not detected in email content.'
  },
  nl: {
    titleWithCount: (count) => `Ontbrekende velden (${count})`,
    requiredTitle: 'Ontbrekende verplichte velden',
    recommendedTitle: 'Ontbrekende aanbevolen velden',
    optionalTitle: 'Optionele velden',
    requiredDescription: 'Verplicht — worden in het antwoord opgevraagd.',
    recommendedDescription: 'Aanbevolen — niet opgevraagd (voor latere verzameling).',
    optionalDescription: 'Optioneel — niet opgevraagd (voor latere verzameling).',
    requiredEmpty: 'Geen verplichte velden ontbreken.',
    recommendedEmpty: 'Geen openstaande aanbevolen waarschuwingen.',
    optionalEmpty: 'Geen openstaande optionele velden.',
    optionalReason: 'Optioneel veld niet opgegeven.',
    requiredReason: 'Niet gevonden in de e-mailinhoud.',
    recommendedReason: 'Aanbevolen maar niet gevonden in de e-mailinhoud.'
  }
};

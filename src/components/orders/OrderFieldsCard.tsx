'use client';

import {useMemo} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Bot} from 'lucide-react';

import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import type {Locale} from '@/i18n/routing';
import type {OrderField} from '@/types';
import {getFieldGroup, type FieldGroup} from './order-field-classification';
import {fieldLabel} from './field-labels';
import {OrderCollapsibleSection} from './OrderCollapsibleSection';

function hasValue(value: unknown) {
  if (value == null) return false;
  return String(value).trim().length > 0;
}

const sectionOrder: FieldGroup[] = ['pickup', 'delivery', 'cargo', 'calculated', 'technical'];

export function OrderFieldsCard({
  fields,
  hideHeader
}: {
  fields: OrderField[];
  hideHeader?: boolean;
}) {
  const t = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const labels = fieldGroupLabels[locale] ?? fieldGroupLabels.en;

  const populatedFields = useMemo(
    () => fields.filter((field) => hasValue(field.value)),
    [fields]
  );

  const groupedFields = useMemo(() => {
    const groups: Record<FieldGroup, OrderField[]> = {
      pickup: [],
      delivery: [],
      cargo: [],
      calculated: [],
      technical: [],
      additional: []
    };

    populatedFields.forEach((field) => {
      groups[getFieldGroup(field)].push(field);
    });

    return groups;
  }, [populatedFields]);

  const countDetectedFields = populatedFields.filter((field) => getFieldGroup(field) !== 'technical').length;

  const body = (
    <div className="space-y-4">
      {sectionOrder.map((group) => {
        const items = groupedFields[group];

        if (!items.length && group !== 'technical') return null;

        return (
          <OrderCollapsibleSection
            key={group}
            title={labels[group].title}
            description={labels[group].description}
            defaultOpen={group !== 'technical'}
            badge={<Badge variant="outline">{items.length}</Badge>}
          >
            {items.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((field) => renderField(field, tCommon('na'), locale))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{labels[group].empty}</div>
            )}
          </OrderCollapsibleSection>
        );
      })}

      {groupedFields.additional.length ? (
        <OrderCollapsibleSection
          title={labels.additional.title}
          description={labels.additional.description}
          defaultOpen
          badge={<Badge variant="outline">{groupedFields.additional.length}</Badge>}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {groupedFields.additional.map((field) => renderField(field, tCommon('na'), locale))}
          </div>
        </OrderCollapsibleSection>
      ) : null}
    </div>
  );

  if (hideHeader) {
    return body;
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">
          {t('detectedFields.titleWithCount', {count: countDetectedFields})}
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function renderField(field: OrderField, naLabel: string, locale: Locale) {
  const confidence = typeof field.confidence === 'number' ? field.confidence : null;
  const lowConfidence = confidence != null && confidence < 0.8;

  return (
    <div
      key={field.id}
      className={cn(
        'min-w-0 rounded-lg border bg-background p-3',
        lowConfidence && 'border-amber-300 dark:border-amber-700'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 break-words text-xs font-medium text-muted-foreground">
          {fieldLabel(field.key, locale, field.label)}
        </div>
        {confidence != null ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400"
            title={`AI ${confidence.toFixed(2)}`}
          >
            <Bot className="h-3.5 w-3.5" />
            {confidence.toFixed(2)}
          </span>
        ) : null}
      </div>

      <div className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground [overflow-wrap:anywhere]">
        {field.value ?? <span className="text-muted-foreground">{naLabel}</span>}
      </div>
    </div>
  );
}

const fieldGroupLabels: Record<Locale, Record<FieldGroup, {title: string; description: string; empty: string}>> = {
  pt: {
    pickup: {
      title: 'Pickup',
      description: 'Dados de coleta e contatos de origem.',
      empty: 'Nenhum dado de pickup encontrado.'
    },
    delivery: {
      title: 'Delivery',
      description: 'Dados de entrega e contatos de destino.',
      empty: 'Nenhum dado de delivery encontrado.'
    },
    cargo: {
      title: 'Cargo',
      description: 'Informacoes da carga, dimensoes e dados comerciais.',
      empty: 'Nenhum dado de carga encontrado.'
    },
    calculated: {
      title: 'Calculated',
      description: 'Campos calculados automaticamente a partir dos dados detectados.',
      empty: 'Nenhum campo calculado encontrado.'
    },
    technical: {
      title: 'Technical information',
      description: 'Campos de sistema e rastreamento tecnico.',
      empty: 'Nenhuma informacao tecnica encontrada.'
    },
    additional: {
      title: 'Additional information',
      description: 'Campos preenchidos que nao entram nas categorias principais.',
      empty: 'Nenhuma informacao adicional encontrada.'
    }
  },
  en: {
    pickup: {
      title: 'Pickup',
      description: 'Pickup details and origin contacts.',
      empty: 'No pickup fields found.'
    },
    delivery: {
      title: 'Delivery',
      description: 'Delivery details and destination contacts.',
      empty: 'No delivery fields found.'
    },
    cargo: {
      title: 'Cargo',
      description: 'Cargo details, dimensions, and commercial data.',
      empty: 'No cargo fields found.'
    },
    calculated: {
      title: 'Calculated',
      description: 'Fields automatically calculated from detected data.',
      empty: 'No calculated fields found.'
    },
    technical: {
      title: 'Technical information',
      description: 'System and tracking fields.',
      empty: 'No technical information found.'
    },
    additional: {
      title: 'Additional information',
      description: 'Filled fields that do not match the main categories.',
      empty: 'No additional information found.'
    }
  },
  nl: {
    pickup: {
      title: 'Pickup',
      description: 'Laadgegevens en contactgegevens van de herkomst.',
      empty: 'Geen pickup-velden gevonden.'
    },
    delivery: {
      title: 'Delivery',
      description: 'Losgegevens en contactgegevens van de bestemming.',
      empty: 'Geen delivery-velden gevonden.'
    },
    cargo: {
      title: 'Cargo',
      description: 'Vrachtgegevens, afmetingen en commerciele data.',
      empty: 'Geen cargo-velden gevonden.'
    },
    calculated: {
      title: 'Calculated',
      description: 'Automatisch berekende velden op basis van gedetecteerde data.',
      empty: 'Geen berekende velden gevonden.'
    },
    technical: {
      title: 'Technical information',
      description: 'Systeem- en trackingvelden.',
      empty: 'Geen technische informatie gevonden.'
    },
    additional: {
      title: 'Additional information',
      description: 'Gevulde velden die niet in de hoofdcategorieen passen.',
      empty: 'Geen aanvullende informatie gevonden.'
    }
  }
};

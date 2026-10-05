'use client';

import {useState} from 'react';
import {useMemo} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {Bot, Check, Eraser, SquarePen, X} from 'lucide-react';

import {updateOrderField} from '@/lib/api';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {cn} from '@/lib/utils';
import type {Locale} from '@/i18n/routing';
import type {OrderField} from '@/types';
import {fieldSortIndex, getFieldGroup, getFieldOrigin, isDisplayOnlyField, type FieldGroup} from './order-field-classification';
import {fieldLabel} from './field-labels';
import {OrderCollapsibleSection} from './OrderCollapsibleSection';

function hasValue(value: unknown) {
  if (value == null) return false;
  return String(value).trim().length > 0;
}

// 'technical' is intentionally omitted: Pultrum doesn't want system/tracking
// fields on this page (Niek's feedback). They still exist on the order, they
// are just not rendered here.
// Niek: the Algemeen (general) box goes at the very top, above Laden (pickup).
const sectionOrder: FieldGroup[] = ['general', 'pickup', 'delivery', 'cargo', 'calculated'];

// Internal fields that only exist to build the XML and mirror data already
// shown elsewhere — the "dubbele dingen" Niek flagged in Additional info. Hidden
// from the panel only; the values are still generated and sent in the XML.
//  - goods_* : mirrors of the cargo_* measures (goederen laadmeter, etc.)
//  - reference / shipment_reference / external_shipment_id : calculated copies
//    of the BA (invoice) and TR (shipment) references shown in cargo/pickup.
const hiddenFieldKeys = new Set([
  'goods_loading_meter',
  'goods_volume',
  'goods_weight',
  'goods_unit_amount',
  'goods_unit_id',
  'reference',
  'shipment_reference',
  'external_shipment_id'
]);

export function OrderFieldsCard({
  fields,
  hideHeader,
  orderId
}: {
  fields: OrderField[];
  hideHeader?: boolean;
  /** When set, each field value is editable (manual correction). */
  orderId?: string;
}) {
  const t = useTranslations('orders.detail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const labels = fieldGroupLabels[locale] ?? fieldGroupLabels.en;

  const populatedFields = useMemo(
    () =>
      fields.filter(
        (field) => hasValue(field.value) && !hiddenFieldKeys.has(field.key)
      ),
    [fields]
  );

  const groupedFields = useMemo(() => {
    const groups: Record<FieldGroup, OrderField[]> = {
      pickup: [],
      delivery: [],
      cargo: [],
      general: [],
      calculated: [],
      technical: [],
      additional: []
    };

    populatedFields.forEach((field) => {
      groups[getFieldGroup(field)].push(field);
    });

    // Order fields within each group by the canonical order.
    for (const group of Object.values(groups)) {
      group.sort((a, b) => fieldSortIndex(a.key) - fieldSortIndex(b.key));
    }

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
                {items.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    orderId={orderId}
                    naLabel={tCommon('na')}
                    locale={locale}
                  />
                ))}
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
            {groupedFields.additional.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                orderId={orderId}
                naLabel={tCommon('na')}
                locale={locale}
              />
            ))}
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

/**
 * One detected field. When `orderId` is set it can be corrected by hand (QoL,
 * Renato 2026-10-05): pencil -> inline input -> save marks the value as MANUAL.
 */
function FieldRow({
  field,
  orderId,
  naLabel,
  locale
}: {
  field: OrderField;
  orderId?: string;
  naLabel: string;
  locale: Locale;
}) {
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(field.value ?? '');

  const save = useMutation({
    mutationFn: (next: string) =>
      updateOrderField(orderId as string, field.key, next),
    onSuccess: async () => {
      setEditing(false);
      toast.success(tCommon('saved'));
      await queryClient.invalidateQueries({queryKey: ['orders', orderId]});
      await queryClient.invalidateQueries({queryKey: ['orders']});
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : tCommon('error'))
  });

  const confidence = typeof field.confidence === 'number' ? field.confidence : null;
  const lowConfidence = confidence != null && confidence < 0.8;
  // Display-only fields (opdrachtgever/principal) are not in the XML, so they
  // cannot be corrected here — show a hint instead of the edit pencil.
  const displayOnly = isDisplayOnlyField(field.key);
  const origin = getFieldOrigin(field);
  const originLabel =
    origin === 'manual'
      ? 'MANUAL'
      : origin === 'ai'
        ? 'AI'
        : origin === 'profile'
          ? 'PROFILE'
          : origin === 'calculated'
            ? 'CALCULATED'
            : origin === 'system'
              ? 'SYSTEM'
              : 'EMAIL';
  const originClassName =
    origin === 'manual'
      ? 'border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200'
      : origin === 'ai'
        ? 'border-violet-300/80 bg-violet-100 text-violet-950 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-200'
        : origin === 'profile'
          ? 'border-sky-300/80 bg-sky-100 text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-200'
          : origin === 'calculated'
            ? 'border-emerald-300/80 bg-emerald-100 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200'
            : origin === 'system'
              ? 'border-border bg-muted text-foreground'
              : 'border-blue-300/80 bg-blue-100 text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200';

  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border bg-background p-3',
        lowConfidence && 'border-amber-300 dark:border-amber-700'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 break-words text-xs font-medium text-muted-foreground">
          {fieldLabel(field.key, locale, field.label)}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className={cn('text-[11px]', originClassName)}>
            {originLabel}
          </Badge>
          {confidence != null ? (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium',
                origin === 'ai'
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-muted-foreground'
              )}
              title={`${originLabel} ${confidence.toFixed(2)}`}
            >
              {origin === 'ai' ? <Bot className="h-3.5 w-3.5" /> : null}
              {confidence.toFixed(2)}
            </span>
          ) : null}
          {displayOnly ? (
            <span
              className="shrink-0 text-[11px] text-muted-foreground/70"
              title={tCommon('displayOnlyHint')}
            >
              {tCommon('displayOnly')}
            </span>
          ) : orderId && !editing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 text-muted-foreground/60 hover:text-foreground"
              title={tCommon('edit')}
              aria-label={tCommon('edit')}
              onClick={() => {
                setValue(field.value ?? '');
                setEditing(true);
              }}
            >
              <SquarePen className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground [overflow-wrap:anywhere]">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') save.mutate(value.trim());
                if (event.key === 'Escape') setEditing(false);
              }}
              className="h-8 min-w-0 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="h-8 w-8 shrink-0"
              disabled={save.isPending}
              title={tCommon('save')}
              aria-label={tCommon('save')}
              onClick={() => save.mutate(value.trim())}
            >
              <Check className="h-4 w-4" />
            </Button>
            {/* Clear: empties the field (restores it to "Missing") in one click. */}
            {hasValue(field.value) ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={save.isPending}
                title={tCommon('clear')}
                aria-label={tCommon('clear')}
                onClick={() => save.mutate('')}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 shrink-0"
              title={tCommon('cancel')}
              aria-label={tCommon('cancel')}
              onClick={() => setEditing(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : field.value != null && field.value !== '' ? (
          displayFieldValue(field, locale)
        ) : (
          <span className="text-muted-foreground">{naLabel}</span>
        )}
      </div>
    </div>
  );
}

const WEIGHT_DISPLAY_KEYS = new Set(['cargo_weight', 'goods_weight', 'weight']);
const CM_DISPLAY_KEYS = new Set(['length', 'width', 'height']);
const M3_DISPLAY_KEYS = new Set(['cargo_volume', 'goods_volume']);
const LDM_DISPLAY_KEYS = new Set(['cargo_loading_meter', 'goods_loading_meter']);

// Date fields (loading + unloading). Niek wants them in Dutch order (DD-MM-YYYY).
const DATE_DISPLAY_KEYS = new Set([
  'pickup_date',
  'pickup_date_till',
  'delivery_date',
  'delivery_date_till',
]);

/** ISO (YYYY-MM-DD) -> Dutch (DD-MM-YYYY); returns null if not a plain ISO date. */
function toDutchDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** Display-only touch-ups (Niek). The stored value and the XML stay a plain,
 *  unit-less, dot-decimal number; here we only add the unit, use the locale's
 *  decimal separator (NL/PT: comma) and capitalize the cargo unit. */
function displayFieldValue(field: OrderField, locale: Locale): string {
  const value = String(field.value);
  if (field.key === 'cargo_unit_id' && value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  if (DATE_DISPLAY_KEYS.has(field.key)) {
    return toDutchDate(value) ?? value;
  }
  // Only touch numeric measure values (never free text).
  const isNumeric = /^-?\d+(?:[.,]\d+)?$/.test(value.trim());
  if (!isNumeric) return value;
  // Dutch and Portuguese write decimals with a comma.
  const n = locale === 'en' ? value : value.replace('.', ',');
  if (WEIGHT_DISPLAY_KEYS.has(field.key)) return `${n} kg`;
  if (CM_DISPLAY_KEYS.has(field.key)) return `${n} cm`;
  if (M3_DISPLAY_KEYS.has(field.key)) return `${n} m³`;
  if (LDM_DISPLAY_KEYS.has(field.key)) return `${n} ldm`;
  return value;
}

const fieldGroupLabels: Record<Locale, Record<FieldGroup, {title: string; description: string; empty: string}>> = {
  pt: {
    pickup: {
      title: 'Coleta',
      description: 'Dados de coleta e contatos de origem.',
      empty: 'Nenhum dado de coleta encontrado.'
    },
    delivery: {
      title: 'Entrega',
      description: 'Dados de entrega e contatos de destino.',
      empty: 'Nenhum dado de entrega encontrado.'
    },
    cargo: {
      title: 'Carga',
      description: 'Informacoes da carga, dimensoes e dados comerciais.',
      empty: 'Nenhum dado de carga encontrado.'
    },
    general: {
      title: 'Geral',
      description: 'Tipo de transporte, cliente e dados gerais da ordem.',
      empty: 'Nenhum dado geral encontrado.'
    },
    calculated: {
      title: 'Calculado',
      description: 'Campos calculados automaticamente a partir dos dados detectados.',
      empty: 'Nenhum campo calculado encontrado.'
    },
    technical: {
      title: 'Informacoes tecnicas',
      description: 'Campos de sistema e rastreamento tecnico.',
      empty: 'Nenhuma informacao tecnica encontrada.'
    },
    additional: {
      title: 'Informacoes adicionais',
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
    general: {
      title: 'General',
      description: 'Transport type, principal and order-level data.',
      empty: 'No general fields found.'
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
      title: 'Laden',
      description: 'Laadgegevens en contactgegevens van de herkomst.',
      empty: 'Geen laadvelden gevonden.'
    },
    delivery: {
      title: 'Lossen',
      description: 'Losgegevens en contactgegevens van de bestemming.',
      empty: 'Geen losvelden gevonden.'
    },
    cargo: {
      title: 'Goederen',
      description: 'Vrachtgegevens, afmetingen en commerciele data.',
      empty: 'Geen goederenvelden gevonden.'
    },
    general: {
      title: 'Algemeen',
      description: 'Transportsoort, opdrachtgever en algemene ordergegevens.',
      empty: 'Geen algemene gegevens gevonden.'
    },
    calculated: {
      title: 'Berekend',
      description: 'Automatisch berekende velden op basis van gedetecteerde data.',
      empty: 'Geen berekende velden gevonden.'
    },
    technical: {
      title: 'Technische informatie',
      description: 'Systeem- en trackingvelden.',
      empty: 'Geen technische informatie gevonden.'
    },
    additional: {
      title: 'Aanvullende informatie',
      description: 'Gevulde velden die niet in de hoofdcategorieen passen.',
      empty: 'Geen aanvullende informatie gevonden.'
    }
  }
};

import type {
  FieldRequirement,
  MissingField,
  OrderField,
  ValidationWarning
} from '@/types';

export type FieldOrigin = 'email' | 'ai' | 'profile' | 'system' | 'calculated' | 'optional';
export type FieldGroup = 'pickup' | 'delivery' | 'cargo' | 'general' | 'calculated' | 'technical' | 'additional';

// Group membership + display order per Niek's spec (2026-08-07). Order within
// each array is the display order inside its group.
export const PICKUP_FIELD_KEYS = [
  'pickup_date',
  'pickup_date_till',
  'pickup_time',
  'pickup_time_till',
  'pickup_reference',
  'pickup_name',
  'pickup_address',
  'pickup_address2',
  'pickup_country',
  'pickup_zipcode',
  'pickup_phone',
  'pickup_email',
  'driver_pickup_info',
  'pickup_time_delivery',
  'pickup_city',
  'pickup_remarks',
  'pickup_contact',
  'neutral_pickup_address',
  'neutral_loading'
] as const;

export const DELIVERY_FIELD_KEYS = [
  'delivery_date',
  'delivery_date_till',
  'delivery_time',
  'delivery_time_till',
  'delivery_reference',
  'delivery_name',
  'delivery_address',
  'delivery_country',
  'delivery_zipcode',
  'delivery_city',
  'driver_delivery_info',
  'delivery_time_delivery',
  'delivery_address2',
  'delivery_remarks',
  'delivery_contact',
  'delivery_phone',
  'delivery_email',
  'neutral_delivery_address',
  'neutral_unloading'
] as const;

export const CARGO_FIELD_KEYS = [
  'cargo_unit_amount',
  'cargo_unit_id',
  'cargo_weight',
  'length',
  'width',
  'cargo_loading_meter',
  'cargo_volume',
  'product_description',
  'goods_unit_amount',
  'product_id',
  'pallet_places',
  'height',
  'adr_class',
  'dangerous_goods',
  'product_instructions',
  'adr'
] as const;

// "Algemeen" box. Niek's order (2026-08-07): Opdrachtgever, Klantnummer,
// Factuurreferentie, Transportsoort, Vaste prijs, CMR-nummer, Afzender,
// Kraanhoogte, Vergunningen, Begeleiding vereist, Prijs. principal is an
// opdrachtgever alias, kept next to it.
export const GENERAL_FIELD_KEYS = [
  'opdrachtgever',
  'principal',
  'customer_id',
  'invoice_reference',
  'transport_type',
  'planning_note',
  'fixed_price',
  'cmr_number',
  'sender',
  'crane_height',
  'permits',
  'escort_required',
  'price'
] as const;

export const CALCULATED_FIELD_KEYS = [
  // The goods_* mirrors are hidden in the panel; kept here for the origin badge.
  'goods_loading_meter',
  'goods_volume'
] as const;

export const TECHNICAL_FIELD_KEYS = [
  'edireference',
  'shipment_edireference',
  'barcode'
] as const;

export const OPTIONAL_FIELD_KEYS = new Set([
  'pickup_remarks',
  'delivery_remarks',
  'cmr_number',
  'crane_height',
  'product_instructions',
  'adr',
  'neutral_loading',
  'neutral_unloading',
  'sender',
  'permits',
  'escort_required'
]);

// Canonical display order inside each group (so e.g. invoice_reference lands
// right after opdrachtgever in Algemeen, regardless of API field order).
const FIELD_DISPLAY_ORDER: string[] = [
  ...PICKUP_FIELD_KEYS,
  ...DELIVERY_FIELD_KEYS,
  ...CARGO_FIELD_KEYS,
  ...GENERAL_FIELD_KEYS,
  ...CALCULATED_FIELD_KEYS,
  ...TECHNICAL_FIELD_KEYS,
];
const fieldOrderIndex = new Map<string, number>(
  FIELD_DISPLAY_ORDER.map((key, index) => [key, index]),
);

/** Sort key for a field within its group; unknown keys go last, stable. */
export function fieldSortIndex(key: string): number {
  return fieldOrderIndex.get(key) ?? Number.MAX_SAFE_INTEGER;
}

const pickupFieldSet = new Set<string>(PICKUP_FIELD_KEYS);
const deliveryFieldSet = new Set<string>(DELIVERY_FIELD_KEYS);
const cargoFieldSet = new Set<string>(CARGO_FIELD_KEYS);
const generalFieldSet = new Set<string>(GENERAL_FIELD_KEYS);
const calculatedFieldSet = new Set<string>(CALCULATED_FIELD_KEYS);
const technicalFieldSet = new Set<string>(TECHNICAL_FIELD_KEYS);

export function normalizeFieldSource(source: string | null | undefined) {
  return (source || '').trim().toUpperCase();
}

export function getFieldOrigin(field: Pick<OrderField, 'key' | 'required' | 'source'>): FieldOrigin {
  const source = normalizeFieldSource(field.source);

  if (source === 'AI') return 'ai';
  if (source === 'CUSTOMER_PROFILE') return 'profile';
  if (source === 'SYSTEM' || source === 'GENERATED') return 'system';
  if (source === 'CALCULATED') return 'calculated';
  if (source === 'EMAIL' || source === 'REGEX') return 'email';

  if (technicalFieldSet.has(field.key)) return 'system';
  if (calculatedFieldSet.has(field.key)) return 'calculated';
  if (OPTIONAL_FIELD_KEYS.has(field.key) || field.required === false) return 'optional';
  return 'email';
}

export function isCustomerMissingField(
  field: Pick<MissingField | ValidationWarning, 'key'>
) {
  if (technicalFieldSet.has(field.key)) return false;
  if (calculatedFieldSet.has(field.key)) return false;
  return true;
}

export function normalizeFieldRequirement(requirement: string | null | undefined): FieldRequirement {
  return ((requirement || 'OPTIONAL').trim().toUpperCase() || 'OPTIONAL') as FieldRequirement;
}

export function isOptionalRequirement(requirement: string | null | undefined) {
  return normalizeFieldRequirement(requirement) === 'OPTIONAL';
}

export function getFieldGroup(field: Pick<OrderField, 'key'>): FieldGroup {
  if (pickupFieldSet.has(field.key)) return 'pickup';
  if (deliveryFieldSet.has(field.key)) return 'delivery';
  if (cargoFieldSet.has(field.key)) return 'cargo';
  if (generalFieldSet.has(field.key)) return 'general';
  if (calculatedFieldSet.has(field.key)) return 'calculated';
  if (technicalFieldSet.has(field.key)) return 'technical';
  return 'additional';
}

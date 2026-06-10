import type {
  FieldRequirement,
  MissingField,
  OrderField,
  ValidationWarning
} from '@/types';

export type FieldOrigin = 'email' | 'ai' | 'system' | 'calculated' | 'optional';
export type FieldGroup = 'pickup' | 'delivery' | 'cargo' | 'calculated' | 'technical' | 'additional';

export const PICKUP_FIELD_KEYS = [
  'pickup_date',
  'pickup_time',
  'pickup_time_till',
  'pickup_time_delivery',
  'pickup_reference',
  'pickup_name',
  'pickup_address',
  'pickup_address2',
  'pickup_country',
  'pickup_zipcode',
  'pickup_city',
  'pickup_contact',
  'pickup_phone',
  'pickup_email',
  'neutral_pickup_address',
  'driver_pickup_info'
] as const;

export const DELIVERY_FIELD_KEYS = [
  'delivery_date',
  'delivery_time',
  'delivery_time_till',
  'delivery_time_delivery',
  'delivery_reference',
  'delivery_name',
  'delivery_address',
  'delivery_address2',
  'delivery_country',
  'delivery_zipcode',
  'delivery_city',
  'delivery_contact',
  'delivery_phone',
  'delivery_email',
  'neutral_delivery_address',
  'driver_delivery_info'
] as const;

export const CARGO_FIELD_KEYS = [
  'cargo_unit_amount',
  'cargo_unit_id',
  'product_id',
  'cargo_weight',
  'length',
  'width',
  'height',
  'transport_type',
  'invoice_reference',
  'price',
  'fixed_price',
  'product_description',
  'pallet_places',
  'adr_class',
  'dangerous_goods'
] as const;

export const CALCULATED_FIELD_KEYS = [
  'cargo_loading_meter',
  'cargo_volume',
  'goods_loading_meter',
  'goods_volume'
] as const;

export const TECHNICAL_FIELD_KEYS = [
  'edireference',
  'shipment_edireference',
  'barcode',
  'customer_id'
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

const pickupFieldSet = new Set<string>(PICKUP_FIELD_KEYS);
const deliveryFieldSet = new Set<string>(DELIVERY_FIELD_KEYS);
const cargoFieldSet = new Set<string>(CARGO_FIELD_KEYS);
const calculatedFieldSet = new Set<string>(CALCULATED_FIELD_KEYS);
const technicalFieldSet = new Set<string>(TECHNICAL_FIELD_KEYS);

export function normalizeFieldSource(source: string | null | undefined) {
  return (source || '').trim().toUpperCase();
}

export function getFieldOrigin(field: Pick<OrderField, 'key' | 'required' | 'source'>): FieldOrigin {
  const source = normalizeFieldSource(field.source);

  if (source === 'AI') return 'ai';
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
  if (calculatedFieldSet.has(field.key)) return 'calculated';
  if (technicalFieldSet.has(field.key)) return 'technical';
  return 'additional';
}

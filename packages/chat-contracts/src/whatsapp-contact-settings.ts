import { z } from 'zod';

const text = ['text', 'textarea', 'autocomplete'] as const;
const multiline = ['textarea'] as const;
export const WHATSAPP_CONTACT_SOURCES = [
  { key: 'formattedName', fieldTypes: text },
  { key: 'firstName', fieldTypes: text },
  { key: 'middleName', fieldTypes: text },
  { key: 'lastName', fieldTypes: text },
  { key: 'prefix', fieldTypes: text },
  { key: 'suffix', fieldTypes: text },
  { key: 'phone', fieldTypes: text },
  { key: 'waId', fieldTypes: text },
  { key: 'email', fieldTypes: [...text, 'email'] },
  { key: 'url', fieldTypes: [...text, 'link'] },
  { key: 'company', fieldTypes: text },
  { key: 'department', fieldTypes: text },
  { key: 'jobTitle', fieldTypes: text },
  { key: 'birthday', fieldTypes: [...text, 'date'] },
  { key: 'address', fieldTypes: [...text, 'location'] },
  { key: 'street', fieldTypes: text },
  { key: 'city', fieldTypes: text },
  { key: 'state', fieldTypes: text },
  { key: 'country', fieldTypes: text },
  { key: 'countryCode', fieldTypes: text },
  { key: 'postalCode', fieldTypes: text },
  { key: 'phones', fieldTypes: multiline },
  { key: 'emails', fieldTypes: multiline },
  { key: 'urls', fieldTypes: multiline },
  { key: 'addresses', fieldTypes: multiline },
  { key: 'rawContact', fieldTypes: multiline },
] as const;
export type WhatsAppContactSource = typeof WHATSAPP_CONTACT_SOURCES[number]['key'];
export const WHATSAPP_CONTACT_MAPPING_LIMIT = 100;
export const whatsAppContactFixedValueSchema = z.json().refine(value => JSON.stringify(value).length <= 65536);
export type WhatsAppContactFixedValue = z.infer<typeof whatsAppContactFixedValueSchema>;
const targetField = z.string().trim().min(1).max(255);
export const whatsAppContactMappingsSchema = z.array(z.union([
  z.object({ source: z.enum(WHATSAPP_CONTACT_SOURCES.map(item => item.key)), targetField }).strict(),
  z.object({ source: z.literal('fixed'), targetField, fixedValue: whatsAppContactFixedValueSchema }).strict(),
])).max(WHATSAPP_CONTACT_MAPPING_LIMIT)
  .refine(rows => new Set(rows.map(row => row.targetField)).size === rows.length, 'Each target field can only be mapped once')
  .refine(rows => {
    const sources = rows.filter(row => row.source !== 'fixed').map(row => row.source);
    return new Set(sources).size === sources.length;
  }, 'Each contact field can only be mapped once');
export type WhatsAppContactMappings = z.infer<typeof whatsAppContactMappingsSchema>;
export const whatsAppContactDeleteBehaviorSchema = z.enum(['unlink', 'trash']);
export type WhatsAppContactDeleteBehavior = z.infer<typeof whatsAppContactDeleteBehaviorSchema>;
export type WhatsAppContactSettings = { deleteBehavior: WhatsAppContactDeleteBehavior; formId: string | null; mappings: WhatsAppContactMappings; autoCreate: boolean; revision: number };
export type WhatsAppContactForm = { id: string; name: string; apiName: string };
export type WhatsAppContactField = {
  apiName: string; name: string; type: string; required?: boolean; dataType?: string;
  options?: unknown; specialConfig?: unknown; validation?: unknown; display?: unknown; config?: unknown;
};
export function canMapWhatsAppContactField(source: WhatsAppContactSource, type: string) {
  return (WHATSAPP_CONTACT_SOURCES.find(item => item.key === source)?.fieldTypes as readonly string[] | undefined)?.includes(type) === true;
}

const fixedStringTypes = new Set(['text', 'textarea', 'autocomplete', 'serial_number', 'email', 'link',
  'select', 'radio', 'member', 'department', 'organization']);
const fixedArrayTypes = new Set(['multi_select', 'checkbox_group', 'multi_member', 'multi_department',
  'multi_organization', 'image', 'video', 'file', 'audio']);
const fixedTemporalTypes = new Set(['date', 'week', 'month', 'quarter', 'year', 'datetime', 'time']);
export function canUseWhatsAppContactFixedField(type: string) {
  return fixedStringTypes.has(type) || fixedArrayTypes.has(type) || fixedTemporalTypes.has(type)
    || type === 'number' || type === 'switch' || type === 'location';
}
export function isWhatsAppContactMappingValid(mapping: WhatsAppContactMappings[number], field: WhatsAppContactField) {
  if (mapping.source !== 'fixed') return canMapWhatsAppContactField(mapping.source, field.type);
  const value = mapping.fixedValue;
  if (!canUseWhatsAppContactFixedField(field.type) || value === null || value === '') return false;
  if (field.type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (field.type === 'switch') return typeof value === 'boolean';
  if (field.type === 'location') return typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
  const strings = (input: unknown): input is string[] => Array.isArray(input) && input.length > 0
    && input.every(item => typeof item === 'string' && item.trim().length > 0);
  if (fixedTemporalTypes.has(field.type)) {
    const config = field.specialConfig as { selectionMode?: string } | null;
    return config?.selectionMode === 'range' ? strings(value) && value.length === 2
      : config?.selectionMode === 'multiple' ? strings(value) : typeof value === 'string' && value.trim().length > 0;
  }
  if (fixedArrayTypes.has(field.type) ? !strings(value) : typeof value !== 'string' || !value.trim()) return false;
  if (['select', 'radio', 'multi_select', 'checkbox_group'].includes(field.type) && Array.isArray(field.options)) {
    const options = new Set(field.options.map(option => typeof option === 'string' ? option : option?.value));
    return (Array.isArray(value) ? value : [value]).every(item => options.has(item));
  }
  return true;
}

import { z } from 'zod';

export const chatLocationInputSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  name: z.string().max(1024).optional(),
  address: z.string().max(4096).optional(),
});
const text = z.string().trim().min(1).max(4096).optional();
export const chatLocationAddressSchema = z.strictObject({
  provider: z.enum(['google', 'mapbox', 'tianditu']), language: z.string().trim().min(2).max(64),
  country: text, countryCode: text, province: text, provinceCode: text,
  city: text, cityCode: text, district: text, districtCode: text,
  address: text, street: text, poi: text, postcode: text,
}).refine(value => [value.country, value.province, value.city, value.district, value.street, value.poi,
  ...(value.provider === 'google' ? [] : [value.address])].some(Boolean), 'Location address is empty');
export const chatLocationSchema = chatLocationInputSchema.strict().extend({
  resolvedAddress: chatLocationAddressSchema.safeExtend({ resolvedAt: z.string().datetime() }).optional(),
});
export const chatLocationSendSchema = z.strictObject({
  conversationId: z.string().uuid(), clientMessageId: z.string().uuid(), location: chatLocationInputSchema.strict(),
});
export const chatLocationCacheSchema = z.strictObject({
  conversationId: z.string().uuid(), messageId: z.string().uuid(),
  latitude: chatLocationInputSchema.shape.latitude, longitude: chatLocationInputSchema.shape.longitude,
  address: chatLocationAddressSchema,
});
export type ChatLocation = z.infer<typeof chatLocationSchema>;
export type ChatLocationInput = z.infer<typeof chatLocationInputSchema>;

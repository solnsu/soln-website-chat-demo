import { z } from 'zod';
import { chatLocationInputSchema } from './chat-location.js';

export const CHAT_ANONYMOUS_MEDIA_MAX_BYTES = 16 * 1024 * 1024;
export const chatAnonymousMediaMimeSchema = z.string().max(127).regex(/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/);
export const chatAnonymousMediaKindSchema = z.enum(['image', 'file', 'voice']);
const uuid = z.string().uuid();
export const chatAnonymousSendInputSchema = z.strictObject({
  body: z.string().trim().max(4000).default(''), clientMessageId: uuid,
  mediaIds: z.array(uuid).max(10).refine(ids => new Set(ids).size === ids.length).default([]),
  stickerId: uuid.optional(), location: chatLocationInputSchema.strict().optional(), replyToMessageId: uuid.optional(),
}).refine(value => value.stickerId
  ? !value.body && !value.mediaIds.length && !value.location
  : Boolean(value.body || value.mediaIds.length || value.location) && !(value.location && value.mediaIds.length), 'CHAT_MESSAGE_CONTENT_INVALID');
export const chatAnonymousMediaUploadSchema = z.strictObject({
  name: z.string().trim().min(1).max(255).regex(/^[^/\\\x00-\x1f]+$/),
  mimeType: chatAnonymousMediaMimeSchema, kind: chatAnonymousMediaKindSchema,
  contentBase64: z.string().min(4).max(Math.ceil(CHAT_ANONYMOUS_MEDIA_MAX_BYTES / 3) * 4),
}).refine(value => value.kind !== 'voice' || ['audio/mp4','audio/mpeg','audio/ogg','audio/webm','audio/wav'].includes(value.mimeType))
  .refine(value => value.kind !== 'image' || ['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(value.mimeType));
export const chatAnonymousMediaSchema = z.strictObject({ assetId: uuid, name: z.string(),
  mimeType: chatAnonymousMediaMimeSchema, size: z.number().int().positive().max(CHAT_ANONYMOUS_MEDIA_MAX_BYTES) });
export const chatAnonymousMediaReadInputSchema = z.strictObject({ assetId: uuid });
export const chatAnonymousMediaContentSchema = chatAnonymousMediaSchema.extend({
  contentBase64: z.string().min(4).max(Math.ceil(CHAT_ANONYMOUS_MEDIA_MAX_BYTES / 3) * 4),
});
export const chatAnonymousStickerListInputSchema = z.strictObject({
  afterId: uuid.optional(), limit: z.number().int().min(1).max(100).default(40),
});
export type ChatAnonymousSendInput = z.input<typeof chatAnonymousSendInputSchema>;
export type ChatAnonymousMedia = z.infer<typeof chatAnonymousMediaSchema>;
export type ChatAnonymousMediaUpload = z.infer<typeof chatAnonymousMediaUploadSchema>;

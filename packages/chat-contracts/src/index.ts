import { z } from 'zod';
import { chatLocationSchema } from './chat-location.js';
import { chatContactCardsSchema } from './chat-contact-cards.js';
import { whatsAppTemplateSnapshotSchema } from './whatsapp-template.js';
import { guestChatAllowedMediaSchema } from './guest-media-policy.js';
export * from './guest-media-policy.js';
export * from './whatsapp-access.js';
export * from './chat-contact-cards.js';
export * from './chat-location.js';
export * from './chat-forward.js';

export const CHAT_MESSAGE_SCHEMA = 'soln.chat-message/v1';
export const CHAT_MESSAGE_PAGE_SCHEMA = 'soln.chat-message-page/v1';
export const MESSAGE_EVENT_SCHEMA = 'soln.message-event/v1';

const uuid = z.string().uuid();
const timestamp = z.string().datetime();
export const chatSequenceSchema = z.string().regex(/^(0|[1-9]\d{0,18})$/)
  .refine(value => value.length < 19 || value <= '9223372036854775807');
export const chatMemberSenderSchema = z.object({
  kind: z.literal('member'), id: uuid, name: z.string(),
  memberType: z.enum(['internal', 'external']), avatarAssetId: uuid.nullable(),
  gender: z.enum(['male', 'female']).nullable(),
}).strict();
export const chatSenderSchema = z.discriminatedUnion('kind', [
  chatMemberSenderSchema,
  z.object({ kind: z.literal('visitor'), id: uuid, name: z.string(), displayCode: z.string().min(1),
    avatarAssetId: z.null() }).strict(),
  z.object({ kind: z.literal('agent'), id: uuid, name: z.string(), avatarAssetId: uuid.nullable(),
    code: z.string().nullable(), iconKey: z.string().nullable() }).strict(),
  z.object({ kind: z.literal('system'), id: z.string().min(1), name: z.string(), avatarAssetId: z.null(),
    code: z.string().nullable(), iconKey: z.string().nullable() }).strict(),
]);
export const chatAttachmentSchema = z.object({ assetId: uuid, name: z.string(), mimeType: z.string(),
  size: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), kind: z.enum(['image', 'file', 'voice']) }).strict();
export const chatStickerSchema = z.object({ id: uuid, name: z.string(), scope: z.enum(['catalog', 'personal']),
  animationAssetId: uuid, thumbnailAssetId: uuid, width: z.number().int().positive(),
  height: z.number().int().positive() }).strict();
export const chatReactionSchema = z.strictObject({ emoji: z.string().min(1).max(128), sender: chatSenderSchema });
export type ChatReaction = z.infer<typeof chatReactionSchema>;
export const chatReactionEmojiSchema = z.string().max(128).refine(value => value === '' || new RegExp('^\\p{RGI_Emoji}$', 'v').test(value), 'Invalid emoji');
export const chatReactionInputSchema = z.strictObject({ conversationId: uuid, messageId: uuid, requestId: uuid, emoji: chatReactionEmojiSchema });
export const chatAnonymousReactionInputSchema = chatReactionInputSchema.omit({ conversationId: true });
export const chatReactionResultSchema = z.strictObject({ id: uuid, state: z.literal('sent'), reactions: z.array(chatReactionSchema) });
const standard = { kind: z.literal('standard'), body: z.string(),
  attachments: z.array(chatAttachmentSchema), sticker: z.null(), location: chatLocationSchema.optional(), contacts: chatContactCardsSchema.optional(), template: whatsAppTemplateSnapshotSchema.optional() };
const sticker = { kind: z.literal('sticker'), body: z.literal(''),
  attachments: z.tuple([]), sticker: chatStickerSchema };
const reference = { id: uuid, sender: chatSenderSchema };
export const chatMessageReferenceSchema = z.discriminatedUnion('kind', [
  z.object({ ...reference, ...standard }).strict(), z.object({ ...reference, ...sticker }).strict(),
]);
const sharedHistoryReference = { ...reference, createdAt: timestamp,
  whatsappContact: z.strictObject({ profileName: z.string(), phoneNumber: z.string(), nickname: z.string().nullable() }).optional() };
export const chatSharedHistoryMessageSchema = z.discriminatedUnion('kind', [
  z.object({ ...sharedHistoryReference, ...standard }).strict(),
  z.object({ ...sharedHistoryReference, ...sticker }).strict(),
]);
export const chatSharedHistorySchema = z.strictObject({ messages: z.array(chatSharedHistoryMessageSchema).min(1).max(100) });
export type ChatSharedHistory = z.infer<typeof chatSharedHistorySchema>;
export type ChatSharedHistoryMessage = z.infer<typeof chatSharedHistoryMessageSchema>;
const message = { systemNotice: z.strictObject({ type: z.literal('guest_session_ended') }).optional(), sharedHistory: chatSharedHistorySchema.optional(), schema: z.literal(CHAT_MESSAGE_SCHEMA), id: uuid, sequence: chatSequenceSchema,
  conversationId: uuid, sender: chatSenderSchema, replyToMessage: chatMessageReferenceSchema.nullable(), createdAt: timestamp, reactions: z.array(chatReactionSchema).optional() };
export const chatMessageSchema = z.discriminatedUnion('kind', [
  z.object({ ...message, ...standard }).strict(), z.object({ ...message, ...sticker }).strict(),
]);
export const chatMessagePageSchema = z.object({ schema: z.literal(CHAT_MESSAGE_PAGE_SCHEMA),
  conversationId: uuid, items: z.array(chatMessageSchema), hasMore: z.boolean(), nextBeforeSequence: chatSequenceSchema.nullable(),
  limit: z.number().int().min(1).max(500) }).strict();

// Member text commands retain their narrower input; anonymous messaging has a scoped media contract.
export const chatSendTextInputSchema = z.object({ body: z.string().trim().min(1).max(4000), clientMessageId: uuid }).strict();
export const chatListMessagesInputSchema = z.object({ beforeSequence: chatSequenceSchema.nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50) }).strict();
export const chatMarkReadInputSchema = z.object({ lastReadSequence: chatSequenceSchema, lastReadReactionId: uuid.optional() }).strict();
export const chatSendResultSchema = z.object({ conversationId: uuid, messageId: uuid, sequence: chatSequenceSchema }).strict();
export const chatReadResultSchema = z.object({ conversationId: uuid, lastReadSequence: chatSequenceSchema, lastReadReactionId: uuid.optional() }).strict();
export const anonymousChatSessionSchema = z.object({
  visitor: z.object({ id: uuid, displayCode: z.string().min(1) }).strict(),
  conversationId: uuid, expiresAt: timestamp, guestSessionEndedAt: timestamp.nullable(), canSendMessages: z.boolean(),
  lastReadSequence: chatSequenceSchema, unreadCount: z.number().int().nonnegative(),
  support: chatMemberSenderSchema.extend({ memberType: z.literal('internal') }),
  allowedMedia: guestChatAllowedMediaSchema,
}).strict();
export const anonymousChatCreatedSessionSchema = anonymousChatSessionSchema.extend({
  sessionToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});
const event = { schema: z.literal(MESSAGE_EVENT_SCHEMA), id: z.string().min(1), occurredAt: timestamp,
  actorMemberId: uuid.nullable() };
// Inbox content belongs to its application; only chat content uses ChatMessage.
export const messageEventSchema = z.discriminatedUnion('source', [
  z.object({ ...event, source: z.literal('chat'), conversationId: uuid, message: chatMessageSchema,
    action: z.enum(['sent', 'replied', 'deleted']), deletionScope: z.enum(['self', 'everyone']).optional() }).strict(),
  z.object({ ...event, source: z.literal('inbox'), appCode: z.string().min(1), message: z.record(z.string(), z.unknown()),
    action: z.enum(['sent', 'deleted']) }).strict(),
]).superRefine((value, context) => {
  if (value.source === 'chat' && (value.action === 'deleted') !== (value.deletionScope !== undefined)) {
    context.addIssue({ code: 'custom', path: ['deletionScope'], message: 'Required only for deleted chat events' });
  }
});

export type ChatSender = z.infer<typeof chatSenderSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatMessageReference = z.infer<typeof chatMessageReferenceSchema>;
export type ChatMessagePage = z.infer<typeof chatMessagePageSchema>;
export type ChatSendTextInput = z.input<typeof chatSendTextInputSchema>;
export type ChatListMessagesInput = z.input<typeof chatListMessagesInputSchema>;
export type ChatMarkReadInput = z.input<typeof chatMarkReadInputSchema>;
export type ChatSendResult = z.infer<typeof chatSendResultSchema>;
export type AnonymousChatSession = z.infer<typeof anonymousChatSessionSchema>;
export type MessageEvent = z.infer<typeof messageEventSchema>;

export { chatContractDeclaration } from './declaration.js';
export * from './anonymous-media.js';
export const chatAnonymousStickerPageSchema = z.strictObject({
  items: z.array(chatStickerSchema), nextAfterId: uuid.nullable(),
});

export * from "./whatsapp-template.js";
export * from './whatsapp-contact-settings.js';
export * from './whatsapp-contact-address.js';
export * from './whatsapp-saved-contact.js';
export * from './whatsapp-conversation-contact.js';
export * from './whatsapp-contact-name.js';

export * from './whatsapp-interactive.js';
export * from './whatsapp-system.js';

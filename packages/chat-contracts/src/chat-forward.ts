import { z } from 'zod';

export const chatForwardMessagesSchema = z.strictObject({
  mode: z.enum(['individual', 'merged']).default('individual').describe('Merged sends one read-only history card to each internal conversation.'),
  messageIds: z.array(z.uuid()).min(1).max(100)
    .refine(ids => new Set(ids).size === ids.length, 'CHAT_MESSAGE_IDS_DUPLICATED'),
  targetMemberIds: z.array(z.uuid()).max(100)
    .refine(ids => new Set(ids).size === ids.length, 'CHAT_TARGET_MEMBER_IDS_DUPLICATED'),
  targetConversationIds: z.array(z.uuid()).max(100)
    .refine(ids => new Set(ids).size === ids.length, 'CHAT_TARGET_CONVERSATION_IDS_DUPLICATED'),
  clientBatchId: z.uuid(),
}).refine(value => value.targetMemberIds.length + value.targetConversationIds.length > 0,
  'CHAT_FORWARD_TARGET_REQUIRED')
  .refine(value => value.messageIds.length * (value.targetMemberIds.length + value.targetConversationIds.length) <= 500,
    'CHAT_FORWARD_DELIVERY_LIMIT_EXCEEDED');

export type ChatForwardMessagesInput = z.input<typeof chatForwardMessagesSchema>;

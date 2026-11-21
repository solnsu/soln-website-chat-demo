import { z } from 'zod';

// Keep provider fields intact: system notifications can evolve independently of chat messages.
export const whatsAppSystemNoticeSchema = z.looseObject({
  type: z.string().min(1).max(100),
  body: z.string().max(4000).optional(),
  wa_id: z.string().min(1).max(100).optional(),
  user_id: z.string().min(1).max(256).optional(),
  previous_user_id: z.string().min(1).max(256).optional(),
});
export type WhatsAppSystemNotice = z.infer<typeof whatsAppSystemNoticeSchema>;

export function whatsAppSystemNoticeContent(notice: WhatsAppSystemNotice) {
  if (notice.type === 'user_changed_number') {
    return { key: 'numberChanged', values: {} };
  }
  if (notice.type === 'user_changed_user_id') return { key: 'userIdChanged', values: {} };
  if (notice.type === 'customer_identity_changed') return { key: 'identityChanged', values: {} };
  return { key: 'generic', values: {} };
}

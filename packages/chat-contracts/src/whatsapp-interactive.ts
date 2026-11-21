import { z } from 'zod';

export const whatsAppInteractiveReplySchema = z.strictObject({
  type: z.enum(['button_reply', 'list_reply', 'template_button_reply']), id: z.string().min(1).max(1024),
  title: z.string().min(1).max(1024), description: z.string().max(1024).optional(),
  contextProviderId: z.string().min(1).max(512).optional(),
});
export type WhatsAppInteractiveReply = z.infer<typeof whatsAppInteractiveReplySchema>;

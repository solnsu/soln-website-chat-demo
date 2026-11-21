import { z } from 'zod';

const text = z.string().max(4096);
const entryType = z.string().max(128).optional();
export const chatContactCardSchema = z.object({
  name: z.object({ formatted_name: text.min(1), first_name: text.optional(), last_name: text.optional(),
    middle_name: text.optional(), prefix: text.optional(), suffix: text.optional() }),
  phones: z.array(z.object({ phone: text.optional(), wa_id: z.string().regex(/^\d{5,20}$/).optional(), type: entryType })).max(100).optional(),
  emails: z.array(z.object({ email: text, type: entryType })).max(100).optional(),
  urls: z.array(z.object({ url: text, type: entryType })).max(100).optional(),
  addresses: z.array(z.object({ street: text.optional(), city: text.optional(), state: text.optional(),
    zip: text.optional(), country: text.optional(), country_code: z.string().max(8).optional(), type: entryType })).max(100).optional(),
  org: z.object({ company: text.optional(), department: text.optional(), title: text.optional() }).optional(),
  birthday: z.string().max(32).optional(),
});
export const chatContactCardsSchema = z.array(chatContactCardSchema).min(1).max(100);
export type ChatContactCard = z.infer<typeof chatContactCardSchema>;


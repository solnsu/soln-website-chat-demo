import { z } from 'zod';

export const whatsAppTemplateLocationSchema = z.strictObject({
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
  name: z.string().trim().min(1).max(1024).optional(), address: z.string().trim().min(1).max(4096).optional(),
});
export type WhatsAppTemplateLocation = z.infer<typeof whatsAppTemplateLocationSchema>;

const key = z.string().regex(/^[a-z0-9_.]{1,100}$/);
export const whatsAppChatTemplateListSchema = z.strictObject({
  conversationId: z.string().uuid(), keyword: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20),
});
export const whatsAppChatTemplateSendSchema = z.strictObject({
  conversationId: z.string().uuid(), clientMessageId: z.string().uuid(),
  templateId: z.string().regex(/^\d{5,30}$/), revision: z.string().regex(/^[a-f0-9]{64}$/),
  values: z.record(key, z.string().trim().min(1).max(1024)).default({}),
  assets: z.record(key, z.string().uuid()).default({}),
  locations: z.record(key, whatsAppTemplateLocationSchema).default({}),
});
export type WhatsAppTemplateField = { key: string; kind: 'text' | 'image' | 'video' | 'document' | 'location';
  section: 'header' | 'body' | 'button'; parameter?: string; cardIndex?: number; buttonIndex?: number };
export type WhatsAppTemplateBlock = { key: string; kind: 'header' | 'body' | 'footer' | 'button' | 'media' | 'location'; text: string;
  parameters: { token: string; key: string }[]; cardIndex?: number; mediaKey?: string; mediaType?: string; location?: WhatsAppTemplateLocation;
  buttonType?: string; buttonUrl?: string; buttonPhoneNumber?: string };
export type WhatsAppSendableTemplate = { id: string; revision: string; name: string; language: string; category: string;
  supported: boolean; fields: WhatsAppTemplateField[]; blocks: WhatsAppTemplateBlock[] };
export const whatsAppTemplateSnapshotSchema = z.strictObject({
  id: z.string(), revision: z.string(), businessAccountId: z.string(), name: z.string(), language: z.string(), category: z.string(),
  components: z.array(z.record(z.string(), z.unknown())), values: z.record(z.string(), z.string()),
  locations: z.record(z.string(), whatsAppTemplateLocationSchema),
  blocks: z.array(z.strictObject({ key: z.string(), kind: z.enum(['header', 'body', 'footer', 'button', 'media', 'location']), text: z.string(),
    parameters: z.array(z.strictObject({ token: z.string(), key: z.string() })), cardIndex: z.number().int().nonnegative().optional(),
    mediaKey: z.string().optional(), mediaType: z.string().optional(), location: whatsAppTemplateLocationSchema.optional(),
    buttonType: z.string().optional(), buttonUrl: z.string().optional(), buttonPhoneNumber: z.string().optional() })),
  media: z.array(z.strictObject({ key: z.string(), assetId: z.string().uuid(), mimeType: z.string(), fileName: z.string() })),
});
export type WhatsAppTemplateSnapshot = z.infer<typeof whatsAppTemplateSnapshotSchema>;

export function renderWhatsAppTemplateBlocks(blocks: WhatsAppTemplateBlock[], values: Record<string, string>) {
  return blocks.map(block => {
    const render = (text: string) => text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (matched, token: string) => {
      const parameter = block.parameters.find(parameter => parameter.token === token);
      return parameter ? values[parameter.key] ?? matched : matched;
    });
    return { ...block, text: render(block.text), ...(block.buttonUrl ? { buttonUrl: render(block.buttonUrl) } : {}) };
  });
}

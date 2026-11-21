import { z } from 'zod';

export const GUEST_CHAT_MEDIA_TYPES = ['image', 'video', 'audio', 'voice', 'file', 'sticker', 'location'] as const;
export const guestChatMediaTypeSchema = z.enum(GUEST_CHAT_MEDIA_TYPES);
export const guestChatAllowedMediaSchema = z.array(guestChatMediaTypeSchema).max(GUEST_CHAT_MEDIA_TYPES.length)
  .refine(types => new Set(types).size === types.length);
export type GuestChatMediaType = z.infer<typeof guestChatMediaTypeSchema>;

export const CHAT_DOCUMENT_ATTACHMENT_ACCEPT = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/xml', 'text/plain', 'text/markdown', 'text/xml',
  '.pdf', '.docx', '.xlsx', '.txt', '.md', '.markdown', '.xml',
] as const;

export function guestChatAttachmentMediaType(attachment: { kind: string; mimeType: string }): GuestChatMediaType {
  if (attachment.kind === 'voice') return 'voice';
  const mime = attachment.mimeType.toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

export function guestChatFileAccept(types: readonly GuestChatMediaType[]) {
  if ((['image', 'video', 'audio', 'file'] as const).every(type => types.includes(type))) return undefined;
  return [types.includes('image') ? 'image/*' : '', types.includes('video') ? 'video/*' : '',
    types.includes('audio') ? 'audio/*' : '', ...(types.includes('file') ? CHAT_DOCUMENT_ATTACHMENT_ACCEPT : [])]
    .filter(Boolean).join(',');
}

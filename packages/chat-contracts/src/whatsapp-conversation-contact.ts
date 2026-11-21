import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import type { WhatsAppContactData } from './whatsapp-saved-contact.js';

export const whatsAppContactNicknameSaveSchema = z.strictObject({
  conversationId: z.uuid().optional(), contactId: z.uuid().optional(),
  nickname: z.string().trim().min(1).max(256),
}).refine(value => Boolean(value.conversationId) !== Boolean(value.contactId), 'Select one contact target');
export type WhatsAppContactNicknameSaveInput = z.infer<typeof whatsAppContactNicknameSaveSchema>;

export const whatsAppConversationContactGetSchema = z.strictObject({ conversationId: z.uuid() });
export const whatsAppConversationContactCreateSchema = z.strictObject({
  conversationId: z.uuid().optional(),phoneNumberId:z.string().regex(/^\d{5,30}$/).optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/).refine(value =>
    parsePhoneNumberFromString(value)?.isValid() === true, 'Invalid international phone number'),
  firstName: z.string().trim().min(1).max(128),
  lastName: z.string().trim().max(127).optional(),
});
export type WhatsAppConversationContactCreateInput = z.infer<typeof whatsAppConversationContactCreateSchema>;
export type WhatsAppConversationContactStatus = { contactId: string | null; canEditNickname: boolean };
export type WhatsAppConversationContactCreateResult = Pick<WhatsAppConversationContactStatus,'contactId'> & { id: string };

export const whatsAppContactDirectoryListSchema = z.strictObject({
  phoneNumberId:z.string().regex(/^\d{5,30}$/).optional(), keyword:z.string().trim().max(200).optional(), page:z.number().int().min(1).default(1), pageSize:z.number().int().min(1).max(100).default(50),
});
export const whatsAppSavedContactOpenSchema = z.strictObject({contactId:z.uuid(),phoneIndex:z.number().int().min(0).max(99)});
export const whatsAppDirectoryConversationOpenSchema = z.strictObject({conversationId:z.uuid()});
export type WhatsAppContactDirectoryListInput = z.infer<typeof whatsAppContactDirectoryListSchema>;
export type WhatsAppContactDirectoryEntry = {id:string;name:string;canEditNickname:boolean;nickname?:string|null;contact:WhatsAppContactData;phones:Array<{index:number;number:string}>}
  & ({source:'saved'} | {source:'conversation';conversationId:string});
export type WhatsAppContactDirectoryPage = {items:WhatsAppContactDirectoryEntry[];total:number;page:number;pageSize:number};

export const whatsAppContactShareSchema = z.strictObject({
  conversationId: z.uuid(),
  targetConversationIds: z.array(z.uuid()).max(100).refine(ids => new Set(ids).size === ids.length),
  targetMemberIds: z.array(z.uuid()).max(100).refine(ids => new Set(ids).size === ids.length),
  clientBatchId: z.uuid(),
}).refine(value => value.targetConversationIds.length + value.targetMemberIds.length > 0 && value.targetConversationIds.length + value.targetMemberIds.length <= 100, 'Select 1–100 destinations');
export type WhatsAppContactShareInput = z.infer<typeof whatsAppContactShareSchema>;

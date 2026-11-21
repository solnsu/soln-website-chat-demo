import type { WhatsAppContactAddress } from './whatsapp-contact-address.js';

export type WhatsAppContactData = {
  name: { formatted_name: string; first_name?: string; last_name?: string; middle_name?: string; prefix?: string; suffix?: string };
  phones?: Array<{ phone?: string; wa_id?: string; type?: string }>;
  emails?: Array<{ email: string; type?: string }>;
  urls?: Array<{ url: string; type?: string }>;
  addresses?: WhatsAppContactAddress[];
  org?: { company?: string; department?: string; title?: string };
  birthday?: string;
};
export type SavedWhatsAppContact = {
  id: string; phoneNumberId: string; nickname?: string | null; name: string; contact: WhatsAppContactData;
  boundRecord: { formName: string; formApiName: string; title: string } | null;
  createdAt: string; updatedAt: string; recordId: string | null; importError: string | null;
};
export type WhatsAppContactBindingStatus = 'bound' | 'unbound';
export type SavedWhatsAppContactListInput = {
  phoneNumberId?:string; keyword?: string; bindingStatus?: WhatsAppContactBindingStatus; page: number; pageSize: number;
};
export type WhatsAppContactImportProgress = {
  id: string; status: 'pending' | 'completed' | 'cancelled'; total: number; succeeded: number; failed: number; pending: number;
};
export type SavedWhatsAppContactPage = {
  items: SavedWhatsAppContact[]; total: number; page: number; pageSize: number; importProgress: WhatsAppContactImportProgress | null;
};

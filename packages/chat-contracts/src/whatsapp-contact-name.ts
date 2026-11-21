import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

export function normalizeWhatsAppProfileName(name: string, phone: string) {
  const number = /^\d+$/.test(phone) ? `+${phone}` : phone;
  const suffix = ` · ${number}`;
  return (name.endsWith(suffix) ? name.slice(0, -suffix.length) : name).trim();
}

/** A received profile name is distinct from the workspace-owned nickname. */
export function formatWhatsAppContactName(name: string, phone: string, nickname?: string | null, locale = 'en') {
  if (nickname) return nickname;
  const number = /^\d+$/.test(phone) ? `+${phone}` : phone;
  const parsed = parsePhoneNumberFromString(number);
  const source = normalizeWhatsAppProfileName(name, phone);
  const region = parsed?.country ? new Intl.DisplayNames([locale, 'en'], {type: 'region', fallback: 'none'}).of(parsed.country) : undefined;
  return [region, source || number].filter(Boolean).join(' · ');
}

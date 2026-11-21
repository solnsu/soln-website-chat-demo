export type WhatsAppContactAddress = {
  street?: string; city?: string; state?: string; zip?: string;
  country?: string; country_code?: string; type?: string;
};

const clean = (value: string | undefined) => value?.trim() || undefined;

export function formatWhatsAppContactAddress(address: WhatsAppContactAddress) {
  return [clean(address.country) || clean(address.country_code), address.state, address.city, address.street, address.zip]
    .map(clean).filter(Boolean).join(' ');
}

/** Convert supplied address parts only; contact cards do not carry coordinates or district codes. */
export function mapWhatsAppContactAddressValue(address: WhatsAppContactAddress | undefined, targetType: string) {
  if (!address) return undefined;
  const formatted = formatWhatsAppContactAddress(address);
  if (!formatted) return undefined;
  if (targetType === 'location') {
    const parts = {
      address: clean(address.street) || formatted,
      street: clean(address.street), country: clean(address.country), countryCode: clean(address.country_code),
      province: clean(address.state), city: clean(address.city), postcode: clean(address.zip),
    };
    return Object.fromEntries(Object.entries(parts).filter(([, value]) => value !== undefined));
  }
  if (['text', 'textarea', 'autocomplete'].includes(targetType)) return formatted;
  throw new Error('WHATSAPP_CONTACT_MAPPING_INVALID');
}

export type WebsiteChatConfig = { runtimeOrigin: string; entryId: string };

export function getWebsiteChatConfig(): WebsiteChatConfig | null {
  const runtimeOrigin = process.env.WEBSITE_CHAT_RUNTIME_ORIGIN?.trim();
  const entryId = process.env.WEBSITE_CHAT_ENTRY_ID?.trim();
  if (!runtimeOrigin && !entryId) return null;
  if (!runtimeOrigin || !entryId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId)) {
    throw new Error('WEBSITE_CHAT_CONFIGURATION_INVALID');
  }
  const url = new URL(runtimeOrigin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== runtimeOrigin) {
    throw new Error('WEBSITE_CHAT_CONFIGURATION_INVALID');
  }
  return { runtimeOrigin, entryId };
}

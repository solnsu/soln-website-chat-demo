import type { AnonymousChatMessage, AnonymousChatMessagePage } from '@soln/chat-sdk';

export function mergeChatHistory(current: AnonymousChatMessage[], page: AnonymousChatMessagePage, older = false) {
  const boundary = page.items.reduce<string | undefined>((value, item) =>
    value === undefined || BigInt(item.sequence) < BigInt(value) ? item.sequence : value, undefined);
  const kept = older ? current : boundary ? current.filter(item => BigInt(item.sequence) < BigInt(boundary)) : [];
  const byId = new Map([...kept, ...page.items].map(item => [item.id, item]));
  return [...byId.values()].sort((a, b) => BigInt(a.sequence) < BigInt(b.sequence) ? -1 : BigInt(a.sequence) > BigInt(b.sequence) ? 1 : 0);
}

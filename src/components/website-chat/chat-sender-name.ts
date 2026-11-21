import type { ChatSender } from '@soln/chat-sdk';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';

export function chatSenderName(sender: ChatSender, visitorId: string | undefined, copy: WebsiteChatCopy) {
  return sender.kind === 'visitor' && sender.id === visitorId ? copy.yourself : sender.name;
}

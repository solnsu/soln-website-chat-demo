'use client';

import { ChatEmojiPicker } from '@soln/chat-ui/emoji';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import { WebsiteChatScrollBoundary } from './WebsiteChatScrollBoundary';

export function WebsiteChatEmojiPicker({ locale, copy, onSelect, disabled, selected, reaction = false }: {
  locale: string; copy: WebsiteChatCopy; onSelect: (emoji: string) => void; disabled: boolean;
  selected?: string; reaction?: boolean;
}) {
  return <WebsiteChatScrollBoundary className="tenant-chat-reaction-menu tenant-chat-reaction-menu--expanded">
    <ChatEmojiPicker locale={locale} selected={selected ?? null} disabled={disabled} onSelect={onSelect}
      copy={{ ...copy.emojiPicker, select: (emoji, selected) => (reaction
        ? selected ? copy.removeReaction : copy.reactWith : copy.emojiPicker.select).replace('{emoji}', emoji) }} />
  </WebsiteChatScrollBoundary>;
}

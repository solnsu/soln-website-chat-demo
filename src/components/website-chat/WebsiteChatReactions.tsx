'use client';

import { useState } from 'react';
import { theme } from 'antd';
import { AiOutlineDelete } from 'react-icons/ai';
import { SolnSpin } from '@soln/chat-ui';
import type { AnonymousChatClient, AnonymousChatMessage } from '@soln/chat-sdk';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import { WebsiteChatAvatar } from './WebsiteChatAvatar';
import { chatSenderName } from './chat-sender-name';

export function WebsiteChatReactions({ reactions, visitorId, unavailable, copy, readMedia, onRemove }: {
  reactions: AnonymousChatMessage['reactions']; visitorId?: string; unavailable: boolean; copy: WebsiteChatCopy;
  readMedia: AnonymousChatClient['readMedia']; onRemove: () => Promise<void>;
}) {
  const { token } = theme.useToken();
  const [removing, setRemoving] = useState(false);
  if (!reactions?.length) return null;
  return <span className="tenant-chat-whatsapp-reactions">
    {reactions.map(reaction => {
      const own = reaction.sender.kind === 'visitor' && reaction.sender.id === visitorId;
      const name = chatSenderName(reaction.sender, visitorId, copy);
      return <span key={`${reaction.sender.kind}:${reaction.sender.id}`} className="tenant-chat-whatsapp-reaction"
        title={`${name}: ${reaction.emoji}`} aria-label={`${name}: ${reaction.emoji}`} aria-busy={own && removing || undefined}
        style={{ background: token.colorBgContainer, borderColor: token.colorBorderSecondary }}>
        <span aria-hidden="true">{reaction.emoji}</span>
        <span className="tenant-chat-whatsapp-reaction__avatar">
          <WebsiteChatAvatar sender={reaction.sender} readMedia={readMedia} size={22} round />
          {own && removing ? <SolnSpin size={26} style={{ position: 'absolute', inset: -2 }} /> : null}
          {own ? <button type="button" className="tenant-chat-whatsapp-reaction__remove"
            aria-label={copy.removeReaction.replace('{emoji}', reaction.emoji)}
            title={copy.removeReaction.replace('{emoji}', reaction.emoji)} disabled={unavailable || removing}
            onPointerDown={event => event.stopPropagation()}
            onClick={event => {
              event.stopPropagation();
              if (removing || unavailable) return;
              setRemoving(true); void onRemove().finally(() => setRemoving(false));
            }}><AiOutlineDelete size={16} aria-hidden="true" /></button> : null}
        </span>
      </span>;
    })}
  </span>;
}

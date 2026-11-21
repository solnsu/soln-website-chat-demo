'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import type { AnonymousChatMessage } from '@soln/chat-sdk';
import { ChatMessageContent, ChatMessageLayout, SolnSpin } from '@soln/chat-ui';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import type { WebsiteChatConfig } from '@/lib/website-chat-config';
import { useWebsiteChat } from './useWebsiteChat';
import { WebsiteChatComposer } from './WebsiteChatComposer';
import { WebsiteChatAvatar } from './WebsiteChatAvatar';
import { WebsiteChatMessageContent } from './WebsiteChatMessageContent';
import { WebsiteChatMessageMenu } from './WebsiteChatMessageMenu';
import { WebsiteChatReactions } from './WebsiteChatReactions';
import { WebsiteChatMessageTime } from './WebsiteChatMessageTime';
import styles from './WebsiteChatWidget.module.css';

export default function WebsiteChatPanel({ config, active, copy, locale }: {
  config: WebsiteChatConfig; active: boolean; copy: WebsiteChatCopy; locale: string;
}) {
  const chat = useWebsiteChat(config, active);
  const scroll = useRef<HTMLDivElement>(null);
  const [reply, setReply] = useState<AnonymousChatMessage | null>(null);
  const follow = useRef(true);
  const [greetedConversationId, setGreetedConversationId] = useState<string | null>(null);
  const conversationId = chat.session?.conversationId;
  const showGreeting = Boolean(conversationId && greetedConversationId === conversationId);
  const newest = chat.messages.at(-1)?.id;
  const clock = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
  useEffect(() => {
    if (!active || chat.loading || !conversationId || greetedConversationId === conversationId) return;
    if (chat.messages.length) {
      setGreetedConversationId(conversationId);
      return;
    }
    const timer = window.setTimeout(() => setGreetedConversationId(conversationId), 1000);
    return () => window.clearTimeout(timer);
  }, [active, chat.loading, conversationId, chat.messages.length, greetedConversationId]);
  useEffect(() => {
    if (active && follow.current) {
      scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'instant' });
    }
  }, [active, newest, showGreeting]);
  useEffect(() => {
    const content = scroll.current?.firstElementChild;
    if (!active || !content || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => { if (follow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; });
    observer.observe(content); return () => observer.disconnect();
  }, [active]);
  const unavailable = Boolean(chat.error === 'expired' || !chat.session?.canSendMessages);
  useEffect(() => { setReply(null); }, [conversationId]);
  return <>
    <div className={`${styles.messages} cp-sidebar-scrollbar`} ref={scroll} data-chat-media-scroll aria-busy={chat.loading}
      onScroll={() => { const node = scroll.current; if (node) follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 64; }}>
      <div role="log" aria-live="polite" aria-relevant="additions text">
        {showGreeting ? <ChatMessageLayout own={false} className={styles.greeting} avatar={<img src="/workspace-app-icons/luna/luna.png" width={36} height={36} alt="" aria-hidden="true" />}>
          <ChatMessageContent own={false} dark hasBubble className={styles.bubble} expandLabel={copy.showMore} collapseLabel={copy.collapse}>
            <p>{copy.greeting}</p>
          </ChatMessageContent>
        </ChatMessageLayout> : null}
        {chat.before ? <button type="button" className={styles.history} disabled={chat.loadingOlder}
          onClick={() => {
            const height = scroll.current?.scrollHeight || 0;
            void chat.loadOlder().then(() => requestAnimationFrame(() => {
              if (scroll.current) scroll.current.scrollTop += scroll.current.scrollHeight - height;
            }));
          }}>{chat.loadingOlder ? <SolnSpin size={16} color="currentColor" /> : copy.loadOlder}</button> : null}
        {chat.messages.map(message => {
          if (message.systemNotice?.type === 'guest_session_ended') return <p key={`${conversationId}:${message.id}`}
            className={styles.systemNotice} data-message-id={message.id}>{copy.ended}</p>;
          const own = message.sender.kind === 'visitor' && message.sender.id === chat.session?.visitor.id;
          const ownEmoji = message.reactions?.find(reaction => reaction.sender.kind === 'visitor'
            && reaction.sender.id === chat.session?.visitor.id)?.emoji;
          return <WebsiteChatMessageMenu key={`${conversationId}:${message.id}`} message={message} active={active} own={own}
            unavailable={unavailable} locale={locale} copy={copy} ownEmoji={ownEmoji}
            onReply={() => setReply(message)} onReact={emoji => void chat.react(message.id, emoji)}>
          <ChatMessageLayout own={own} className={styles.message} data-own={own} data-message-id={message.id}
            avatar={!own ? <WebsiteChatAvatar sender={message.sender} readMedia={chat.readMedia} /> : null}
            sender={!own ? <span className={styles.sender}>{message.sender.name}</span> : null}
            actions={<WebsiteChatMessageTime body={message.body} createdAt={message.createdAt}
              label={clock.format(new Date(message.createdAt))} copy={copy} />}>
            <WebsiteChatMessageContent message={message} own={own} visitorId={chat.session?.visitor.id} readMedia={chat.readMedia} copy={copy}
              onLocate={id => scroll.current?.querySelector(`[data-message-id="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })}
              footer={<WebsiteChatReactions reactions={message.reactions} visitorId={chat.session?.visitor.id}
                unavailable={unavailable} copy={copy} readMedia={chat.readMedia} onRemove={() => chat.react(message.id, '')} />} />
          </ChatMessageLayout>
          </WebsiteChatMessageMenu>;
        })}
      </div>
    </div>
    {chat.error && chat.error !== 'expired' ? <div role="alert" className={styles.notice}>
      <span>{copy[chat.error]}</span>
      {chat.error === 'loadFailed' ? <button type="button" onClick={chat.retry}>{copy.retry}</button> : null}
    </div> : null}
    {chat.session && !chat.session.canSendMessages && !chat.error ? <p role="status" className={styles.notice}>
      {copy.handoff}
    </p> : null}
    {chat.error === 'expired' ? <div className={styles.newConversation}>
      <Button onClick={() => void chat.startNew()}>{copy.startNew}</Button>
    </div> : <WebsiteChatComposer chat={chat} active={active} copy={copy} locale={locale} reply={reply} clearReply={() => setReply(null)} onSend={() => { follow.current = true; }} />}
  </>;
}

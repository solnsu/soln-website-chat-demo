'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MapPin } from 'lucide-react';
import { ChatAttachmentGroup, ChatMessageContent, ChatMessagePayload, ChatMessageQuote,
  groupChatAttachments, useChatMessageColors } from '@soln/chat-ui';
import type { AnonymousChatClient, AnonymousChatMessage, ChatLocation } from '@soln/chat-sdk';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import { WebsiteChatMedia } from './WebsiteChatMedia';
import styles from './WebsiteChatWidget.module.css';
import { chatSenderName } from './chat-sender-name';

type Message = Pick<AnonymousChatMessage, 'body' | 'attachments' | 'sticker'> &
  Partial<Pick<AnonymousChatMessage, 'id' | 'replyToMessage' | 'sharedHistory'>> & { location?: ChatLocation };

export function WebsiteChatMessageContent({ message, readMedia, copy, own = false, footer, onLocate, visitorId }: {
  message: Message; readMedia: AnonymousChatClient['readMedia']; copy: WebsiteChatCopy;
  visitorId?: string; own?: boolean; footer?: ReactNode; onLocate?: (id: string) => void;
}) {
  const { fileStyle } = useChatMessageColors(own, true);
  const voice = message.attachments.filter(file => file.kind === 'voice');
  const groups = groupChatAttachments(message.attachments.filter(file => file.kind !== 'voice'));
  const hasBubble = Boolean(message.body || voice.length || message.replyToMessage || message.sharedHistory);
  const reply = message.replyToMessage;
  return <ChatMessagePayload own={own} expandLabel={copy.showMore} collapseLabel={copy.collapse}>
    <ChatMessageContent own={own} dark hasBubble={hasBubble} className={styles.bubble}
      collapsible={!message.sharedHistory} collapseKey={message.id}
      expandLabel={copy.showMore} collapseLabel={copy.collapse} footer={hasBubble ? footer : undefined}
      media={<>
        {groups.map(group => <ChatAttachmentGroup key={group[0].kind} kind={group[0].kind} count={group.length}
          hasVideo={group.some(file => file.mimeType.startsWith('video/'))} style={fileStyle}>
          {group.map(file => <WebsiteChatMedia key={file.assetId} {...file} readMedia={readMedia} copy={copy} />)}
        </ChatAttachmentGroup>)}
        {message.sticker ? <WebsiteChatMedia assetId={message.sticker.animationAssetId} name={message.sticker.name}
          mimeType="image/png" kind="image" thumbnail readMedia={readMedia} copy={copy} /> : null}
        {message.location ? <a className={styles.attachment}
          href={`https://www.openstreetmap.org/?mlat=${message.location.latitude}&mlon=${message.location.longitude}#map=16/${message.location.latitude}/${message.location.longitude}`}
          target="_blank" rel="noopener noreferrer"><MapPin size={16} />{message.location.name || message.location.address || copy.location}
          {' '}{message.location.latitude.toFixed(6)}, {message.location.longitude.toFixed(6)}</a> : null}
      </>}>
      {reply ? <ChatMessageQuote title={chatSenderName(reply.sender, visitorId, copy)} label={copy.reply}
        preview={reply.body || reply.sticker?.name || reply.attachments[0]?.name}
        onLocate={() => onLocate?.(reply.id)} /> : null}
      {voice.map(file => <WebsiteChatMedia key={file.assetId} {...file} readMedia={readMedia} copy={copy} />)}
      {message.body ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        a: props => <a {...props} target="_blank" rel="noopener noreferrer" />,
        img: ({ alt }) => <span>{alt || copy.attachment}</span>,
      }}>{message.body}</ReactMarkdown> : null}
      {message.sharedHistory?.messages.map(shared => <div key={shared.id} className={styles.sharedHistory}>
        <strong>{shared.sender.name}</strong>
        <WebsiteChatMessageContent message={shared} visitorId={visitorId} readMedia={readMedia} copy={copy} />
      </div>)}
    </ChatMessageContent>
    {!hasBubble ? footer : null}
  </ChatMessagePayload>;
}

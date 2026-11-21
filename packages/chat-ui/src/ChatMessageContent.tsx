'use client';

import React, { type CSSProperties, type ReactNode } from 'react';
import { theme } from 'antd';
import { ChatMessageBubble, type ChatMessageBubbleProps } from './ChatMessageBubble';

export function useChatMessageColors(own: boolean, dark = false) {
  const { token } = theme.useToken();
  const peerBackground = `color-mix(in srgb, ${token.colorText} ${dark ? 8 : 3}%, ${token.colorBgBase})`;
  return {
    peerBackground,
    bubbleBackground: own ? token.colorPrimary : peerBackground,
    bubbleColor: own ? token.colorTextLightSolid : token.colorText,
    replyStyle: {
      '--chat-reply-primary': token.colorPrimary,
      '--chat-reply-text': token.colorTextSecondary,
      '--chat-reply-background': token.colorFillQuaternary,
    } as CSSProperties,
    fileStyle: {
      '--tenant-chat-file-background': peerBackground,
      '--tenant-chat-file-text': token.colorText,
      '--tenant-chat-file-secondary-text': token.colorTextTertiary,
    } as CSSProperties,
  };
}

export type ChatMessageContentProps = ChatMessageBubbleProps & {
  own: boolean; dark?: boolean; hasBubble: boolean; media?: ReactNode;
};

/** Visual media and documents are outside the text/voice bubble in both clients. */
export function ChatMessageContent({ own, dark, hasBubble, media, style, ...props }: ChatMessageContentProps) {
  const colors = useChatMessageColors(own, dark);
  return <>
    {media}
    {hasBubble ? <ChatMessageBubble {...props} style={{ ...colors.replyStyle, background: colors.bubbleBackground, color: colors.bubbleColor, ...style }} /> : null}
  </>;
}

export function ChatMessagePayload({ children, own, mediaFooter, mediaStyle, status, expandLabel, collapseLabel }: {
  children: ReactNode; own: boolean; mediaFooter?: ReactNode; mediaStyle?: CSSProperties; status?: ReactNode;
  expandLabel: string; collapseLabel: string;
}) {
  return <div className="tenant-chat-message__payload">
    {mediaFooter ? <ChatMessageBubble className="tenant-chat-message__media-bubble" style={mediaStyle} footer={mediaFooter}
      expandLabel={expandLabel} collapseLabel={collapseLabel}>{children}</ChatMessageBubble> : children}
    {own && status ? <div className="tenant-chat-message__indicators">{status}</div> : null}
  </div>;
}

export function ChatMessageQuote({ title, preview, image, onLocate, disabled, label }: {
  title: string; preview: ReactNode; image?: ReactNode; onLocate?: () => void; disabled?: boolean; label: string;
}) {
  return <button type="button" className="tenant-chat-message__reply-reference" title={label} disabled={disabled}
    onClick={event => { event.stopPropagation(); onLocate?.(); }}>
    {image ? <span className="tenant-chat-message__reply-image">{image}</span> : null}
    <span className="tenant-chat-message__reply-copy"><strong>{title}</strong><span>{preview}</span></span>
  </button>;
}

'use client';

import React, { forwardRef, type ComponentProps, type ReactNode } from 'react';

export type ChatMessageLayoutProps = ComponentProps<'div'> & {
  own: boolean;
  avatar?: ReactNode;
  sender?: ReactNode;
  actions?: ReactNode;
  overlay?: ReactNode;
};

/** Business actions stay with the caller; message alignment and structure are shared. */
export const ChatMessageLayout = forwardRef<HTMLDivElement, ChatMessageLayoutProps>(function ChatMessageLayout(
  { own, avatar, sender, actions, overlay, children, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={['tenant-chat-message', own ? 'is-own' : 'is-peer', className].filter(Boolean).join(' ')}>
    {!own ? avatar : null}
    <div className="tenant-chat-message__content">
      {sender}
      {children}
      {actions ? <div className="tenant-chat-message__actions">{actions}</div> : null}
    </div>
    {own ? avatar : null}
    {overlay}
  </div>;
});

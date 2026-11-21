'use client';

import React, { type CSSProperties, type ReactNode } from 'react';

export function groupChatAttachments<T extends { kind: string }>(attachments: readonly T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const attachment of attachments) {
    const group = groups.get(attachment.kind);
    if (group) group.push(attachment);
    else groups.set(attachment.kind, [attachment]);
  }
  return [...groups.values()];
}

export function ChatAttachmentGroup({ kind, count, hasVideo, children, style }: {
  kind: string; count: number; hasVideo: boolean; children: ReactNode; style?: CSSProperties;
}) {
  return <div className={`tenant-chat-message__attachments${hasVideo ? ' is-video' : ''}`} style={style}
    data-kind={kind} data-count={count} data-has-video={hasVideo || undefined} data-odd={count % 2 === 1}>
    {children}
  </div>;
}

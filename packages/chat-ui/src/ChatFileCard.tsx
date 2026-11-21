'use client';

import React, { type ReactNode } from 'react';

export function ChatFileCard({ name, detail, icon, loading, disabled, selecting, loadingLabel, onOpen }: {
  name?: string; detail?: string; icon?: ReactNode; loading: boolean; disabled?: boolean; selecting?: boolean; loadingLabel: string; onOpen: () => void;
}) {
  return <button type="button" aria-busy={loading} className="tenant-chat-message__file" disabled={loading || disabled}
    onClick={event => { if (selecting) return; event.stopPropagation(); onOpen(); }}>
    {loading ? <span aria-label={loadingLabel} className="tenant-chat-message__file-loading" role="status">
      <span aria-hidden="true" className="tenant-chat-message__file-loading-icon" />
      <span aria-hidden="true" className="tenant-chat-message__file-loading-copy"><span /><span /></span>
    </span> : <>{icon}<span><strong>{name}</strong><small>{detail}</small></span></>}
  </button>;
}

'use client';

import React, { type ComponentProps, type ReactNode } from 'react';
import { LuX } from 'react-icons/lu';
import { SolnSpin } from './SolnSpin';

/** Shared visual shell. Transport, permissions and drafts belong to the caller. */
export function ChatComposerShell({ className, voiceLayout, compact, ...props }: ComponentProps<'div'> & { voiceLayout?: boolean; compact?: boolean }) {
  return <div {...props} data-chat-composer-layout={compact ? 'compact' : 'standard'} data-chat-composer-voice={voiceLayout || undefined}
    className={['soln-base-composer-shell', voiceLayout ? 'tenant-chat-composer__voice-shell' : '', className].filter(Boolean).join(' ')} />;
}

export function ChatComposerToolbar({ tools, children }: { tools?: ReactNode; children: ReactNode }) {
  return <div className="soln-base-composer-actions">
    {tools ? <div className="soln-base-composer-actions-left">{tools}</div> : null}
    {children}
  </div>;
}

export function ChatComposerReply({ title, preview, image, closing, disabled, cancelLabel, onCancel }: {
  title: string; preview: ReactNode; image?: ReactNode; closing?: boolean; disabled?: boolean;
  cancelLabel: string; onCancel: () => void;
}) {
  return <div className={`tenant-chat-composer__reply${closing ? ' is-closing' : ''}`}>
    <div className="tenant-chat-composer__reply-content">
      {image ? <span className="tenant-chat-composer__reply-image">{image}</span> : null}
      <div className="tenant-chat-composer__reply-copy">
        <strong className="tenant-chat-composer__reply-title">{title}</strong>
        <span className="tenant-chat-composer__reply-preview">{preview}</span>
      </div>
    </div>
    <button type="button" className="tenant-chat-composer__reply-cancel" aria-label={cancelLabel}
      title={cancelLabel} disabled={disabled || closing} onClick={onCancel}><LuX size={19} /></button>
  </div>;
}

export function ChatComposerAttachments({ children }: { children: ReactNode }) {
  return <div className="tenant-chat-composer__attachments cp-sidebar-scrollbar">{children}</div>;
}

export function ChatComposerAttachment({ kind, children, progress, removeLabel, disabled, onRemove }: {
  kind: string; children: ReactNode; progress?: number; removeLabel: string; disabled?: boolean; onRemove: () => void;
}) {
  return <div className="tenant-chat-composer__attachment" data-kind={kind}>
    {children}
    {progress !== undefined ? <span className="tenant-chat-composer__progress"><SolnSpin size={16} />{Math.round(progress)}%</span> : null}
    <button type="button" aria-label={removeLabel} title={removeLabel} disabled={disabled} onClick={onRemove}><LuX size={12} /></button>
  </div>;
}

'use client';

import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react';
import { Drawer, Dropdown } from 'antd';
import { LuCopy } from 'react-icons/lu';
import { TiArrowForwardOutline } from 'react-icons/ti';
import { ChatReactionMenu, SolnSpin } from '@soln/chat-ui';
import type { AnonymousChatMessage } from '@soln/chat-sdk';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import styles from './WebsiteChatWidget.module.css';
import { WebsiteChatScrollBoundary } from './WebsiteChatScrollBoundary';

const EmojiPicker = lazy(() => import('./WebsiteChatEmojiPicker').then(module => ({ default: module.WebsiteChatEmojiPicker })));

export function WebsiteChatMessageMenu({ message, active, unavailable, locale, copy, ownEmoji, onReply, onReact, children, own,
  mobile = false, mobileOpen = false, onMobileOpenChange }: {
  message: AnonymousChatMessage; active: boolean; unavailable: boolean; locale: string; copy: WebsiteChatCopy;
  ownEmoji?: string; own: boolean; onReply: () => void; onReact: (emoji: string) => void; children: ReactElement;
  mobile?: boolean; mobileOpen?: boolean; onMobileOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [reactionDrawer, setReactionDrawer] = useState(false);
  useEffect(() => { if (!active) { setOpen(false); setReactionDrawer(false); } }, [active]);
  const close = () => { setOpen(false); onMobileOpenChange?.(false); };
  const react = (emoji: string) => { onReact(emoji === ownEmoji ? '' : emoji); close(); setReactionDrawer(false); };
  return <><Dropdown trigger={mobile ? [] : ['contextMenu']} open={active && (mobile ? mobileOpen : open)} destroyOnHidden placement={own ? 'bottomRight' : 'bottomLeft'}
    classNames={mobile ? { root: 'tenant-chat-mobile-message-menu cp-sidebar-scrollbar' } : undefined}
    onOpenChange={(next, info) => {
      if (info.source === 'menu') return;
      if (mobile) onMobileOpenChange?.(next); else setOpen(next);
      setCopyFailed(false);
    }}
    styles={{ root: { zIndex: 1100, ...(mobile ? { width: 296, minWidth: 0, maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)', overflowY: 'auto', overscrollBehavior: 'contain' } : {}) } }}
    menu={{ items: [
      { key: 'reply', icon: <TiArrowForwardOutline size={16} style={{ transform: 'scaleX(-1)' }} />, label: copy.reply, disabled: unavailable },
      { key: 'copy', icon: <LuCopy size={16} />, label: copy.copy, disabled: !message.body },
    ], onClick: ({ key }) => {
      if (key === 'reply') { onReply(); close(); return; }
      if (key === 'copy') {
        void (async () => {
          try { await navigator.clipboard.writeText(message.body); close(); }
          catch { setCopyFailed(true); }
        })();
      }
    } }}
    popupRender={menu => <WebsiteChatScrollBoundary className={styles.widget}>
      <ChatReactionMenu key={String(open)} selected={ownEmoji ?? null} disabled={unavailable} onReact={react} onClose={close}
        mobile={mobile} onExpandMobile={() => { close(); setReactionDrawer(true); }}
        pickerLabel={copy.react} moreLabel={copy.moreReactions}
        reactionLabel={(emoji, selected) => (selected ? copy.removeReaction : copy.reactWith).replace('{emoji}', emoji)}
        renderPicker={() => <Suspense fallback={<SolnSpin size={20} />}><EmojiPicker locale={locale} copy={copy}
          selected={ownEmoji} reaction disabled={unavailable} onSelect={react} /></Suspense>}>
        {menu}
        {copyFailed ? <p role="alert" className={styles.notice}>{copy.copyFailed}</p> : null}
      </ChatReactionMenu>
    </WebsiteChatScrollBoundary>}>
    {children}
  </Dropdown>
    {mobile ? <Drawer open={active && reactionDrawer} placement="bottom" size="min(440px, 70dvh)" title={copy.moreReactions}
      onClose={() => setReactionDrawer(false)} destroyOnHidden zIndex={1200}
      classNames={{ root: 'tenant-chat-mobile-message-menu' }} styles={{ body: { padding: 0, overflow: 'hidden' } }}>
      <WebsiteChatScrollBoundary className={`${styles.widget} ${styles.mobileReactionPicker}`}>
        <Suspense fallback={<SolnSpin size={20} />}><EmojiPicker mobile locale={locale} copy={copy}
          selected={ownEmoji} reaction disabled={unavailable} onSelect={react} /></Suspense>
      </WebsiteChatScrollBoundary>
    </Drawer> : null}
  </>;
}

'use client';

import { useEffect, useRef, useState, type PointerEvent, type MouseEvent } from 'react';

export function useChatMessageLongPress(enabled: boolean, conversationId?: string) {
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const suppressClickUntil = useRef(0);
  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    cancel();
    setOpenMessageId(null);
    suppressClickUntil.current = 0;
    return cancel;
  }, [enabled, conversationId]);

  useEffect(() => {
    if (!enabled || !openMessageId) return;
    const insideMenu = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest('.tenant-chat-mobile-message-menu'));
    const closeOutside = (event: globalThis.PointerEvent) => {
      if (!insideMenu(event.target)) setOpenMessageId(null);
    };
    const closeOnScroll = (event: Event) => {
      if (!insideMenu(event.target)) setOpenMessageId(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMessageId(null);
    };
    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('scroll', closeOnScroll, true);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true);
      document.removeEventListener('scroll', closeOnScroll, true);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [enabled, openMessageId]);

  return {
    openMessageId,
    setOpenMessageId,
    cancel,
    bind(messageId: string) {
      return {
        onPointerDownCapture(event: PointerEvent<HTMLElement>) {
          if (!event.currentTarget.contains(event.target as Node)) return;
          if (!enabled || event.pointerType === 'mouse') return;
          cancel();
          if (!event.isPrimary) return;
          suppressClickUntil.current = 0;
          origin.current = { x: event.clientX, y: event.clientY };
          timer.current = setTimeout(() => {
            timer.current = null;
            suppressClickUntil.current = Date.now() + 1500;
            setOpenMessageId(messageId);
          }, 450);
        },
        onPointerMoveCapture(event: PointerEvent<HTMLElement>) {
          if (!event.currentTarget.contains(event.target as Node)) return;
          if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 10) cancel();
        },
        onPointerUpCapture: cancel,
        onPointerCancelCapture: cancel,
        onClickCapture(event: MouseEvent<HTMLElement>) {
          if (!event.currentTarget.contains(event.target as Node)) return;
          if (!enabled || Date.now() > suppressClickUntil.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClickUntil.current = 0;
        },
      };
    },
  };
}

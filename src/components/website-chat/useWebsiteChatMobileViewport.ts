'use client';

import { useEffect, type RefObject } from 'react';

export function useWebsiteChatMobileViewport(enabled: boolean, layer: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const node = layer.current;
    if (!enabled || !node) return;
    const html = document.documentElement, body = document.body;
    const previous = { html: html.style.overflow, body: body.style.overflow };
    html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
    const viewport = window.visualViewport;
    const update = () => {
      node.style.setProperty('--website-chat-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      node.style.setProperty('--website-chat-viewport-top', `${viewport?.offsetTop ?? 0}px`);
      const keyboard = Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0));
      node.style.setProperty('--cp-mobile-keyboard-inset', `${keyboard}px`);
    };
    update();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !node.contains(event.target as Node)) return;
      const controls = Array.from(node.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([hidden]), textarea:not(:disabled), a[href], [tabindex="0"]'))
        .filter(element => element.getClientRects().length > 0);
      const next = event.shiftKey ? controls.at(-1) : controls[0];
      if (next && document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1))) {
        event.preventDefault(); next.focus({ preventScroll: true });
      }
    };
    node.addEventListener('keydown', trapFocus);
    window.addEventListener('resize', update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    node.querySelector<HTMLButtonElement>('[data-chat-close]')?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = previous.html; body.style.overflow = previous.body;
      node.removeEventListener('keydown', trapFocus);
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
    };
  }, [enabled, layer]);
}

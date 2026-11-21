'use client';

import { useEffect, useRef, type ComponentProps } from 'react';

function canScrollWithin(root: HTMLElement, target: EventTarget | null, dx: number, dy: number) {
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const delta = horizontal ? dx : dy;
  let node = target instanceof Element ? target : null;
  while (node && root.contains(node)) {
    if (node instanceof HTMLElement) {
      const style = getComputedStyle(node);
      const overflow = horizontal ? style.overflowX : style.overflowY;
      const size = horizontal ? node.scrollWidth - node.clientWidth : node.scrollHeight - node.clientHeight;
      const position = horizontal ? node.scrollLeft : node.scrollTop;
      if (/(auto|scroll|overlay)/.test(overflow) && size > 0
        && (delta < 0 ? position > 0 : position < size - 1)) return true;
    }
    if (node === root) break;
    node = node.parentElement;
  }
  return false;
}

// Native listeners run before the site's window-level Lenis listener.
// Keep scrolling inside portaled popups, and block native chaining at their edges.
export function WebsiteChatScrollBoundary({ children, ...props }: ComponentProps<'div'>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let touch: { x: number; y: number } | undefined;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.stopPropagation();
      if (!event.defaultPrevented && !canScrollWithin(root, event.target, event.deltaX, event.deltaY)) event.preventDefault();
    };
    const start = (event: TouchEvent) => {
      const point = event.touches.length === 1 ? event.touches[0] : undefined;
      touch = point ? { x: point.clientX, y: point.clientY } : undefined;
    };
    const move = (event: TouchEvent) => {
      if (!touch || event.touches.length !== 1) return;
      const point = event.touches[0];
      const dx = touch.x - point.clientX, dy = touch.y - point.clientY;
      touch = { x: point.clientX, y: point.clientY };
      event.stopPropagation();
      if (!event.defaultPrevented && !canScrollWithin(root, event.target, dx, dy)) event.preventDefault();
    };
    const end = () => { touch = undefined; };
    root.addEventListener('wheel', wheel, { passive: false });
    root.addEventListener('touchstart', start, { passive: true });
    root.addEventListener('touchmove', move, { passive: false });
    root.addEventListener('touchend', end, { passive: true });
    root.addEventListener('touchcancel', end, { passive: true });
    return () => {
      root.removeEventListener('wheel', wheel);
      root.removeEventListener('touchstart', start);
      root.removeEventListener('touchmove', move);
      root.removeEventListener('touchend', end);
      root.removeEventListener('touchcancel', end);
    };
  }, []);
  return <div {...props} ref={ref} data-lenis-prevent data-website-chat-scroll>{children}</div>;
}

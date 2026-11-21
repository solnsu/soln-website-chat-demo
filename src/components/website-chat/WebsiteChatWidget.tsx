'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ConfigProvider, Popover } from 'antd';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import type { WebsiteChatConfig } from '@/lib/website-chat-config';
import { websiteChatTheme } from './website-chat-theme';
import { WebsiteChatScrollBoundary } from './WebsiteChatScrollBoundary';
import styles from './WebsiteChatWidget.module.css';

const WebsiteChatPanel = lazy(() => import('./WebsiteChatPanel'));

export default function WebsiteChatWidget({ config, copy, locale }: {
  config: WebsiteChatConfig | null; copy: WebsiteChatCopy; locale: string;
}) {
  const [open, setOpen] = useState(false), [started, setStarted] = useState(false);
  const [timeGreeting, setTimeGreeting] = useState<keyof WebsiteChatCopy['timeGreetings'] | null>(null);
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const hour = new Date().getHours();
      setTimeGreeting(hour >= 5 && hour < 11 ? 'morning' : hour >= 11 && hour < 14 ? 'noon'
        : hour >= 14 && hour < 18 ? 'afternoon' : 'evening');
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [open]);
  const title = timeGreeting ? copy.timeGreetings[timeGreeting] : copy.title;
  const launcher = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); launcher.current?.focus({ preventScroll: true }); };
  const content = <section id="website-support-chat" role="dialog" aria-modal="false" aria-label={title}
      data-lenis-prevent data-website-chat className={`${styles.widget} ${styles.panel}`} onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); close(); }
      }}>
      <header className={styles.header}>
        <strong>{title}</strong>
      </header>
      {started && (config ? <Suspense fallback={null}>
        <WebsiteChatPanel key={`${config.runtimeOrigin}:${config.entryId}`} config={config} active={open} copy={copy} locale={locale} />
      </Suspense> : <p role="status" className={styles.empty}>{copy.unavailable}</p>)}
    </section>;
  return <ConfigProvider theme={websiteChatTheme}><Popover content={<WebsiteChatScrollBoundary>{content}</WebsiteChatScrollBoundary>} trigger="click" placement="topRight" arrow={false} open={open} fresh destroyOnHidden={false}
    zIndex={101} color="#171717"
    styles={{ container: { padding: 0, borderRadius: 20, background: '#171717', color: '#f5f5f5', overflow: 'hidden' } }}
    onOpenChange={nextOpen => { if (nextOpen) setStarted(true); setOpen(nextOpen); }}>
    <button type="button" ref={launcher} className={`${styles.widget} ${styles.launcher}`} aria-label={open ? copy.close : copy.open}
      data-website-chat title={open ? copy.close : copy.open} aria-expanded={open}
      aria-controls={started ? 'website-support-chat' : undefined}>
      {open ? <X size={25} /> : <MessageCircle size={25} />}
    </button>
  </Popover></ConfigProvider>;
}

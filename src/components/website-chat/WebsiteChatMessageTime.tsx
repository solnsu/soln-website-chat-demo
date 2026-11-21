'use client';

import { useEffect, useState } from 'react';
import { LuCheck, LuCopy } from 'react-icons/lu';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import styles from './WebsiteChatWidget.module.css';

export function WebsiteChatMessageTime({ body, createdAt, label, copy }: {
  body: string; createdAt: string; label: string; copy: WebsiteChatCopy;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return <>
    <time className={styles.time} dateTime={createdAt}>{label}</time>
    {body ? <button type="button" className={styles.copyMessage} title={copied ? copy.copied : copy.copy}
      aria-label={copied ? copy.copied : copy.copy} onClick={async event => {
        event.stopPropagation();
        try { await navigator.clipboard.writeText(body); setCopied(true); setFailed(false); }
        catch { setFailed(true); }
      }}>{copied ? <LuCheck size={15} /> : <LuCopy size={15} />}</button> : null}
    {failed ? <span role="alert">{copy.copyFailed}</span> : null}
  </>;
}

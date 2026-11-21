'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnonymousChatError, createAnonymousChatClient, type AnonymousChatClient,
  type AnonymousChatMessage, type AnonymousChatSession, type ChatAnonymousSendInput } from '@soln/chat-sdk';
import type { WebsiteChatConfig } from '@/lib/website-chat-config';
import { mergeChatHistory } from './chat-history';

const expiredCodes = new Set(['CHAT_ANONYMOUS_SESSION_INVALID', 'CHAT_ANONYMOUS_SESSION_EXPIRED', 'CHAT_ANONYMOUS_SESSION_FORBIDDEN']);
export function useWebsiteChat(config: WebsiteChatConfig, active: boolean) {
  const [session, setSession] = useState<AnonymousChatSession | null>(null);
  const [messages, setMessages] = useState<AnonymousChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<'expired' | 'loadFailed' | 'sendFailed' | null>(null);
  const [draft, setDraft] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);
  const [before, setBefore] = useState<string | null>(null);
  const client = useRef<AnonymousChatClient | null>(null);
  const ready = useRef(false), mounted = useRef(true), expired = useRef(false);
  const refreshing = useRef<Promise<void> | null>(null);
  const sendingRef = useRef(false), olderRef = useRef(false), historyLoaded = useRef(false);
  const pendingSend = useRef<{ key: string; input: ChatAnonymousSendInput } | null>(null);
  const readSequence = useRef('0');
  const storageKey = `soln:website-chat:${config.runtimeOrigin}:${config.entryId}`;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const recordError = useCallback((cause: unknown, fallback: 'loadFailed' | 'sendFailed') => {
    if (!mounted.current) return;
    if (cause instanceof AnonymousChatError && expiredCodes.has(cause.code)) {
      expired.current = true; setError('expired');
    } else setError(fallback);
  }, []);

  const getClient = useCallback(() => {
    if (!client.current) {
      let token: string | undefined;
      try { token = localStorage.getItem(storageKey) || undefined; } catch { /* In-memory sessions work when browser storage is unavailable. */ }
      client.current = createAnonymousChatClient({ ...config, sessionToken: token });
    }
    return client.current;
  }, [config, storageKey]);

  const refresh = useCallback(() => {
    if (refreshing.current) return refreshing.current;
    if (expired.current) return Promise.resolve();
    const operation = (async () => {
      try {
        const chat = getClient();
        const state = ready.current ? await chat.getSession() : await chat.createSession();
        if ('sessionToken' in state && typeof state.sessionToken === 'string') {
          try { localStorage.setItem(storageKey, state.sessionToken); } catch { /* Keep the SDK's in-memory credential. */ }
        }
        ready.current = true;
        const page = await chat.listMessages({ limit: 50 });
        if (!mounted.current) return;
        setSession(state); setMessages(current => mergeChatHistory(current, page));
        if (!historyLoaded.current) setBefore(page.hasMore ? page.nextBeforeSequence : null);
        setError(current => current === 'sendFailed' ? current : null);
      } catch (cause) { recordError(cause, 'loadFailed'); }
      finally { if (mounted.current) setLoading(false); }
    })();
    refreshing.current = operation;
    void operation.finally(() => { if (refreshing.current === operation) refreshing.current = null; });
    return operation;
  }, [getClient, recordError, storageKey]);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const visible = () => document.visibilityState !== 'hidden';
    const tick = async () => {
      if (stopped || running || !visible()) return;
      running = true;
      await refresh();
      running = false;
      if (!stopped && !expired.current && visible()) timer = setTimeout(tick, 4000);
    };
    const onVisibility = () => { clearTimeout(timer); if (document.visibilityState === 'visible') void tick(); };
    void tick(); document.addEventListener('visibilitychange', onVisibility);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [active, refresh, retryVersion]);

  useEffect(() => {
    if (!active || !session || document.visibilityState === 'hidden') return;
    const sequence = messages.at(-1)?.sequence;
    if (!sequence || BigInt(sequence) <= BigInt(readSequence.current)) return;
    const frame = requestAnimationFrame(() => {
      if (document.visibilityState === 'hidden') return;
      void getClient().markRead({ lastReadSequence: sequence }).then(() => { readSequence.current = sequence; }).catch(() => {});
    });
    return () => cancelAnimationFrame(frame);
  }, [active, getClient, messages, session]);

  const send = async (extra: Omit<ChatAnonymousSendInput, 'body' | 'clientMessageId'> = {}) => {
    const body = draft.trim();
    if (sendingRef.current || !session?.canSendMessages || (!body && !extra.mediaIds?.length && !extra.stickerId && !extra.location) || expired.current) return false;
    sendingRef.current = true; setSending(true); setError(null);
    const content = { ...extra, body: extra.stickerId ? '' : body };
    const key = JSON.stringify(content);
    if (pendingSend.current?.key !== key) pendingSend.current = { key, input: { ...content, clientMessageId: crypto.randomUUID() } };
    let sent = false;
    try {
      await getClient().sendMessage(pendingSend.current.input);
      pendingSend.current = null; sent = true;
      if (mounted.current && !extra.stickerId) setDraft(current => current.trim() === body ? '' : current);
      if (refreshing.current) await refreshing.current;
      await refresh();
    } catch (cause) { recordError(cause, 'sendFailed'); await refresh(); }
    finally { sendingRef.current = false; if (mounted.current) setSending(false); }
    return sent;
  };
  const loadOlder = async () => {
    if (!before || olderRef.current) return;
    olderRef.current = true; setLoadingOlder(true);
    try {
      const page = await getClient().listMessages({ beforeSequence: before, limit: 50 });
      if (!mounted.current) return;
      historyLoaded.current = true;
      setMessages(current => mergeChatHistory(current, page, true));
      setBefore(page.hasMore ? page.nextBeforeSequence : null);
    } catch (cause) { recordError(cause, 'loadFailed'); }
    finally { olderRef.current = false; if (mounted.current) setLoadingOlder(false); }
  };
  const startNew = async () => {
    if (!expired.current) return;
    try { localStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
    client.current = null; ready.current = false; expired.current = false; historyLoaded.current = false;
    readSequence.current = '0'; pendingSend.current = null;
    setSession(null); setMessages([]); setBefore(null); setLoading(true); setError(null);
    setRetryVersion(value => value + 1);
  };
  const uploadMedia = useCallback((value: Parameters<AnonymousChatClient['uploadMedia']>[0]) => getClient().uploadMedia(value), [getClient]);
  const readMedia = useCallback((value: { assetId: string }) => getClient().readMedia(value), [getClient]);
  const react = async (messageId: string, emoji: string) => {
    try { await getClient().reactToMessage({ messageId, emoji, requestId: crypto.randomUUID() }); await refresh(); }
    catch (cause) { recordError(cause, 'sendFailed'); }
  };
  return { uploadMedia, readMedia, react, session, messages, loading, sending, loadingOlder, error, draft, before, setDraft, send, loadOlder,
    retry: () => { setError(null); setRetryVersion(value => value + 1); }, startNew };
}

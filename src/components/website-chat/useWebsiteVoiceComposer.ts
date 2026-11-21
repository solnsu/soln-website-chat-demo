'use client';
import { useEffect, useRef, useState } from 'react';
import { useChatVoiceRecorder, type ChatVoiceError } from '@soln/chat-ui/voice';
import type { ChatAnonymousMedia } from '@soln/chat-sdk';
import type { useWebsiteChat } from './useWebsiteChat';
import { fileBase64, fileMimeType } from './media-files';

type VoiceDraft = { file: File; previewUrl: string; scopeKey: string };
type VoiceSession = { draft: VoiceDraft; media: ChatAnonymousMedia | null };
export function useWebsiteVoiceComposer(input: {
  scopeKey: string; enabled: boolean; writable: boolean;
  uploadMedia: ReturnType<typeof useWebsiteChat>['uploadMedia'];
  onSendMedia: (assetId: string) => Promise<boolean>; onError: (key: ChatVoiceError | 'sendFailed') => void;
}) {
  const latest = useRef(input); latest.current = input;
  const current = useRef<VoiceSession | null>(null), mounted = useRef(false), inFlight = useRef(false);
  const [draft, setDraft] = useState<VoiceDraft | null>(null), [sending, setSending] = useState(false);
  const release = () => {
    const session = current.current; current.current = null;
    if (session) URL.revokeObjectURL(session.draft.previewUrl);
    inFlight.current = false;
  };
  useEffect(() => {
    mounted.current = true; setDraft(null); setSending(false);
    return () => { mounted.current = false; release(); };
  }, [input.scopeKey]);
  const remove = () => { if (!inFlight.current) { release(); setDraft(null); } };
  const send = async () => {
    const session = current.current;
    if (!session || inFlight.current || !latest.current.writable || session.draft.scopeKey !== latest.current.scopeKey) return;
    inFlight.current = true; setSending(true);
    try {
      if (!session.media) {
        const file = session.draft.file;
        session.media = await latest.current.uploadMedia({ name: file.name, kind: 'voice', mimeType: fileMimeType(file), contentBase64: await fileBase64(file) });
      }
      if (current.current !== session || session.draft.scopeKey !== latest.current.scopeKey || !latest.current.writable) return;
      const sent = await latest.current.onSendMedia(session.media.assetId);
      if (sent && current.current === session) { release(); setDraft(null); }
    } catch { if (current.current === session) latest.current.onError('sendFailed'); }
    finally {
      if (mounted.current && session.draft.scopeKey === latest.current.scopeKey) { inFlight.current = false; setSending(false); }
    }
  };
  const recorder = useChatVoiceRecorder({
    scopeKey: input.scopeKey, enabled: input.enabled && !draft && !sending,
    onError: key => latest.current.onError(key),
    onRecorded: (file, immediately) => {
      release();
      const next = { file, previewUrl: URL.createObjectURL(file), scopeKey: latest.current.scopeKey };
      current.current = { draft: next, media: null }; setDraft(next);
      if (immediately) void send();
    },
  });
  return { ...recorder, draft: draft?.scopeKey === input.scopeKey ? draft : null, sending, send, remove };
}

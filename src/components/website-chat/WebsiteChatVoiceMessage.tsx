'use client';

import { ChatVoiceMessage, useChatVoiceWaveform } from '@soln/chat-ui/voice';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';

export function WebsiteChatVoiceMessage({ src, copy, disabled = false }: { src: string | null; copy: WebsiteChatCopy; disabled?: boolean }) {
  const waveform = useChatVoiceWaveform(src);
  return <ChatVoiceMessage src={src} disabled={disabled} waveform={waveform} labels={copy.voicePlayback}
    onOpen={() => { if (src) window.open(src, '_blank', 'noopener,noreferrer'); }} />;
}

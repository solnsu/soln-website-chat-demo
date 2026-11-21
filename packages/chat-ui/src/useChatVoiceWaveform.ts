'use client';

import { useEffect, useState } from 'react';
export type ChatVoiceReader = (src: string, signal: AbortSignal) => Promise<Response>;
const readPublicAudio: ChatVoiceReader = (src, signal) => fetch(src, { signal });

export const VOICE_WAVEFORM_BARS = 42;

export function buildVoiceWaveform(channels: readonly Float32Array[], count = VOICE_WAVEFORM_BARS) {
  const length = channels[0]?.length ?? 0;
  const peaks = Array.from({ length: count }, (_, index) => {
    const start = Math.floor(index * length / count);
    const end = Math.min(length, Math.max(start + 1, Math.floor((index + 1) * length / count)));
    let peak = 0;
    for (const channel of channels) {
      for (let sample = start; sample < end; sample++) peak = Math.max(peak, Math.abs(channel[sample] ?? 0));
    }
    return peak;
  });
  const maximum = Math.max(...peaks);
  return peaks.map(peak => maximum ? (peak / maximum) ** 0.8 : 0);
}

export function useChatVoiceWaveform(src: string | null, readAudio: ChatVoiceReader = readPublicAudio) {
  const [waveform, setWaveform] = useState<{ src: string; bars: number[]; duration?: number }>();
  useEffect(() => {
    const source = src;
    if (!source) return;
    const controller = new AbortController();
    async function load(source: string) {
      try {
        const response = await readAudio(source, controller.signal);
        if (!response.ok) throw new Error('VOICE_WAVEFORM_UNAVAILABLE');
        const bytes = await response.arrayBuffer();
        if (controller.signal.aborted) return;
        const decoded = await new OfflineAudioContext(1, 1, 8000).decodeAudioData(bytes);
        if (controller.signal.aborted) return;
        const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) => decoded.getChannelData(index));
        setWaveform({ src: source, bars: buildVoiceWaveform(channels), duration: decoded.duration });
      } catch {
        // Playback has its own error state; an unavailable waveform stays flat.
        if (!controller.signal.aborted) setWaveform({ src: source, bars: Array<number>(VOICE_WAVEFORM_BARS).fill(0) });
      }
    }
    void load(source);
    return () => controller.abort();
  }, [src, readAudio]);
  return {
    bars: waveform?.src === src ? waveform.bars : Array<number>(VOICE_WAVEFORM_BARS).fill(0),
    loading: !src || waveform?.src !== src,
    duration: waveform?.src === src ? waveform.duration : undefined,
  };
}

'use client';

import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LuCircleAlert, LuPause } from 'react-icons/lu';
import { CiPlay1 } from 'react-icons/ci';
import { ChatVoiceWaveform } from './ChatVoiceWaveform';

function formatTime(value: number) {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export type ChatVoiceMessageLabels = Record<'label' | 'loading' | 'failed' | 'play' | 'pause' | 'seek', string>;
export function ChatVoiceMessage({ src, disabled, onOpen, waveform, initialDuration = 0, labels }: {
  src: string | null; disabled: boolean; onOpen: () => void; initialDuration?: number;
  waveform: { bars: readonly number[]; loading: boolean; duration?: number }; labels: ChatVoiceMessageLabels;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const { bars, loading: waveformLoading, duration: decodedDuration } = waveform;
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState(() => initialDuration);
  const [position, setPosition] = useState(0);
  const copy = (key: keyof ChatVoiceMessageLabels) => labels[key];
  useEffect(() => {
    setPlaying(false); setWaiting(false); setFailed(false);
    setDuration(initialDuration); setPosition(0);
  }, [initialDuration, src]);
  useEffect(() => { if (disabled) audio.current?.pause(); }, [disabled]);
  useEffect(() => {
    if (decodedDuration && Number.isFinite(decodedDuration)) setDuration(decodedDuration);
  }, [decodedDuration]);
  useEffect(() => {
    if (!playing || waiting || disabled) return;
    let frame: number;
    const update = () => {
      if (!audio.current || audio.current.paused) return;
      setPosition(audio.current.currentTime);
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, waiting, disabled, src]);
  async function toggle() {
    if (!audio.current || disabled) return;
    if (failed) { onOpen(); return; }
    if (!audio.current.paused) { audio.current.pause(); return; }
    setWaiting(true);
    try { await audio.current.play(); } catch { setFailed(true); setWaiting(false); }
  }
  const progress = duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0;
  const loading = !failed && waveformLoading;
  const widthRatio = duration > 0 ? Math.min(duration / 9, 1) : 1;
  if (!src) return <div className="tenant-chat-voice tenant-chat-voice--pending" role="status"
    aria-label={copy('loading')} aria-busy="true"
    style={{ '--tenant-chat-voice-width-ratio': 1 } as CSSProperties}>
    <span className="tenant-chat-voice__skeleton" aria-hidden="true" />
  </div>;
  return <div className="tenant-chat-voice" role="group" aria-label={copy('label')} aria-busy={!src || loading || waiting}
    style={{ '--tenant-chat-voice-width-ratio': widthRatio } as CSSProperties}
    onClick={event => { if (!disabled) event.stopPropagation(); }}>
    <audio ref={audio} src={src || undefined} preload="metadata"
      onLoadedMetadata={event => {
        const value = event.currentTarget.duration;
        setDuration(Number.isFinite(value) ? value : decodedDuration || 0); setFailed(false);
      }}
      onDurationChange={event => {
        const value = event.currentTarget.duration;
        if (Number.isFinite(value)) setDuration(value);
      }}
      onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
      onWaiting={() => setWaiting(true)} onPlaying={() => { setPlaying(true); setWaiting(false); }}
      onPause={() => { setPlaying(false); setWaiting(false); }}
      onEnded={() => { setPlaying(false); setWaiting(false); setPosition(0); }}
      onError={() => { setFailed(true); setPlaying(false); setWaiting(false); }} />
    <button className="tenant-chat-voice__play" type="button" disabled={disabled || !src}
      aria-label={copy(failed ? 'failed' : playing ? 'pause' : 'play')}
      title={failed ? copy('failed') : undefined} data-failed={failed || undefined} onClick={() => { void toggle(); }}>
      {failed ? <LuCircleAlert size={18} /> : playing ? <LuPause size={18} /> : <CiPlay1 size={18} />}
    </button>
    <div className="tenant-chat-voice__waveform" aria-busy={loading || waiting}>
      {loading ? <span className="tenant-chat-voice__skeleton" aria-label={copy('loading')} role="status" /> : null}
      <ChatVoiceWaveform bars={bars} progress={progress} hidden={loading} />
      <input type="range" min={0} max={duration || 1} step="any" value={Math.min(position, duration || 0)}
        aria-label={copy('seek')} aria-valuetext={`${formatTime(position)} / ${formatTime(duration)}`}
        disabled={disabled || !src || !duration || failed} onChange={event => {
          const next = Number(event.currentTarget.value);
          if (audio.current) audio.current.currentTime = next;
          setPosition(next);
        }} />
    </div>
    <span className="tenant-chat-voice__time">{formatTime(position > 0 ? Math.max(0, duration - position) : duration)}</span>
  </div>;
}

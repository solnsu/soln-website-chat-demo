import { useEffect, useRef, useState } from 'react';

export function useChatVoicePreview(src: string | null, disabled: boolean, recordedSeconds: number, onError: () => void) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const totalSeconds = duration || recordedSeconds;
  useEffect(() => {
    setPlaying(false); setPosition(0); setDuration(0);
  }, [src]);
  useEffect(() => { if (disabled) audio.current?.pause(); }, [disabled]);
  useEffect(() => {
    if (!playing || disabled || !src) return;
    let frame = 0;
    const update = () => {
      const element = audio.current;
      if (!element || element.paused || element.ended) return;
      setPosition(element.currentTime);
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, disabled, src]);
  const toggle = async () => {
    if (!audio.current || disabled || !src) return;
    if (!audio.current.paused) { audio.current.pause(); return; }
    try { await audio.current.play(); }
    catch { onError(); }
  };
  const seek = (value: number) => {
    if (!audio.current || disabled || !src || !totalSeconds || !Number.isFinite(value)) return;
    const next = Math.max(0, Math.min(value, totalSeconds));
    audio.current.currentTime = next;
    setPosition(next);
  };
  return {
    audio, playing, toggle, seek, position, duration: totalSeconds,
    seconds: Math.max(0, totalSeconds - position),
    onDuration: (value: number) => { if (Number.isFinite(value) && value > 0) setDuration(value); },
    onPosition: setPosition,
    onPlaying: () => setPlaying(true),
    onPause: () => { setPlaying(false); if (audio.current) setPosition(audio.current.currentTime); },
    onEnded: () => { setPlaying(false); setPosition(0); },
  };
}

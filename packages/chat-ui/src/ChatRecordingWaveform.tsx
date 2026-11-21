import React, { useEffect, useRef, type RefObject } from 'react';
import { buildRecordingOverview, RECORDING_SAMPLE_INTERVAL } from './chatRecordingEnvelope';

const BAR_SPACING = 6;
export function ChatRecordingWaveform({ level, recording, waveform }: {
  level: RefObject<number>; recording: boolean; waveform: RefObject<number[]>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const recordingRef = useRef(recording);
  recordingRef.current = recording;
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext('2d');
    if (!context) return;
    let width = 0, height = 0, color = '', frame = 0;
    let previousTime = performance.now(), sampledAt = previousTime, envelope = 0, offset = 0;
    let history: number[] = [];
    const resize = () => {
      const rect = element.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = window.devicePixelRatio || 1;
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      color = getComputedStyle(element).color;
      const count = Math.ceil(width / BAR_SPACING) + 2;
      history = [...Array<number>(Math.max(0, count - history.length)).fill(0), ...history].slice(-count);
      repaint();
    };
    const draw = (now: number) => {
      frame = 0;
      const delta = Math.min(100, Math.max(0, now - previousTime));
      previousTime = now;
      if (recordingRef.current) {
        const target = level.current;
        const response = target > envelope ? 35 : 110;
        envelope += (target - envelope) * (1 - Math.exp(-delta / response));
        const count = Math.min(history.length, Math.floor((now - sampledAt) / RECORDING_SAMPLE_INTERVAL));
        if (count > 0) {
          history.splice(0, count);
          history.push(...Array<number>(count).fill(envelope));
          sampledAt = now - ((now - sampledAt) % RECORDING_SAMPLE_INTERVAL);
        }
        offset = ((now - sampledAt) / RECORDING_SAMPLE_INTERVAL) * BAR_SPACING;
      } else {
        sampledAt = now;
      }
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      const bars = recordingRef.current ? history : buildRecordingOverview(waveform.current, Math.max(1, Math.floor(width / BAR_SPACING)));
      for (let index = 0; index < bars.length; index++) {
        const amplitude = bars[index];
        const barHeight = 2 + amplitude * Math.max(0, height - 8);
        const x = recordingRef.current ? width - (bars.length - 1 - index) * BAR_SPACING - offset : index * BAR_SPACING + 1;
        context.globalAlpha = 0.3 + amplitude * 0.6;
        context.beginPath();
        context.roundRect(x, (height - barHeight) / 2, 2.5, barHeight, 1.25);
        context.fill();
      }
      if (recordingRef.current) frame = window.requestAnimationFrame(draw);
    };
    const repaint = () => {
      if (frame) window.cancelAnimationFrame(frame);
      draw(performance.now());
    };
    refresh.current = repaint;
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      refresh.current = () => {};
    };
  }, [level, waveform]);
  useEffect(() => { refresh.current(); }, [recording]);
  return <canvas ref={canvas} className="tenant-chat-recording-canvas" aria-hidden="true" />;
}

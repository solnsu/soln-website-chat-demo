import { useEffect, useRef, useState } from 'react';
import { RECORDING_SAMPLE_INTERVAL } from './chatRecordingEnvelope';

const MAX_VOICE_BYTES = 16 * 1024 * 1024;
const FORMATS = [
  { mimeType: 'audio/webm;codecs=opus', extension: 'weba' },
  { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
  { mimeType: 'audio/mp4', extension: 'm4a' },
] as const;
type Phase = 'idle' | 'requesting' | 'recording' | 'finishing';
type Session = {
  stream?: MediaStream; context?: AudioContext; source?: MediaStreamAudioSourceNode; startedAt?: number;
  recorder?: MediaRecorder; frame?: number; chunks: Blob[]; size: number; saveRequested: boolean; sendImmediately: boolean;
};

function release(session: Session | null) {
  if (!session) return;
  if (session.frame !== undefined) window.cancelAnimationFrame(session.frame);
  if (session.recorder) {
    session.recorder.ondataavailable = null;
    session.recorder.onstop = null;
    session.recorder.onerror = null;
    if (session.recorder.state !== 'inactive') session.recorder.stop();
  }
  session.stream?.getTracks().forEach(track => track.stop());
  session.source?.disconnect();
  if (session.context && session.context.state !== 'closed') void session.context.close().catch(() => {});
}

export type ChatVoiceError = 'unsupported' | 'permissionDenied' | 'noMicrophone' | 'microphoneBusy' | 'failed' | 'tooLarge';
export function useChatVoiceRecorder(input: { scopeKey: string; enabled: boolean; onRecorded: (file: File, sendImmediately: boolean) => void; onError: (key: ChatVoiceError) => void }) {
  const onError = useRef(input.onError);
  onError.current = input.onError;
  const current = useRef<Session | null>(null);
  const onRecorded = useRef(input.onRecorded);
  onRecorded.current = input.onRecorded;
  const [phase, setPhase] = useState<Phase>('idle');
  const level = useRef(0);
  const waveform = useRef<number[]>([]);
  const [seconds, setSeconds] = useState(0);

  const cancel = () => {
    const session = current.current;
    current.current = null;
    release(session);
    level.current = 0;
    setPhase('idle');
  };
  const fail = (session: Session, key: ChatVoiceError) => {
    if (current.current !== session) return;
    cancel();
    onError.current(key);
  };

  useEffect(() => {
    setPhase('idle');
    return () => {
      const session = current.current;
      current.current = null;
      release(session);
    };
  }, [input.scopeKey]);
  useEffect(() => {
    if (!input.enabled && current.current) cancel();
  }, [input.enabled]);

  const start = async () => {
    if (!input.enabled || current.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined' || typeof AudioContext === 'undefined') {
      onError.current('unsupported');
      return;
    }
    const format = FORMATS.find(item => MediaRecorder.isTypeSupported(item.mimeType));
    if (!format) { onError.current('unsupported'); return; }
    const session: Session = { chunks: [], size: 0, saveRequested: false, sendImmediately: false };
    current.current = session;
    setPhase('requesting');
    level.current = 0;
    waveform.current = [];
    setSeconds(0);
    try {
      session.context = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (current.current !== session) { stream.getTracks().forEach(track => track.stop()); return; }
      session.stream = stream;
      await session.context.resume();
      if (current.current !== session) return;
      const analyser = session.context.createAnalyser();
      analyser.fftSize = 1024;
      session.source = session.context.createMediaStreamSource(stream);
      session.source.connect(analyser);
      const recorder = new MediaRecorder(stream, { mimeType: format.mimeType, audioBitsPerSecond: 64000 });
      session.recorder = recorder;
      recorder.ondataavailable = event => {
        if (current.current !== session || !event.data.size) return;
        session.chunks.push(event.data);
        session.size += event.data.size;
        if (session.size > MAX_VOICE_BYTES) fail(session, 'tooLarge');
      };
      recorder.onerror = () => fail(session, 'failed');
      recorder.onstop = () => {
        if (current.current !== session) return;
        if (!session.saveRequested || !session.size) { fail(session, 'failed'); return; }
        const mimeType = recorder.mimeType.split(';')[0];
        const file = new File(session.chunks, `voice-${Date.now()}.${format.extension}`, { type: mimeType });
        cancel();
        onRecorded.current(file, session.sendImmediately);
      };
      stream.getAudioTracks().forEach(track => track.addEventListener('ended', () => {
        if (!session.saveRequested) fail(session, 'failed');
      }, { once: true }));
      recorder.start(250);
      setPhase('recording');
      const started = performance.now();
      session.startedAt = started;
      const samples = new Float32Array(analyser.fftSize);
      let elapsedSeconds = 0;
      let sampledAt = started;
      const update = (now: number) => {
        if (current.current !== session || session.saveRequested) return;
        analyser.getFloatTimeDomainData(samples);
        let energy = 0;
        for (const value of samples) energy += value * value;
        level.current = Math.min(1, Math.sqrt(energy / samples.length) * 6) ** 0.65;
        const sampleCount = Math.floor((now - sampledAt) / RECORDING_SAMPLE_INTERVAL);
        for (let index = 0; index < sampleCount; index++) waveform.current.push(level.current);
        sampledAt += sampleCount * RECORDING_SAMPLE_INTERVAL;
        const elapsed = Math.floor((now - started) / 1000);
        if (elapsed !== elapsedSeconds) {
          elapsedSeconds = elapsed;
          setSeconds(elapsed);
        }
        session.frame = window.requestAnimationFrame(update);
      };
      session.frame = window.requestAnimationFrame(update);
    } catch (cause) {
      const name = cause instanceof Error ? cause.name : '';
      fail(session, name === 'NotAllowedError' || name === 'SecurityError' ? 'permissionDenied'
        : name === 'NotFoundError' ? 'noMicrophone' : name === 'NotReadableError' ? 'microphoneBusy' : 'failed');
    }
  };
  const stop = (sendImmediately = false) => {
    const session = current.current;
    if (!session?.recorder || session.recorder.state !== 'recording' || session.saveRequested) return;
    session.saveRequested = true;
    session.sendImmediately = sendImmediately;
    if (!waveform.current.length) waveform.current.push(level.current);
    if (session.startedAt !== undefined) setSeconds((performance.now() - session.startedAt) / 1000);
    setPhase('finishing');
    session.recorder.stop();
  };
  return { phase, active: phase !== 'idle', level, waveform, seconds, start, stop, cancel };
}

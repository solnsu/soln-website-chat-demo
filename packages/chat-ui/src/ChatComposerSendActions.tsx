import { LuArrowUp as ArrowUpIcon } from 'react-icons/lu';
import { HiOutlineMicrophone } from 'react-icons/hi';
import { LuPause, LuPlay, LuSquare } from 'react-icons/lu';
import { AiOutlineDelete } from 'react-icons/ai';
import { SolnSpin } from './SolnSpin';
import React, { type ReactNode } from 'react';
import { ChatRecordingWaveform } from './ChatRecordingWaveform';
import { useChatVoicePreview } from './useChatVoicePreview';
import type { useChatVoiceRecorder } from './useChatVoiceRecorder';

export type ChatVoiceLabels = {
  start: string; stop: string; cancel: string; requesting: string; finishing: string;
  waveform: string; seek: string; play: string; pause: string;
  seekPosition: (position: string, duration: string) => string;
};
export type ChatComposerSendActionsProps = {
  recorder: ReturnType<typeof useChatVoiceRecorder>; canRecord: boolean; hasContent: boolean;
  writable: boolean; sending: boolean; uploading: boolean; translationEnabled: boolean;
  previewDisabled?: boolean; sendLabel: string; onSend: () => void;
  onStartRecording?: () => void;
  voiceDraft?: { previewUrl: string | null }; hasVoice?: boolean; onRemoveVoice?: () => void;
  labels: ChatVoiceLabels; onPreviewError: () => void; sendIcon?: ReactNode;
};
export function ChatComposerSendActions(props: ChatComposerSendActionsProps) {
  const { labels } = props;
  const { recorder } = props;
  const preview = useChatVoicePreview(props.voiceDraft?.previewUrl || null, props.sending || Boolean(props.previewDisabled), recorder.seconds, props.onPreviewError);
  const voiceLayout = recorder.active || Boolean(props.voiceDraft);
  const voice = props.canRecord && !props.hasContent;
  const busy = recorder.phase === 'requesting' || recorder.phase === 'finishing';
  const label = recorder.active ? busy ? labels[recorder.phase === 'requesting' ? 'requesting' : 'finishing'] : props.sendLabel
    : voice ? labels.start : props.sendLabel;
  const disabled = !props.writable || props.sending || props.uploading || busy || (!props.hasContent && !voice && !recorder.active);
  const seconds = Math.floor(recorder.active ? recorder.seconds : preview.seconds);
  const progress = preview.duration > 0 ? Math.min(1, preview.position / preview.duration) : 0;
  return <div className={`soln-base-composer-actions-right${voiceLayout ? ' tenant-chat-recording-actions' : ''}`}>
    {voiceLayout ? <>
      <button type="button" className="soln-base-icon-button tenant-chat-recording-delete" disabled={props.sending}
        onClick={recorder.active ? recorder.cancel : props.onRemoveVoice}
        aria-label={labels.cancel} title={labels.cancel}>
        <AiOutlineDelete size={22} />
      </button>
      <div className="tenant-chat-recording-pill">
        <div className="tenant-chat-recording-wave" role={recorder.active ? 'img' : 'group'}
          aria-label={labels.waveform}>
          <ChatRecordingWaveform level={recorder.level} waveform={recorder.waveform} recording={recorder.phase === 'recording'} />
          {!recorder.active && props.voiceDraft ? <>
            <span className="tenant-chat-recording-playhead" aria-hidden="true" style={{ left: `${progress * 100}%` }} />
            <input type="range" className="tenant-chat-recording-seek" min={0} max={preview.duration || 1} step="any"
              value={Math.min(preview.position, preview.duration || 0)}
              aria-label={labels.seek}
              aria-valuetext={labels.seekPosition(preview.position.toFixed(1), preview.duration.toFixed(1))}
              disabled={props.sending || !preview.duration}
              onChange={event => preview.seek(Number(event.currentTarget.value))} />
          </> : null}
        </div>
        <span className="tenant-chat-recording-time" role="timer">
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </span>
      </div>
      {props.voiceDraft?.previewUrl ? <audio ref={preview.audio} src={props.voiceDraft.previewUrl} preload="metadata" hidden
        onLoadedMetadata={event => preview.onDuration(event.currentTarget.duration)}
        onDurationChange={event => preview.onDuration(event.currentTarget.duration)}
        onTimeUpdate={event => preview.onPosition(event.currentTarget.currentTime)}
        onPlaying={preview.onPlaying} onPause={preview.onPause} onEnded={preview.onEnded} /> : null}
    </> : null}
    {recorder.active ? <button type="button"
      className="soln-base-icon-button soln-base-icon-button--outline tenant-chat-recording-stop"
      aria-label={labels.stop} title={labels.stop}
      disabled={disabled} onClick={() => recorder.stop()}>
      <LuSquare size={13} fill="currentColor" />
    </button> : props.voiceDraft ? <button type="button"
      className="soln-base-icon-button soln-base-icon-button--outline tenant-chat-recording-stop"
      aria-label={labels[preview.playing ? 'pause' : 'play']}
      title={labels[preview.playing ? 'pause' : 'play']}
      disabled={props.sending || !props.voiceDraft.previewUrl} onClick={() => { void preview.toggle(); }}>
      {preview.playing ? <LuPause size={16} /> : <LuPlay size={16} />}
    </button> : null}
    <button type="button" className="soln-base-icon-button soln-base-composer-send soln-base-icon-button--default"
      aria-label={label} title={label} disabled={disabled}
      onClick={() => {
        if (recorder.active) recorder.stop(true);
        else if (voice) { props.onStartRecording?.(); void recorder.start(); }
        else props.onSend();
      }}>
      {props.sending || busy ? <SolnSpin size={18} /> : recorder.active ? <ArrowUpIcon size={18} />
        : voice ? <HiOutlineMicrophone size={18} />
          : props.translationEnabled && !props.hasVoice && !voiceLayout ? props.sendIcon : <ArrowUpIcon size={18} />}
    </button>
  </div>;
}

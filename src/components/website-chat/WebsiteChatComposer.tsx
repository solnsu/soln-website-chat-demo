'use client';

import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FileText, Smile } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { Button, Popover } from 'antd';
import { ChatTextInput, ChatComposerShell, ChatComposerToolbar, ChatComposerReply, ChatComposerAttachments, ChatComposerAttachment, useChatCompactComposer } from '@soln/chat-ui';
import { ChatComposerSendActions } from '@soln/chat-ui/voice';
import { guestChatAttachmentMediaType, guestChatFileAccept, type AnonymousChatMessage, type ChatAnonymousMedia } from '@soln/chat-sdk';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import type { useWebsiteChat } from './useWebsiteChat';
import { fileBase64, fileMimeType, mediaKind, MEDIA_MAX_BYTES } from './media-files';
import { useAppMessage } from '../feedback/AppMessageProvider';
import { useWebsiteVoiceComposer } from './useWebsiteVoiceComposer';
import { WebsiteChatVoiceMessage } from './WebsiteChatVoiceMessage';
import styles from './WebsiteChatWidget.module.css';
import { chatSenderName } from './chat-sender-name';

const WebsiteChatEmojiPicker = lazy(() => import('./WebsiteChatEmojiPicker').then(module => ({ default: module.WebsiteChatEmojiPicker })));

const ERROR_MESSAGE_KEY = 'website-chat-composer-error';

type DraftFile = { id: string; file: File; kind: 'image' | 'file' | 'voice' };
function DraftPreview({ item, copy, disabled, remove }: { item: DraftFile; copy: WebsiteChatCopy; disabled: boolean; remove: () => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const value = URL.createObjectURL(item.file); setUrl(value); return () => URL.revokeObjectURL(value); }, [item.file]);
  return <ChatComposerAttachment kind={item.kind} removeLabel={`${copy.remove}: ${item.file.name}`} disabled={disabled} onRemove={remove}>
    {item.kind === 'image' ? <img src={url || undefined} alt={item.file.name} />
      : item.kind === 'voice' || item.file.type.startsWith('audio/') ? url ? <WebsiteChatVoiceMessage src={url} copy={copy} disabled={disabled} /> : null
        : item.file.type.startsWith('video/') ? <video controls playsInline src={url || undefined} preload="metadata" />
          : <><FileText size={32} /><span><strong>{item.file.name}</strong><small>{item.file.type}</small></span></>}
  </ChatComposerAttachment>;
}

export function WebsiteChatComposer({ chat, active, copy, locale, reply, clearReply, onSend }: {
  chat: ReturnType<typeof useWebsiteChat>; active: boolean; copy: WebsiteChatCopy; locale: string;
  reply: AnonymousChatMessage | null; clearReply: () => void; onSend: () => void;
}) {
  const message = useAppMessage();
  const compact = useChatCompactComposer();
  const clearError = () => message.dismiss(ERROR_MESSAGE_KEY);
  const showError = (content: string) => message.open({ key: ERROR_MESSAGE_KEY, tone: 'error', content, duration: 3.4 });
  const input = useRef<HTMLTextAreaElement>(null), fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<DraftFile[]>([]);
  const [picker, setPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploads = useRef(new Map<string, ChatAnonymousMedia>()), busy = useRef(false);
  const mounted = useRef(true);
  const unavailable = chat.loading || chat.error === 'expired' || !chat.session?.canSendMessages;
  const disabled = unavailable || uploading || chat.sending;
  const allowedMedia = chat.session?.allowedMedia ?? [];
  const canAttach = allowedMedia.some(type => ['image', 'video', 'audio', 'file'].includes(type));
  const canRecord = allowedMedia.includes('voice');
  const addFiles = (items: File[]) => {
    if (disabled || voiceLayout) return;
    if (items.some(file => !allowedMedia.includes(guestChatAttachmentMediaType({ kind: mediaKind(fileMimeType(file)), mimeType: fileMimeType(file) })))) {
      showError(copy.mediaNotAllowed); return;
    }
    if (files.length + items.length > 10 || items.some(file => !file.size || file.size > MEDIA_MAX_BYTES || !file.name || file.name.length > 255)) {
      showError(copy.invalidFiles); return;
    }
    clearError();
    setFiles(current => [...current, ...items.map(file => ({ file, id: crypto.randomUUID(), kind: mediaKind(fileMimeType(file)) }))]);
  };
  const voiceRecorder = useWebsiteVoiceComposer({
    scopeKey: chat.session?.conversationId || '', enabled: canRecord && active && !disabled && !chat.draft.trim() && !files.length,
    writable: !unavailable, uploadMedia: chat.uploadMedia, onError: key => showError(copy.recordingErrors[key]),
    onSendMedia: async assetId => {
      onSend();
      const sent = await chat.send({ mediaIds: [assetId], ...(reply ? { replyToMessageId: reply.id } : {}) });
      if (sent) { clearError(); clearReply(); }
      return Boolean(sent);
    },
  });
  useEffect(() => {
    if (voiceRecorder.phase === 'recording' || voiceRecorder.draft) message.dismiss(ERROR_MESSAGE_KEY);
  }, [voiceRecorder.phase, voiceRecorder.draft, message]);
  useEffect(() => () => message.dismiss(ERROR_MESSAGE_KEY), [message]);
  const recording = voiceRecorder.active, voiceLayout = recording || Boolean(voiceRecorder.draft);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setFiles([]); uploads.current.clear(); clearError(); }, [chat.session?.conversationId]);
  useEffect(() => { if (!active) { setPicker(false); input.current?.blur(); } }, [active]);
  useEffect(() => { if (active && !compact && !disabled && !voiceLayout) input.current?.focus({ preventScroll: true }); }, [active, compact, disabled, voiceLayout]);
  useLayoutEffect(() => {
    const element = input.current; if (!active || !element) return;
    element.style.height = 'auto'; element.style.height = `${element.scrollHeight}px`;
  }, [active, chat.draft]);
  const submit = async () => {
    if (busy.current || disabled || voiceLayout || (!chat.draft.trim() && !files.length)) return;
    if (files.some(item => !allowedMedia.includes(guestChatAttachmentMediaType({ kind: item.kind, mimeType: fileMimeType(item.file) })))) {
      showError(copy.mediaNotAllowed); return;
    }
    busy.current = true; setUploading(true); clearError(); onSend();
    try {
      const mediaIds: string[] = [];
      for (const item of files) {
        let asset = uploads.current.get(item.id);
        if (!asset) {
          asset = await chat.uploadMedia({ name: item.file.name, mimeType: fileMimeType(item.file), kind: item.kind, contentBase64: await fileBase64(item.file) });
          uploads.current.set(item.id, asset);
        }
        mediaIds.push(asset.assetId);
      }
      const sent = await chat.send({ mediaIds,
        ...(reply ? { replyToMessageId: reply.id } : {}) });
      if (sent && mounted.current) {
        setFiles([]); uploads.current.clear();
        clearReply(); setPicker(false);
      }
    } catch { if (mounted.current) showError(copy.sendFailed); }
    finally { busy.current = false; if (mounted.current) setUploading(false); }
  };
  const insertEmoji = (emoji: string) => {
    const start = input.current?.selectionStart ?? chat.draft.length;
    const end = input.current?.selectionEnd ?? start;
    const next = chat.draft.slice(0, start) + emoji + chat.draft.slice(end);
    if (next.length > 4000) return;
    chat.setDraft(next);
    if (!compact) setPicker(false);
    requestAnimationFrame(() => {
      if (!compact) input.current?.focus({ preventScroll: true });
      input.current?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };
  const action = (label: string, icon: React.ReactNode, click?: () => void, className = '', expanded?: boolean) => <button type="button" className={`soln-base-icon-button ${className}`}
    aria-label={label} title={label} aria-expanded={expanded} disabled={disabled || voiceLayout}
    onPointerDown={compact ? event => event.preventDefault() : undefined} onClick={click}>{icon}</button>;
  const toggleMobilePicker = () => { input.current?.blur(); setPicker(current => !current); };
  const popupContainer = (trigger: HTMLElement) => trigger.closest<HTMLElement>('[data-website-chat]') || trigger.parentElement!;
  return <form className={`${styles.composer}${compact ? ` tenant-chat-composer tenant-chat-composer--mobile ${styles.mobileComposer}` : ''}`}
    onSubmit={event => { event.preventDefault(); if (voiceRecorder.draft) void voiceRecorder.send(); else void submit(); }}
    onDragOver={event => { if (!disabled && !voiceLayout && event.dataTransfer.types.includes('Files')) event.preventDefault(); }}
    onDrop={event => { event.preventDefault(); if (!voiceLayout) addFiles(Array.from(event.dataTransfer.files)); }}>
    <ChatComposerShell voiceLayout={voiceLayout} compact={compact}>
      {reply ? <ChatComposerReply title={`${copy.reply} · ${chatSenderName(reply.sender, chat.session?.visitor.id, copy)}`} preview={reply.body || reply.sticker?.name || reply.attachments[0]?.name}
        disabled={disabled} cancelLabel={copy.cancel} onCancel={clearReply} /> : null}
      {files.length ? <ChatComposerAttachments>{files.map(item => <DraftPreview key={item.id} item={item} copy={copy} disabled={disabled}
        remove={() => { setFiles(current => current.filter(file => file.id !== item.id)); uploads.current.delete(item.id); }} />)}</ChatComposerAttachments> : null}
      <ChatTextInput ref={input} className={`soln-base-composer-input ${styles.input} cp-sidebar-scrollbar`} value={chat.draft} maxLength={4000} rows={1}
        placeholder={voiceLayout ? '' : copy.placeholder} aria-label={copy.placeholder} disabled={disabled || voiceLayout}
        enterKeyHint={compact ? 'enter' : undefined}
        onFocus={() => { if (compact) setPicker(false); }}
        onPointerDown={event => {
          if (!compact || document.activeElement === event.currentTarget) return;
          const element = event.currentTarget, start = element.selectionStart, end = element.selectionEnd;
          event.preventDefault(); element.focus({ preventScroll: true }); element.setSelectionRange(start, end);
        }}
        onChange={event => chat.setDraft(event.target.value)}
        onPaste={event => { const items = Array.from(event.clipboardData.files); if (items.length) { event.preventDefault(); addFiles(items); } }}
        onKeyDown={event => { if (!compact && event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }} />
      <input hidden type="file" multiple ref={fileInput} accept={guestChatFileAccept(allowedMedia)} disabled={disabled || voiceLayout} onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
      <ChatComposerToolbar tools={!voiceLayout ? <>
          {canAttach ? <Button type={compact ? 'default' : 'text'} shape="circle"
            className="soln-base-composer-attach" aria-label={copy.attachment} title={copy.attachment}
            style={{ background: 'transparent', boxShadow: 'none' }}
            disabled={disabled || voiceLayout} icon={<LuPlus size={compact ? 22 : 18} />}
            onPointerDown={compact ? event => event.preventDefault() : undefined}
            onClick={() => fileInput.current?.click()} /> : null}
          {compact ? action(copy.emoji, <Smile size={18} />, toggleMobilePicker, 'tenant-chat-sticker-picker__trigger', picker) : <Popover open={picker} onOpenChange={setPicker} trigger="click" placement="topLeft" getPopupContainer={popupContainer}
            content={<div>{picker ? <Suspense fallback={null}><WebsiteChatEmojiPicker locale={locale} copy={copy}
              disabled={disabled} onSelect={insertEmoji} /></Suspense> : null}</div>}>
            {action(copy.emoji, <Smile size={18} />)}
          </Popover>}
        </> : null}>
        <ChatComposerSendActions recorder={voiceRecorder} canRecord={canRecord} hasContent={Boolean(chat.draft.trim() || files.length || voiceRecorder.draft)}
          writable={!unavailable && active} sending={chat.sending || voiceRecorder.sending} uploading={uploading} translationEnabled={false} previewDisabled={!active}
          sendLabel={copy.send} voiceDraft={voiceRecorder.draft || undefined} hasVoice={Boolean(voiceRecorder.draft)}
          onRemoveVoice={voiceRecorder.remove} onStartRecording={() => { clearError(); setPicker(false); input.current?.blur(); }}
          onSend={() => { if (voiceRecorder.draft) void voiceRecorder.send(); else void submit(); }}
          onPreviewError={() => showError(copy.previewFailed)} labels={{
            start: copy.voice, stop: copy.stopRecording, cancel: copy.deleteRecording, requesting: copy.requestingMicrophone,
            finishing: copy.finishingRecording, waveform: copy.recordingWaveform, seek: copy.recordingSeek,
            play: copy.playRecording, pause: copy.pauseRecording,
            seekPosition: (position, duration) => copy.recordingSeekPosition.replace('{position}', position).replace('{duration}', duration),
          }} />
      </ChatComposerToolbar>
    </ChatComposerShell>
    {compact && picker ? <div className={styles.mobileEmojiDock}>
      <Suspense fallback={null}><WebsiteChatEmojiPicker mobile locale={locale} copy={copy} disabled={disabled} onSelect={insertEmoji} /></Suspense>
    </div> : null}
  </form>;
}

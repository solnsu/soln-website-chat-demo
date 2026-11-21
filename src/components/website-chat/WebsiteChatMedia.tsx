'use client';

import { useEffect, useRef, useState } from 'react';
import { Image, Modal } from 'antd';
import { ChatImageContent, ChatVideoContent, ChatFileCard } from '@soln/chat-ui/media';
import { FileText } from 'lucide-react';
import type { AnonymousChatClient } from '@soln/chat-sdk';
import type { WebsiteChatCopy } from '@/lib/website-chat-copy';
import { contentBlob, mediaKind } from './media-files';
import { WebsiteChatVoiceMessage } from './WebsiteChatVoiceMessage';
import styles from './WebsiteChatWidget.module.css';

type Props = { assetId: string; name: string; mimeType?: string; kind?: string;
  readMedia: AnonymousChatClient['readMedia']; copy: WebsiteChatCopy; thumbnail?: boolean };
export function WebsiteChatMedia({ assetId, name, kind, mimeType, readMedia, copy, thumbnail }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [content, setContent] = useState<{ url: string; type: string } | null>(null);
  const [failed, setFailed] = useState(false), [version, setVersion] = useState(0);
  // Ordinary documents are fetched on click. Image/audio/video previews are fetched only near the viewport.
  const download = useRef(false);
  const [requested, setRequested] = useState(false);
  const [node, setNode] = useState<HTMLElement | null>(null);
  const previewable = thumbnail || kind === 'image' || kind === 'voice' || mimeType?.startsWith('video/') || mimeType?.startsWith('audio/');
  useEffect(() => {
    if (!node || !previewable) return;
    if (typeof IntersectionObserver === 'undefined') { setRequested(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setRequested(true); observer.disconnect(); }
    }, { root: node.closest('[data-chat-media-scroll]'), rootMargin: '100px' });
    observer.observe(node); return () => observer.disconnect();
  }, [node, previewable]);
  useEffect(() => {
    if (!requested) { setContent(null); return; }
    let cancelled = false, url: string | undefined;
    setContent(null); setFailed(false);
    void readMedia({ assetId }).then(data => {
      if (cancelled) return;
      // Never render active documents (including SVG/HTML) in the chat origin.
      const blob = contentBlob(data);
      url = URL.createObjectURL(blob);
      setContent({ url, type: data.mimeType });
      if (download.current) {
        download.current = false;
        const link = document.createElement('a'); link.href = url; link.download = data.name;
        document.body.appendChild(link); link.click(); link.remove();
      }
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [assetId, readMedia, requested, version]);
  const downloadFile = () => {
    if (content) {
      const link = document.createElement('a'); link.href = content.url; link.download = name;
      document.body.appendChild(link); link.click(); link.remove();
    } else { download.current = true; setRequested(true); }
  };
  if (failed) return <div ref={setNode} className={styles.media}>
    <button type="button" onClick={() => setVersion(value => value + 1)}>{copy.mediaFailed}</button>
  </div>;
  if (thumbnail) return <div ref={setNode} className={styles.stickerMedia}>
    <ChatImageContent src={content?.url ?? null} alt={name} iconSize={22} loadingLabel={copy.loading} failedLabel={copy.mediaFailed} />
  </div>;
  if (kind === 'voice') return <div ref={setNode} className={styles.media}>
    <WebsiteChatVoiceMessage src={content?.url ?? null} copy={copy} />
  </div>;
  if (kind === 'image' && (!content || mediaKind(content.type) === 'image')) return <Image.PreviewGroup
    items={content ? [content.url] : []} preview={{ open: previewOpen, onOpenChange: setPreviewOpen }}>
    <button type="button" ref={setNode} className="tenant-chat-message__image" disabled={!content} onClick={() => setPreviewOpen(true)}>
      <ChatImageContent src={content?.url ?? null} alt={name} iconSize={22} loadingLabel={copy.loading} failedLabel={copy.mediaFailed} />
    </button>
  </Image.PreviewGroup>;
  if ((content?.type || mimeType)?.startsWith('video/')) return <>
    <button type="button" ref={setNode} className="tenant-chat-message__video" aria-label={name} disabled={!content} onClick={() => setPreviewOpen(true)}>
      <ChatVideoContent src={content?.url ?? null} loadingLabel={copy.loading} failedLabel={copy.mediaFailed} />
    </button>
    <Modal open={previewOpen} onCancel={() => setPreviewOpen(false)} footer={null} title={name} destroyOnHidden>
      {content ? <video controls autoPlay playsInline src={content.url} aria-label={name} /> : null}
    </Modal>
  </>;
  return <div ref={setNode} className={styles.media}>
    <ChatFileCard name={name} detail={copy.download} loading={requested && !content} loadingLabel={copy.loading}
      onOpen={downloadFile} icon={<FileText size={32} />} />
  </div>;
}

'use client';

import { useEffect, useState } from 'react';
import { ANONYMOUS_VISITOR_AVATAR_URL, getDefaultMemberAvatarUrl } from '@soln/chat-ui/default-avatars';
import type { AnonymousChatClient, ChatSender } from '@soln/chat-sdk';
import { contentBlob, mediaKind } from './media-files';
import styles from './WebsiteChatWidget.module.css';

export function WebsiteChatAvatar({ sender, readMedia, size = 34, round = false }: {
  sender: ChatSender; readMedia: AnonymousChatClient['readMedia']; size?: number; round?: boolean;
}) {
  const [image, setImage] = useState<{ assetId: string; url: string } | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const assetId = sender.avatarAssetId;
  useEffect(() => {
    if (!assetId) return;
    let cancelled = false, url: string | undefined;
    void readMedia({ assetId }).then(content => {
      if (cancelled || mediaKind(content.mimeType) !== 'image') return;
      url = URL.createObjectURL(contentBlob(content));
      setImage({ assetId, url });
    }).catch(() => {});
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [assetId, readMedia]);
  const defaultSrc = sender.kind === 'member' ? getDefaultMemberAvatarUrl(sender.gender)
    : sender.kind === 'visitor' ? ANONYMOUS_VISITOR_AVATAR_URL : '/workspace-app-icons/luna/luna.png';
  const src = image?.assetId === assetId && image?.url !== failedSrc ? image?.url : defaultSrc;
  const style = { width: size, height: size, flexBasis: size, ...(round ? { borderRadius: '50%' } : {}) };
  return src && src !== failedSrc ? <img className={styles.avatar} src={src} alt={sender.name}
    width={size} height={size} style={style} loading="lazy" onError={() => setFailedSrc(src)} />
    : <span className={`${styles.avatar} ${styles.avatarFallback}`} style={style} role="img" aria-label={sender.name}>
      {sender.name.trim().charAt(0).toUpperCase() || '?'}
    </span>;
}

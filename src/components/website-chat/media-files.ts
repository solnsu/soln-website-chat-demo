import { CHAT_ANONYMOUS_MEDIA_MAX_BYTES, type ChatAnonymousMediaUpload } from '@soln/chat-sdk';

export const MEDIA_MAX_BYTES = CHAT_ANONYMOUS_MEDIA_MAX_BYTES;
const images = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
export function mediaKind(mimeType: string): ChatAnonymousMediaUpload['kind'] {
  return images.has(mimeType) ? 'image' : 'file';
}
export function fileMimeType(file: File) {
  return file.type.split(';')[0].toLowerCase() || 'application/octet-stream';
}
export function fileBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
}
export function contentBlob(content: { contentBase64: string; mimeType: string }) {
  const bytes = Uint8Array.from(atob(content.contentBase64), char => char.charCodeAt(0));
  return new Blob([bytes], { type: content.mimeType });
}

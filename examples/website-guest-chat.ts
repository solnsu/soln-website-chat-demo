import {
  AnonymousChatError, CHAT_ANONYMOUS_MEDIA_MAX_BYTES, createAnonymousChatClient,
  guestChatAttachmentMediaType, guestChatFileAccept,
  type AnonymousChatMessage, type AnonymousChatMessagePage, type AnonymousChatSession,
  type ChatAnonymousMediaUpload, type ChatAnonymousSendInput, type GuestChatMediaType,
} from '@soln/chat-sdk';

export type WebsiteChatState = {
  session: AnonymousChatSession | null;
  messages: AnonymousChatMessage[];
  before: string | null;
  expired: boolean;
};

const expiredCodes = new Set([
  'CHAT_ANONYMOUS_SESSION_INVALID', 'CHAT_ANONYMOUS_SESSION_EXPIRED',
  'CHAT_ANONYMOUS_SESSION_FORBIDDEN',
]);

// Browser-only controller. Create one per mounted widget; dispose on unmount.
export function createWebsiteChat(options: {
  runtimeOrigin: string;
  entryId: string;
  onChange: (state: WebsiteChatState) => void;
  onError: (error: unknown) => void;
}) {
  const storageKey = `soln:website-chat:${options.runtimeOrigin}:${options.entryId}`;
  let token: string | undefined;
  try { token = localStorage.getItem(storageKey) || undefined; } catch { /* Use memory if storage is blocked. */ }
  const chat = createAnonymousChatClient({ ...options, sessionToken: token });
  let state: WebsiteChatState = { session: null, messages: [], before: null, expired: false };
  let open = false, disposed = false, olderLoaded = false, loadingOlder = false;
  let refreshing: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const emit = () => { if (!disposed) options.onChange(state); };
  const report = (error: unknown) => {
    if (disposed) return;
    if (error instanceof AnonymousChatError && expiredCodes.has(error.code)) {
      state = { ...state, expired: true }; clearTimeout(timer); emit();
    }
    options.onError(error);
  };
  const merge = (page: AnonymousChatMessagePage, older = false) => {
    const boundary = page.items[0]?.sequence;
    const kept = older ? state.messages : boundary
      ? state.messages.filter(message => BigInt(message.sequence) < BigInt(boundary)) : [];
    const byId = new Map([...kept, ...page.items].map(message => [message.id, message]));
    return [...byId.values()].sort((a, b) =>
      BigInt(a.sequence) < BigInt(b.sequence) ? -1 : BigInt(a.sequence) > BigInt(b.sequence) ? 1 : 0);
  };
  function refresh(): Promise<void> {
    if (disposed || state.expired) return Promise.resolve();
    if (refreshing) return refreshing;
    refreshing = (async () => {
      try {
        const session = state.session ? await chat.getSession() : await chat.createSession();
        const credential = chat.getSessionToken();
        if (credential) {
          try { localStorage.setItem(storageKey, credential); } catch { /* The SDK retains the token in memory. */ }
        }
        const page = await chat.listMessages({ limit: 50 });
        if (disposed) return;
        state = { ...state, session, messages: merge(page),
          before: olderLoaded ? state.before : page.hasMore ? page.nextBeforeSequence : null };
        emit();
      } catch (error) { report(error); }
    })().finally(() => { refreshing = null; });
    return refreshing;
  }
  const active = () => open && !disposed && !state.expired && document.visibilityState === 'visible';
  async function tick() {
    clearTimeout(timer);
    if (!active()) return;
    await refresh();
    clearTimeout(timer);
    if (active()) timer = setTimeout(tick, 4000);
  }
  const onVisibility = () => { clearTimeout(timer); if (active()) void tick(); };
  document.addEventListener('visibilitychange', onVisibility);
  const requireWritable = () => {
    if (disposed || state.expired || !state.session?.canSendMessages) {
      throw new Error('CHAT_NOT_WRITABLE');
    }
  };
  const allows = (type: GuestChatMediaType) => state.session?.allowedMedia.includes(type) ?? false;
  const requireMedia = (type: GuestChatMediaType) => {
    if (!allows(type)) throw new Error('CHAT_GUEST_MEDIA_NOT_ALLOWED');
  };
  async function mutate<T>(operation: () => Promise<T>): Promise<T> {
    let result: T;
    try { requireWritable(); result = await operation(); }
    catch (error) { report(error); await refresh(); throw error; }
    // A history refresh failure must not turn a successful write into a failed send.
    if (refreshing) await refreshing;
    await refresh();
    return result;
  }
  return {
    getState: () => state,
    refresh,
    allows,
    fileAccept: () => guestChatFileAccept(state.session?.allowedMedia ?? []),
    setOpen(value: boolean) { open = value; clearTimeout(timer); if (active()) void tick(); },
    dispose() {
      disposed = true; open = false; clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    },
    async loadOlder() {
      if (!state.before || disposed || state.expired || loadingOlder) return;
      loadingOlder = true;
      try {
        const page = await chat.listMessages({ beforeSequence: state.before, limit: 50 });
        if (disposed) return;
        olderLoaded = true;
        state = { ...state, messages: merge(page, true), before: page.hasMore ? page.nextBeforeSequence : null };
        emit();
      } catch (error) { report(error); }
      finally { loadingOlder = false; }
    },
    async markVisible(sequence: string) {
      if (!active() || !state.session || BigInt(sequence) <= BigInt(state.session.lastReadSequence)) return;
      try {
        const result = await chat.markRead({ lastReadSequence: sequence });
        if (state.session && BigInt(result.lastReadSequence) > BigInt(state.session.lastReadSequence)) {
          state = { ...state, session: { ...state.session, lastReadSequence: result.lastReadSequence } };
        }
      } catch (error) { report(error); }
    },
    send(input: ChatAnonymousSendInput) {
      return mutate(() => {
        if (input.stickerId) requireMedia('sticker');
        if (input.location) requireMedia('location');
        return chat.sendMessage(input);
      });
    },
    react(messageId: string, emoji: string, requestId = crypto.randomUUID()) {
      return mutate(() => chat.reactToMessage({ messageId, emoji, requestId }));
    },
    async upload(file: File, kind: ChatAnonymousMediaUpload['kind']) {
      requireWritable();
      const mimeType = file.type.split(';')[0].toLowerCase() || 'application/octet-stream';
      requireMedia(guestChatAttachmentMediaType({ kind, mimeType }));
      if (!file.size || file.size > CHAT_ANONYMOUS_MEDIA_MAX_BYTES) throw new Error('CHAT_UPLOAD_SIZE_INVALID');
      try {
        return await chat.uploadMedia({ name: file.name, mimeType, kind, contentBase64: await toBase64(file) });
      } catch (error) { report(error); await refresh(); throw error; }
    },
    async listStickers(input: { afterId?: string; limit?: number } = {}) {
      requireMedia('sticker');
      return chat.listStickers(input);
    },
    async readMedia(assetId: string) {
      const content = await chat.readMedia({ assetId });
      const bytes = Uint8Array.from(atob(content.contentBase64), value => value.charCodeAt(0));
      const blob = new Blob([bytes], { type: content.mimeType });
      return { ...content, url: URL.createObjectURL(blob) };
    },
    isOwn(sender: AnonymousChatMessage['sender']) {
      return sender.kind === 'visitor' && sender.id === state.session?.visitor.id;
    },
    // Call only after the user explicitly chooses to start a new expired session.
    forgetExpiredSession() {
      if (!state.expired) throw new Error('CHAT_SESSION_NOT_EXPIRED');
      localStorage.removeItem(storageKey);
      this.dispose();
    },
  };
}

function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
}

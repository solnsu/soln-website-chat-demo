import { anonymousChatSessionSchema, anonymousChatCreatedSessionSchema,
  chatListMessagesInputSchema, chatMarkReadInputSchema, chatSendResultSchema, chatMessagePageSchema,
  chatReadResultSchema, type AnonymousChatSession, type ChatListMessagesInput,
  chatAnonymousSendInputSchema, chatAnonymousMediaUploadSchema, chatAnonymousMediaSchema, chatAnonymousMediaReadInputSchema,
  chatAnonymousMediaContentSchema, chatAnonymousStickerListInputSchema, chatAnonymousStickerPageSchema,
  type ChatAnonymousSendInput, type ChatAnonymousMediaUpload,
  type ChatMarkReadInput, chatAnonymousReactionInputSchema, chatReactionResultSchema } from '@soln/chat-contracts';
export { guestChatAttachmentMediaType, guestChatFileAccept, GUEST_CHAT_MEDIA_TYPES, CHAT_ANONYMOUS_MEDIA_MAX_BYTES, CHAT_MESSAGE_SCHEMA, CHAT_MESSAGE_PAGE_SCHEMA, MESSAGE_EVENT_SCHEMA,
  chatMessageSchema, chatMessagePageSchema, messageEventSchema } from '@soln/chat-contracts';

type ResponseSchema<T> = { safeParse(value: unknown): { success: true; data: T } | { success: false } };
export type * from './types.js';

export class AnonymousChatError extends Error {
  constructor(readonly code: string, readonly status: number) { super(code); this.name = 'AnonymousChatError'; }
}

export function createAnonymousChatClient(options: {
  runtimeOrigin: string;
  entryId: string;
  sessionToken?: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}) {
  const origin = new URL(options.runtimeOrigin);
  if (!['https:', 'http:'].includes(origin.protocol) || origin.origin !== options.runtimeOrigin) {
    throw new Error('CHAT_RUNTIME_ORIGIN_INVALID');
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.entryId)) {
    throw new Error('CHAT_ANONYMOUS_ENTRY_ID_INVALID');
  }
  if (options.sessionToken !== undefined && !/^[A-Za-z0-9_-]{43}$/.test(options.sessionToken)) {
    throw new AnonymousChatError('CHAT_ANONYMOUS_SESSION_INVALID', 0);
  }
  const timeoutMs = options.timeoutMs ?? 15000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new Error('CHAT_TIMEOUT_INVALID');
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  let sessionToken = options.sessionToken;
  let pendingCreate: Promise<AnonymousChatSession & { sessionToken: string }> | undefined;

  async function request<T>(operation: string, schema: ResponseSchema<T>, input: object = {}, create = false): Promise<T> {
    if (!create && !sessionToken) throw new AnonymousChatError('CHAT_ANONYMOUS_SESSION_REQUIRED', 401);
    const response = await fetcher(`${origin.origin}/api/chat/anonymous/${options.entryId}/commands/${operation}`, {
      method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json', ...(!create ? { Authorization: `Bearer ${sessionToken}` } : {}) },
      body: JSON.stringify({ input }), signal: AbortSignal.timeout(operation.startsWith('media.') ? Math.max(timeoutMs, 60000) : timeoutMs),
    });
    if (!response.ok) {
      const error: unknown = await response.json().catch(() => null);
      const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
        ? error.code : 'CHAT_REQUEST_FAILED';
      throw new AnonymousChatError(code, response.status);
    }
    let payload: unknown;
    try { payload = await response.json(); }
    catch { throw new AnonymousChatError('CHAT_RESPONSE_INVALID', response.status); }
    const result = schema.safeParse(payload);
    if (!result.success) throw new AnonymousChatError('CHAT_RESPONSE_INVALID', response.status);
    return result.data;
  }

  function input<T>(schema: ResponseSchema<T>, value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success) throw new AnonymousChatError('CHAT_INPUT_INVALID', 0);
    return result.data;
  }
  const getSession = () => request('session.get', anonymousChatSessionSchema);
  return {
    // Persist this bearer credential only in storage controlled by the integrating application.
    getSessionToken: () => sessionToken ?? null,
    createSession(): Promise<AnonymousChatSession & { sessionToken: string }> {
      if (pendingCreate) return pendingCreate;
      if (sessionToken) return getSession().then(state => ({ ...state, sessionToken: sessionToken! }));
      pendingCreate = request('session.create', anonymousChatCreatedSessionSchema, {}, true)
        .then(state => { sessionToken = state.sessionToken; return state; })
        .finally(() => { pendingCreate = undefined; });
      return pendingCreate;
    },
    getSession,
    async sendMessage(value: ChatAnonymousSendInput) {
      return request('message.send', chatSendResultSchema, input(chatAnonymousSendInputSchema, value));
    },
    async uploadMedia(value: ChatAnonymousMediaUpload) {
      return request('media.upload', chatAnonymousMediaSchema, input(chatAnonymousMediaUploadSchema, value));
    },
    async readMedia(value: { assetId: string }) {
      return request('media.read', chatAnonymousMediaContentSchema, input(chatAnonymousMediaReadInputSchema, value));
    },
    async listStickers(value: { afterId?: string; limit?: number } = {}) {
      return request('sticker.list', chatAnonymousStickerPageSchema, input(chatAnonymousStickerListInputSchema, value));
    },
    async listMessages(value: ChatListMessagesInput = {}) {
      return request('message.list', chatMessagePageSchema, input(chatListMessagesInputSchema, value));
    },
    async reactToMessage(value: { messageId: string; requestId: string; emoji: string }) {
      return request('message.react', chatReactionResultSchema, input(chatAnonymousReactionInputSchema, value));
    },
    async markRead(value: ChatMarkReadInput) {
      return request('conversation.mark-read', chatReadResultSchema, input(chatMarkReadInputSchema, value));
    },
  };
}

export type AnonymousChatClient = ReturnType<typeof createAnonymousChatClient>;

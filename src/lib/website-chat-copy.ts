import type { ChatVoiceError } from '@soln/chat-ui/voice';

export type WebsiteChatCopy = {
  open: string; close: string; title: string; greeting: string; placeholder: string; send: string;
  timeGreetings: Record<'morning' | 'noon' | 'afternoon' | 'evening', string>;
  loading: string; loadOlder: string; retry: string; startNew: string;
  unavailable: string; loadFailed: string; sendFailed: string; expired: string; ended: string;
  voice: string; location: string; reply: string;
  voicePlayback: Record<'label' | 'loading' | 'failed' | 'play' | 'pause' | 'seek', string>;
  mediaNotAllowed: string; remove: string; download: string; mediaFailed: string; invalidFiles: string; recording: string;
  stopRecording: string; pauseRecording: string; recordingErrors: Record<ChatVoiceError | 'sendFailed', string>;
  deleteRecording: string; requestingMicrophone: string; finishingRecording: string; recordingWaveform: string;
  recordingSeek: string; recordingSeekPosition: string; playRecording: string; previewFailed: string;
  react: string; cancel: string; copy: string; copied: string; copyFailed: string;
  yourself: string; removeReaction: string; reactWith: string; moreReactions: string;
  emoji: string; emojiPicker: {
    search: string; label: string; loading: string; loadFailed: string; retry: string; empty: string;
    categoriesLabel: string; categories: Record<string, string>; select: string;
  };
  handoff: string; showMore: string; collapse: string; attachment: string;
};

export const websiteChatCopy: Record<'en' | 'zh-CN', WebsiteChatCopy> = {
  en: {
    open: 'Chat with us', close: 'Close chat', title: 'Soln support', greeting: 'How can we help?',
    timeGreetings: { morning: 'Hi, good morning! ☀️', noon: 'Hi, good day! 🌞', afternoon: 'Hi, good afternoon! ☕', evening: 'Hi, good evening! 🌙' },
    placeholder: 'Write a message…', send: 'Send', loading: 'Loading conversation',
    loadOlder: 'Load earlier messages',
    retry: 'Retry', startNew: 'New conversation', unavailable: 'Chat is currently unavailable.',
    loadFailed: 'Could not refresh the conversation. Please try again.',
    sendFailed: 'Message not sent. Your text has been kept; please try again.',
    expired: 'This visitor session has expired. Start a new conversation to continue.',
    ended: 'Session ended',
    handoff: 'Your conversation is being transferred. Please wait for the next support member.',
    voice: 'Record a voice message',
    voicePlayback: { label: 'Voice message', loading: 'Loading voice message', failed: 'Could not play voice message. Open audio',
      play: 'Play voice message', pause: 'Pause voice message', seek: 'Voice playback position' },
    location: 'Location', reply: 'Quote', remove: 'Remove', download: 'Download',
    mediaNotAllowed: 'This chat does not allow this media type.',
    mediaFailed: 'Could not load media. Retry', invalidFiles: 'Choose up to 10 nonempty files, at most 16 MB each.',
    recording: 'Recording', stopRecording: 'Finish recording', pauseRecording: 'Pause recording playback',
    deleteRecording: 'Delete recording', requestingMicrophone: 'Requesting microphone access…', finishingRecording: 'Finishing recording…',
    recordingWaveform: 'Live recording waveform', recordingSeek: 'Recording playback position',
    recordingSeekPosition: '{position} of {duration} seconds', playRecording: 'Play recording', previewFailed: 'Could not play the recording. Try again.',
    recordingErrors: {
      unsupported: 'Recording requires HTTPS and a browser that supports microphone recording.',
      permissionDenied: 'Microphone access was denied. Set this site’s microphone permission to Ask or Allow in your browser, then click record again. Also check your system microphone permission.',
      noMicrophone: 'No microphone found. Connect a microphone, then click record again.',
      microphoneBusy: 'The microphone is unavailable. Release it in other apps, then click record again.',
      failed: 'Recording failed. Click record to request the microphone again.',
      tooLarge: 'The recording exceeds 16 MB. Record a shorter message.',
      sendFailed: 'Could not send the recording. Your recording has been kept; please try again.',
    },
    emoji: 'Emoji', emojiPicker: {
      search: 'Search emoji', label: 'Emoji', loading: 'Loading emoji', loadFailed: 'Could not load emoji.',
      retry: 'Retry', empty: 'No emoji found.', categoriesLabel: 'Emoji categories', select: 'Insert {emoji}',
      categories: { smileys: 'Smileys and people', animals: 'Animals and nature', food: 'Food and drink', activities: 'Activities',
        travel: 'Travel and places', objects: 'Objects', symbols: 'Symbols', flags: 'Flags' },
    },
    yourself: 'Yourself', removeReaction: 'Remove {emoji} reaction', reactWith: 'React with {emoji}', moreReactions: 'More reactions',
    react: 'React', cancel: 'Cancel', copy: 'Copy', copied: 'Copied', copyFailed: 'Could not copy. Please try again.',
    showMore: 'Show more', collapse: 'Collapse', attachment: 'Attachment',
  },
  'zh-CN': {
    open: '在线咨询', close: '关闭聊天', title: 'Soln 在线咨询', greeting: '您好！请问有什么可以帮到您？',
    timeGreetings: { morning: 'Hi，早上好！ ☀️', noon: 'Hi，中午好！ 🌞', afternoon: 'Hi，下午好！ ☕', evening: 'Hi，晚上好！ 🌙' },
    placeholder: '输入消息…', send: '发送', loading: '正在加载会话',
    loadOlder: '加载更早的消息', retry: '重试', startNew: '新会话', unavailable: '在线咨询暂时不可用。',
    loadFailed: '会话刷新失败，请重试。', sendFailed: '消息未发送，输入内容已保留，请重试。',
    expired: '游客会话已过期，请开始新会话后继续。', ended: '会话已结束',
    handoff: '会话正在转接，请等待下一位客服接单。', showMore: '显示更多', collapse: '收起',
    voice: '录制语音消息',
    voicePlayback: { label: '语音消息', loading: '正在加载语音', failed: '语音播放失败，打开音频',
      play: '播放语音', pause: '暂停语音', seek: '语音播放位置' },
    location: '位置', reply: '引用', remove: '移除', download: '下载',
    mediaNotAllowed: '当前会话不允许发送该类型的媒体。',
    mediaFailed: '媒体加载失败，点击重试', invalidFiles: '最多选择 10 个非空文件，每个不超过 16 MB。',
    recording: '录音中', stopRecording: '结束录音', pauseRecording: '暂停试听',
    deleteRecording: '删除录音', requestingMicrophone: '正在请求麦克风权限…', finishingRecording: '正在完成录音…',
    recordingWaveform: '实时录音波形', recordingSeek: '录音播放位置', recordingSeekPosition: '{position} / {duration} 秒',
    playRecording: '试听录音', previewFailed: '录音播放失败，请重试。',
    recordingErrors: {
      unsupported: '录音需要通过 HTTPS 打开，并使用支持麦克风录音的浏览器。',
      permissionDenied: '麦克风访问被拒绝。请在浏览器的站点权限中将麦克风设为“询问”或“允许”，再点击录音；也请检查系统麦克风权限。',
      noMicrophone: '未找到麦克风，请连接麦克风后再次点击录音。',
      microphoneBusy: '麦克风暂时不可用，请关闭其他应用对麦克风的占用后再次点击录音。',
      failed: '录音失败，请再次点击录音，重新请求麦克风。',
      tooLarge: '录音超过 16 MB，请缩短录音后重试。',
      sendFailed: '录音发送失败，录音已保留，请重试。',
    },
    emoji: '表情', emojiPicker: {
      search: '搜索表情', label: '表情', loading: '正在加载表情', loadFailed: '表情加载失败。',
      retry: '重试', empty: '未找到表情。', categoriesLabel: '表情分类', select: '插入 {emoji}',
      categories: { smileys: '笑脸与人物', animals: '动物与自然', food: '食物与饮品', activities: '活动',
        travel: '旅行与地点', objects: '物品', symbols: '符号', flags: '旗帜' },
    },
    yourself: '您自己', removeReaction: '删除 {emoji} 回应', reactWith: '回应 {emoji}', moreReactions: '更多表情回应',
    react: '表情回应', cancel: '取消', copy: '复制', copied: '已复制', copyFailed: '复制失败，请重试。',
    attachment: '附件',
  },
};

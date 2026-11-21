export const exampleCopy = {
  en: {
    title: 'Website support chat',
    description: 'Open the button at the bottom right to chat. Configure your tenant runtime origin and guest Entry ID in .env.local, and allow this website origin in your guest configuration.',
  },
  'zh-CN': {
    title: '网站在线咨询示例',
    description: '点击右下角按钮开始聊天。请在 .env.local 配置租户 Runtime 地址和游客入口 ID，并在游客配置中允许当前网站来源。',
  },
};

export function exampleLocale(): keyof typeof exampleCopy {
  const value = process.env.WEBSITE_CHAT_LOCALE || 'en';
  if (value !== 'en' && value !== 'zh-CN') throw new Error('WEBSITE_CHAT_LOCALE_INVALID');
  return value;
}

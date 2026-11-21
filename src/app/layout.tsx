import type { ReactNode } from 'react';
import '@soln/chat-ui/styles.css';
import '@soln/chat-ui/emoji.css';
import '@soln/chat-ui/reactions.css';
import './globals.css';
import { AppMessageProvider } from '@/components/feedback/AppMessageProvider';
import WebsiteChatWidget from '@/components/website-chat/WebsiteChatWidget';
import { getWebsiteChatConfig } from '@/lib/website-chat-config';
import { websiteChatCopy } from '@/lib/website-chat-copy';
import { exampleLocale } from '@/lib/example-copy';

export default function RootLayout({ children }: { children: ReactNode }) {
  const locale = exampleLocale();
  return <html lang={locale}><body><AppMessageProvider>
    {children}
    <WebsiteChatWidget config={getWebsiteChatConfig()} copy={websiteChatCopy[locale]} locale={locale} />
  </AppMessageProvider></body></html>;
}

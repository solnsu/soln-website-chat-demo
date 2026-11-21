import type { NextConfig } from 'next';

const config: NextConfig = {
  devIndicators: false,
  transpilePackages: ['@soln/chat-ui', '@soln/chat-sdk', '@soln/chat-contracts'],
};
export default config;

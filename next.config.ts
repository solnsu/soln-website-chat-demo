import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@soln/chat-ui', '@soln/chat-sdk', '@soln/chat-contracts'],
};
export default config;

# Soln website chat UI example

This standalone Next.js project contains the actual Soln website chat components, shared UI, browser SDK and contracts. The `@soln` packages are included as local npm workspaces; no private npm registry is required. Node.js 22.16+ and npm are required.

```sh
npm install
cp .env.example .env.local
# Edit .env.local, then:
npm run dev
```

Open http://localhost:3008. Configure this exact origin in **Integrations → Apps → Remind → Guest configuration**. Replace `WEBSITE_CHAT_RUNTIME_ORIGIN` and `WEBSITE_CHAT_ENTRY_ID` with your tenant values. Restart development after changing environment variables. Set `WEBSITE_CHAT_LOCALE=zh-CN` for Chinese or `en` for English. These values are public website configuration; do not add member passwords or API keys.

```sh
npm run typecheck
npm run build
npm start
```

Production runs on port 3008; put it behind your HTTPS endpoint and allow that origin in the guest entry. Use HTTPS or localhost for recording and clipboard access. On other devices, localhost means the device itself: use a trusted HTTPS hostname and allow that exact origin.

The included UI matches the website: bottom-right launcher, dark panel, green sent messages, greeting, avatars, quoted replies, right-click reply/copy/reactions, own-reaction deletion, attachments, Unicode emoji and voice recording. Allowed media comes from the entry configuration, not hardcoded tenant settings. This snapshot's UI has no location or catalog-sticker sender; the accompanying documentation and headless example cover those SDK calls. Ending closes only the current round, shown as a centered system message. Either participant can continue with the same identity and history. The visitor credential is saved in this website’s localStorage for up to 30 days. No tenant credentials or local runtime files are included.

To embed it into an existing Next.js site, copy `src/components/website-chat`, `src/components/feedback`, `src/lib/website-chat-*` and `public` assets. Preserve local package sources/dependencies or publish them through your own package workflow. Add the three `@soln/chat-ui` CSS imports and `AppMessageProvider`/`WebsiteChatWidget` from `src/app/layout.tsx`. Merge `@/*`, `transpilePackages` and the shared CSS/feedback styles into your application configuration. The sample page is optional.

On mobile, the launcher opens fullscreen with a top-right close button. The shared mobile composer, recording controls and long-press message menu are included. The attachment action is a transparent circular plus button; when the entry allows no file uploads, it disappears and the input expands left. Keyboard resizing and bottom safe-area spacing are handled by the widget.

# 中文说明

这是包含官网聊天原始 UI 的独立 Next.js 项目，附带共享 UI、浏览器 SDK 和协议源码。本地 npm workspaces 已包含 `@soln` 包，无需访问私有 npm 仓库。使用 Node.js 22.16+，按上方命令安装、复制环境文件后填写租户地址和入口 ID，即可启动。

访问 http://localhost:3008，并在 **集成 → 应用 → 提醒 → 游客配置** 允许这个完整来源。`WEBSITE_CHAT_LOCALE=zh-CN` 使用中文，`en` 使用英文。修改环境文件后重启。线上使用 HTTPS，并把实际域名配置到入口；录音和复制需要浏览器安全上下文。

聊天组件直接取自官网，包含右下角按钮、深色面板、绿色发送气泡、默认问候、头像、引用、右键菜单、回应与删除、附件、Unicode 表情和语音录制。媒体权限跟随入口配置。当前官网 UI 没有位置和系统贴纸发送器，相关 SDK 写法见配套文档和无 UI 示例。结束仅结束本轮，居中显示系统消息；双方仍可在同一身份和历史中继续发送。游客凭证在当前网站的 localStorage 保存，最长有效期 30 天。项目不包含租户凭证、本地环境文件或业务数据。

接入已有 Next.js 站点时，复制上方列出的组件、文案和资源，保留三个共享包及其依赖，合并路径别名、包转译、全局 CSS，并按 `src/app/layout.tsx` 挂载全局提示和聊天入口即可，不必复制示例首页。

移动端点击悬浮按钮后全屏打开，右上角关闭，复用系统移动端输入布局、录音控件和消息长按菜单。附件使用透明底的圆形加号按钮；入口未允许任何文件上传类型时隐藏按钮，输入框向左补满。组件已处理键盘高度变化和底部安全区间距。

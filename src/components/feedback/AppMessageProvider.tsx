'use client';

import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import ExclamationCircleFilled from '@ant-design/icons/ExclamationCircleFilled';
import InfoCircleFilled from '@ant-design/icons/InfoCircleFilled';
import { message } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import React, { createContext, useContext, useMemo } from 'react';

export type AppFeedbackTone = 'success' | 'error' | 'info' | 'warning';
type AppFeedbackKey = string | number;
type AppMessageSurface = 'black' | 'white';
type AppMessageTextTone = 'black' | 'white';

export type AppMessageOpenOptions = {
  tone?: AppFeedbackTone;
  content: unknown;
  duration?: number;
  key?: AppFeedbackKey;
};

export type AppMessageApi = {
  success: (content: unknown) => void;
  error: (content: unknown) => void;
  info: (content: unknown) => void;
  warning: (content: unknown) => void;
  open: (options: AppMessageOpenOptions) => void;
  dismiss: (key: AppFeedbackKey) => void;
  clear: () => void;
};

type AppMessageProviderProps = {
  children: React.ReactNode;
  backgroundTone?: AppMessageSurface;
  textTone?: AppMessageTextTone;
};

const AppMessageContext = createContext<AppMessageApi | null>(null);

const MESSAGE_TOKENS = {
  icon: {
    success: '#299575',
    error: '#b82045',
    info: '#1677ff',
    warning: '#ffc53d',
  },
  surface: {
    black: 'rgba(10, 14, 22, 0.94)',
    white: 'rgba(255, 255, 255, 0.96)',
  },
  border: {
    black: 'rgba(255, 255, 255, 0.12)',
    white: 'rgba(15, 23, 42, 0.08)',
  },
  text: { black: '#000000', white: '#ffffff' },
  shadow: {
    black: '0 18px 40px rgba(0, 0, 0, 0.32)',
    white: '0 18px 40px rgba(15, 23, 42, 0.12)',
  },
} as const;

const MESSAGE_META: Record<AppFeedbackTone, {
  className: string;
  icon: React.ReactNode;
  duration: number;
}> = {
  success: {
    className: 'soln-message soln-message--success',
    icon: <CheckCircleFilled />,
    duration: 2.6,
  },
  error: {
    className: 'soln-message soln-message--error',
    icon: <CloseCircleFilled />,
    duration: 3.4,
  },
  info: {
    className: 'soln-message soln-message--info',
    icon: <InfoCircleFilled />,
    duration: 2.8,
  },
  warning: {
    className: 'soln-message soln-message--warning',
    icon: <ExclamationCircleFilled />,
    duration: 3,
  },
};

function normalizeSingleLineText(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function openAppMessage(
  messageApi: MessageInstance,
  tone: AppFeedbackTone,
  content: unknown,
  backgroundTone: AppMessageSurface,
  textTone: AppMessageTextTone,
  options?: { duration?: number; key?: AppFeedbackKey },
) {
  const normalized = normalizeSingleLineText(content);
  if (!normalized) return;
  const meta = MESSAGE_META[tone];
  messageApi.open({
    type: tone,
    icon: meta.icon,
    classNames: {
      root: meta.className,
      icon: 'soln-message__icon',
      title: 'soln-message__text',
    },
    styles: {
      root: {
        ['--soln-message-background' as string]: MESSAGE_TOKENS.surface[backgroundTone],
        ['--soln-message-border' as string]: MESSAGE_TOKENS.border[backgroundTone],
        ['--soln-message-shadow' as string]: MESSAGE_TOKENS.shadow[backgroundTone],
      },
      icon: { color: MESSAGE_TOKENS.icon[tone] },
      title: { color: MESSAGE_TOKENS.text[textTone] },
    },
    duration: options?.duration ?? meta.duration,
    ...(options?.key !== undefined ? { key: options.key } : {}),
    content: normalized,
  });
}

export function AppMessageProvider({
  children,
  backgroundTone = 'black',
  textTone = 'white',
}: AppMessageProviderProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const value = useMemo<AppMessageApi>(() => {
    const open = (tone: AppFeedbackTone, content: unknown, duration?: number, key?: AppFeedbackKey) => {
      openAppMessage(messageApi, tone, content, backgroundTone, textTone, { duration, key });
    };
    return {
      success: (content) => open('success', content),
      error: (content) => open('error', content),
      info: (content) => open('info', content),
      warning: (content) => open('warning', content),
      open: (options) => open(
        options.tone || 'info', options.content, options.duration, options.key,
      ),
      dismiss: (key) => messageApi.destroy(key),
      clear: () => messageApi.destroy(),
    };
  }, [backgroundTone, messageApi, textTone]);

  return (
    <AppMessageContext.Provider value={value}>
      {contextHolder}
      {children}
    </AppMessageContext.Provider>
  );
}

export function useAppMessage() {
  const value = useContext(AppMessageContext);
  if (!value) throw new Error('APP_MESSAGE_CONTEXT_REQUIRED');
  return value;
}

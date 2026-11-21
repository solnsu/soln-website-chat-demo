import React, { type ComponentProps } from 'react';

export function ChatTextInput({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea {...props} className={['soln-chat-text-input', className].filter(Boolean).join(' ')} />;
}

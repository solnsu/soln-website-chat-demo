'use client';

import React, { useId } from 'react';

export function ChatVoiceWaveform({ bars, progress = 1, hidden = false }: {
  bars: readonly number[]; progress?: number; hidden?: boolean;
}) {
  const progressId = useId();
  const width = bars.length * 4;
  return <svg className="tenant-chat-voice-waveform" viewBox={`0 0 ${width} 24`} preserveAspectRatio="none"
    aria-hidden="true" style={hidden ? { visibility: 'hidden' } : undefined}>
    <defs>
      <linearGradient id={progressId} gradientUnits="userSpaceOnUse" x1="0" x2={width}>
        <stop offset={Math.max(0, progress - 0.006)} stopColor="currentColor" stopOpacity={1} />
        <stop offset={Math.min(1, progress + 0.006)} stopColor="currentColor" stopOpacity={0.35} />
      </linearGradient>
    </defs>
    {bars.map((bar, index) => {
      const height = 2 + bar * 18;
      return <rect key={index} x={index * 4 + 1} y={(24 - height) / 2} width={2} height={height} rx={1}
        fill={`url(#${progressId})`} />;
    })}
  </svg>;
}

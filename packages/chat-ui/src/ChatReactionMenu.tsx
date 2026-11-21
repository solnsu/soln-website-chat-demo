'use client';

import React, { useState, type CSSProperties, type ReactNode } from 'react';
import { theme } from 'antd';
import { LuChevronDown } from 'react-icons/lu';

const QUICK = ['❤️', '👍', '👎', '🔥', '🥰', '👏', '😁'];

export function ChatReactionMenu({ children, selected, disabled, onReact, onClose, renderPicker,
  pickerLabel, moreLabel, reactionLabel, selectedBackground, mobile = false, onExpandMobile }: {
  children: ReactNode; selected: string | null; disabled: boolean; onReact: (emoji: string) => void;
  onClose: () => void; renderPicker: () => ReactNode; pickerLabel: string; moreLabel: string;
  reactionLabel: (emoji: string, selected: boolean) => string; selectedBackground?: string;
  mobile?: boolean; onExpandMobile?: () => void;
}) {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(false);
  return <div className={`tenant-chat-reaction-menu${expanded ? ' tenant-chat-reaction-menu--expanded' : ''}`}
    style={{ '--reaction-bg': token.colorBgContainer, '--reaction-shadow': token.boxShadowSecondary,
      '--reaction-selected-bg': selectedBackground ?? token.colorFillSecondary } as CSSProperties}
    onClick={event => event.stopPropagation()} onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    }}>
    {expanded ? <div className="tenant-chat-reaction-menu__popover" role="dialog" aria-label={moreLabel}>
      {renderPicker()}
    </div> : <>
      <div className="tenant-chat-reaction-menu__picker">
        <div className="tenant-chat-reaction-menu__quick" role="group" aria-label={pickerLabel}>
          {QUICK.map(emoji => <button className="tenant-chat-reaction-menu__emoji" key={emoji} type="button"
            disabled={disabled} aria-pressed={selected === emoji} aria-label={reactionLabel(emoji, selected === emoji)}
            onClick={() => onReact(emoji)}><span className="tenant-chat-reaction-menu__emoji-glyph">{emoji}</span></button>)}
          <button className="tenant-chat-reaction-menu__expand" type="button" aria-haspopup="dialog" aria-expanded={expanded}
            aria-label={moreLabel} onClick={() => mobile ? onExpandMobile?.() : setExpanded(true)}><LuChevronDown size={18} /></button>
        </div>
      </div>
      <div className="tenant-chat-reaction-menu__actions">{children}</div>
    </>}
  </div>;
}

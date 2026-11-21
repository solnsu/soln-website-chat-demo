'use client';

import React, { type CSSProperties, type ReactNode } from "react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa6";

export type ChatMessageBubbleProps = {
  expandLabel: string;
  collapseLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  status?: ReactNode;
  className?: string;
  collapseKey?: React.Key;
  collapsedMaxHeight?: number;
  collapsible?: boolean;
  style?: CSSProperties;
};

export function ChatMessageBubble(props: ChatMessageBubbleProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [shouldCollapse, setShouldCollapse] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const collapsedMaxHeight = props.collapsedMaxHeight ?? 240;

  React.useEffect(() => {
    setExpanded(false);
  }, [props.collapseKey]);

  React.useLayoutEffect(() => {
    if (!props.collapsible) {
      setShouldCollapse(false);
      return undefined;
    }
    const content = contentRef.current;
    if (!content) return undefined;
    const update = () => {
      const overflowing = content.scrollHeight > collapsedMaxHeight + 1;
      setShouldCollapse((current) => current === overflowing ? current : overflowing);
      if (!overflowing) setExpanded(false);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(content);
    return () => observer.disconnect();
  }, [collapsedMaxHeight, props.children, props.collapsible]);

  const content = props.collapsible ? (
    <div
      ref={contentRef}
      className={[
        "tenant-chat-message__collapsible-content",
        shouldCollapse && !expanded ? "is-collapsed" : "",
      ].filter(Boolean).join(" ")}
      style={{
        "--tenant-chat-message-collapsed-max-height": `${collapsedMaxHeight}px`,
      } as React.CSSProperties}
    >
      {props.children}
    </div>
  ) : props.children;

  return (
    <div
      className={["tenant-chat-message__bubble", props.status ? "tenant-chat-message__bubble--with-status" : "", props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
    >
      {content}
      {props.collapsible && shouldCollapse ? (
        <button
          type="button"
          className="tenant-chat-message__content-toggle"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
        >
          <span>
            {expanded ? props.collapseLabel : props.expandLabel}
          </span>
          {expanded ? <FaAngleUp size={13} /> : <FaAngleDown size={13} />}
        </button>
      ) : null}
      {props.footer}
      {props.status ? <div className="tenant-chat-message__indicators">{props.status}</div> : null}
    </div>
  );
}

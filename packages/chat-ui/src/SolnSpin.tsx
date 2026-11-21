'use client';

import { theme } from 'antd';
import React from 'react';

export type SolnSpinProps = {
  centered?: boolean;
  className?: string;
  color?: string;
  label?: string;
  labelColor?: string;
  ownerDocument?: Document;
  size?: number;
  style?: React.CSSProperties;
};

const SOLN_SPIN_STYLE_ID = 'soln-spin-style-ring';
const DEFAULT_SOLN_SPIN_SIZE = 56;
const SOLN_SPIN_ROTATION_DURATION_MS = 500;

const SCREEN_READER_ONLY_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const SOLN_SPIN_STYLE = `
  .soln-spin-root {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .soln-spin-root > .soln-spin-spinner {
    position: relative;
    display: block;
    width: var(--soln-spin-size);
    height: var(--soln-spin-size);
    flex: 0 0 var(--soln-spin-size);
    border-radius: 50%;
    mask-image: radial-gradient(closest-side, transparent 84%, #000 85%);
  }

  .soln-spin-spinner::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image: linear-gradient(0deg, currentColor 0%, transparent 50%);
    animation: soln-spin-ring-rotate .5s linear infinite;
    animation-delay: var(--soln-spin-rotation-delay);
  }

  .soln-spin-label {
    color: var(--soln-spin-label-color);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    text-align: center;
  }

  .soln-spin-root--centered,
  .soln-spin-root--has-label {
    width: var(--soln-spin-size);
    height: var(--soln-spin-size);
    gap: 0;
  }

  .soln-spin-root--has-label > .soln-spin-label {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    width: max-content;
    max-width: min(320px, calc(100vw - 32px));
    transform: translateX(-50%);
    overflow-wrap: anywhere;
  }

  @keyframes soln-spin-ring-rotate {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .soln-spin-spinner::before { animation: none; }
  }
`;

function ensureStyles(targetDocument?: Document) {
  const styleDocument = targetDocument
    ?? (typeof document === 'undefined' ? undefined : document);
  if (!styleDocument) {
    return;
  }

  if (styleDocument.getElementById(SOLN_SPIN_STYLE_ID)) {
    return;
  }

  const styleElement = styleDocument.createElement('style');
  styleElement.id = SOLN_SPIN_STYLE_ID;
  styleElement.textContent = SOLN_SPIN_STYLE;
  styleDocument.head.appendChild(styleElement);
}

export function SolnSpin(props: SolnSpinProps) {
  const { token } = theme.useToken();
  const size = Math.max(1, props.size ?? DEFAULT_SOLN_SPIN_SIZE);
  const accessibleLabel = props.label || 'Loading';
  const [animationTime] = React.useState(() =>
    typeof performance === 'undefined' ? 0 : performance.now(),
  );

  React.useInsertionEffect(() => {
    ensureStyles(props.ownerDocument);
  }, [props.ownerDocument]);

  const content = (
    <span
      className={[
        'soln-spin-root',
        props.centered && 'soln-spin-root--centered',
        props.label && 'soln-spin-root--has-label',
        props.className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-label={accessibleLabel}
      style={{
        '--soln-spin-label-color': props.labelColor || token.colorTextSecondary,
        '--soln-spin-size': `${size}px`,
        color: props.color || token.colorTextBase,
        '--soln-spin-rotation-delay': `${-(animationTime % SOLN_SPIN_ROTATION_DURATION_MS)}ms`,
        ...(props.centered ? {} : props.style),
      } as React.CSSProperties}
    >
      <span className="soln-spin-spinner" aria-hidden="true" />

      {props.label ? (
        <span className="soln-spin-label" aria-hidden="true">
          {props.label}
        </span>
      ) : (
        <span style={SCREEN_READER_ONLY_STYLE}>{accessibleLabel}</span>
      )}
    </span>
  );

  if (!props.centered) {
    return content;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
        height: '100%',
        ...props.style,
      }}
    >
      {content}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { LuImageOff } from 'react-icons/lu';

export function ChatImageContent(props: {
  alt: string;
  failedLabel: string;
  iconSize: number;
  loadingLabel: string;
  src: string | null;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const loaded = Boolean(props.src && loadedSrc === props.src);
  const failed = Boolean(props.src && failedSrc === props.src);

  return (
    <>
      {props.src ? (
        <img
          alt={props.alt}
          className={[
            'tenant-chat-image-content__image',
            loaded ? 'is-loaded' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          src={props.src}
          onError={() => setFailedSrc(props.src)}
          onLoad={() => {
            setFailedSrc(null);
            setLoadedSrc(props.src);
          }}
        />
      ) : null}
      {!loaded ? (
        <span
          aria-label={failed ? props.failedLabel : props.loadingLabel}
          className={[
            'tenant-chat-image-content__placeholder',
            failed ? 'is-failed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role={failed ? 'img' : 'status'}
        >
          {failed ? (
            <span
              aria-hidden="true"
              className="tenant-chat-image-content__failed"
              title={props.failedLabel}
            >
              <LuImageOff size={props.iconSize} />
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );
}

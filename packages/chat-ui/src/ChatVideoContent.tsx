'use client';

import React, { useState } from "react";
import { LuPlay, LuVideoOff } from "react-icons/lu";

export function ChatVideoContent(props: {
  failedLabel: string;
  loadingLabel: string;
  src: string | null;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [intrinsicAspectRatio, setIntrinsicAspectRatio] = useState<
    string | null
  >(null);
  const loaded = Boolean(props.src && loadedSrc === props.src);
  const failed = Boolean(props.src && failedSrc === props.src);
  const markLoaded = () => {
    if (!props.src) return;
    setFailedSrc(null);
    setLoadedSrc(props.src);
  };

  return (
    <span
      className={[
        "tenant-chat-video-content",
        loaded ? "" : "is-loading",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        aspectRatio:
          loaded && intrinsicAspectRatio ? intrinsicAspectRatio : "3 / 4",
      }}
    >
      {props.src ? (
        <video
          aria-hidden="true"
          className={[
            "tenant-chat-video-content__video",
            loaded ? "is-loaded" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disablePictureInPicture
          muted
          playsInline
          preload="auto"
          src={`${props.src}#t=0.001`}
          tabIndex={-1}
          onError={() => setFailedSrc(props.src)}
          onLoadedMetadata={(event) => {
            const { videoHeight, videoWidth } = event.currentTarget;
            if (videoWidth > 0 && videoHeight > 0) {
              setIntrinsicAspectRatio(`${videoWidth} / ${videoHeight}`);
            }
            try {
              event.currentTarget.currentTime = 0.001;
            } catch {
              // The URL fragment already requests the first frame.
            }
            markLoaded();
          }}
          onCanPlay={markLoaded}
          onLoadedData={markLoaded}
          onSeeked={markLoaded}
        />
      ) : null}
      {!loaded ? (
        <span
          aria-label={failed ? props.failedLabel : props.loadingLabel}
          className={[
            "tenant-chat-image-content__placeholder",
            failed ? "is-failed" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role={failed ? "img" : "status"}
        >
          {failed ? (
            <LuVideoOff
              aria-hidden="true"
              className="tenant-chat-video-content__failed"
              size={24}
            />
          ) : null}
        </span>
      ) : null}
      {loaded ? (
        <span aria-hidden="true" className="tenant-chat-video-content__play">
          <LuPlay fill="currentColor" size={22} />
        </span>
      ) : null}
    </span>
  );
}

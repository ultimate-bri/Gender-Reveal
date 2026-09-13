"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FacingMode } from "@/types";

export type CameraErrorKind =
  | "permission-denied"
  | "not-found"
  | "insecure-context"
  | "unsupported"
  | "unknown";

export interface CameraError {
  kind: CameraErrorKind;
  message: string;
}

function classifyError(err: unknown): CameraError {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      return {
        kind: "permission-denied",
        message:
          "Camera access was blocked. Please allow camera permission for this site.",
      };
    }
    if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
      return {
        kind: "not-found",
        message: "No usable camera was found on this device.",
      };
    }
  }
  return {
    kind: "unknown",
    message: "Something went wrong while starting the camera.",
  };
}

/**
 * Manages a getUserMedia camera stream. Access is only ever requested from
 * inside `start()`, which must be called from a user gesture (a click
 * handler) — calling getUserMedia during render/on mount is what makes
 * iOS Safari's permission prompt unreliable.
 */
export function useCamera() {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // A *callback* ref (rather than a plain object ref) so that if a stream
  // was already granted before the <video> element existed — e.g. the user
  // tapped "Start Camera" on the welcome screen, which requests the stream
  // from inside that same click handler for iOS's benefit, before the
  // camera screen's <video> has even mounted — the moment the element does
  // mount it immediately receives the already-live stream.
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []);

  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const attachStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    if (videoElRef.current) {
      videoElRef.current.srcObject = stream;
    }
    setIsReady(true);
  }, []);

  const start = useCallback(
    async (mode: FacingMode = facingMode) => {
      setError(null);
      setIsStarting(true);

      if (typeof window === "undefined" || !window.isSecureContext) {
        setError({
          kind: "insecure-context",
          message: "Camera access requires HTTPS (or localhost) to work.",
        });
        setIsStarting(false);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError({
          kind: "unsupported",
          message: "This browser doesn't support camera capture.",
        });
        setIsStarting(false);
        return;
      }

      stopStream();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
          audio: false,
        });
        attachStream(stream);
        setFacingMode(mode);

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(cams.length > 1);
        } catch {
          // enumerateDevices can fail quietly on some browsers pre-permission;
          // default to showing the flip button rather than hiding a working feature.
        }
      } catch (err) {
        setError(classifyError(err));
      } finally {
        setIsStarting(false);
      }
    },
    [attachStream, facingMode, stopStream]
  );

  const switchCamera = useCallback(() => {
    const next: FacingMode = facingMode === "user" ? "environment" : "user";
    return start(next);
  }, [facingMode, start]);

  useEffect(() => stopStream, [stopStream]);

  return {
    videoRef,
    videoElRef,
    facingMode,
    isReady,
    isStarting,
    error,
    hasMultipleCameras,
    isMirrored: facingMode === "user",
    start,
    switchCamera,
    stop: stopStream,
  };
}

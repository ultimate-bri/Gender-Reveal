"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FacingMode } from "@/lib/types";
import { hasCameraSupport, isSecureContext } from "@/lib/device";

export type CameraStatus = "idle" | "requesting" | "ready" | "error";

export type CameraErrorKind =
  | "not-supported"
  | "insecure-context"
  | "permission-denied"
  | "not-found"
  | "unknown";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: CameraStatus;
  errorKind: CameraErrorKind | null;
  facingMode: FacingMode;
  canSwitchCamera: boolean;
  start: () => Promise<void>;
  stop: () => void;
  switchCamera: () => Promise<void>;
  /** Captures the current frame at the video's native resolution. Returns a JPEG data URL. */
  capturePhoto: () => string | null;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorKind, setErrorKind] = useState<CameraErrorKind | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [canSwitchCamera, setCanSwitchCamera] = useState(true);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!isSecureContext()) {
      setStatus("error");
      setErrorKind("insecure-context");
      return;
    }
    if (!hasCameraSupport()) {
      setStatus("error");
      setErrorKind("not-supported");
      return;
    }

    setStatus("requesting");
    setErrorKind(null);

    // Stop any existing stream before requesting a new one (e.g. camera switch)
    stop();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          /* autoplay can reject before user gesture on some browsers; ignore */
        });
      }
      setStatus("ready");

      // Determine whether more than one camera exists, for the switch button
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setCanSwitchCamera(videoInputs.length > 1);
      } catch {
        setCanSwitchCamera(true);
      }
    } catch (err) {
      setStatus("error");
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "SecurityError") {
          setErrorKind("permission-denied");
        } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
          setErrorKind("not-found");
        } else {
          setErrorKind("unknown");
        }
      } else {
        setErrorKind("unknown");
      }
    }
  }, [facingMode, stop]);

  const switchCamera = useCallback(async () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Re-acquire the stream whenever facingMode changes (after the first start)
  useEffect(() => {
    if (status === "ready" || status === "requesting") {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Always clean up the MediaStream on unmount
  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;

    // CRITICAL: capture at the video's INTRINSIC resolution, never the
    // CSS/display size, so the photo isn't blurry or misaligned.
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Mirror the image horizontally when using the front camera so the
    // photo matches what the user saw in the (mirrored) preview.
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.95);
  }, [facingMode]);

  return {
    videoRef,
    status,
    errorKind,
    facingMode,
    canSwitchCamera,
    start,
    stop,
    switchCamera,
    capturePhoto,
  };
}

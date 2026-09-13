"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { useCamera } from "@/lib/useCamera";
import { composePhoto } from "@/lib/compositor";
import { preloadDecorations } from "@/lib/chromaKey";
import { THEMES, allDecorationSources } from "@/lib/decorations";
import type { CapturedPhoto, Theme } from "@/types";
import styles from "./CameraScreen.module.css";

interface Props {
  camera: ReturnType<typeof useCamera>;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onCaptured: (photo: CapturedPhoto) => void;
  onExit: () => void;
}

const COUNTDOWN_SECONDS = 3;

export default function CameraScreen({
  camera,
  theme,
  onThemeChange,
  onCaptured,
  onExit,
}: Props) {
  const {
    videoRef,
    videoElRef,
    isReady,
    isStarting,
    error,
    hasMultipleCameras,
    isMirrored,
    start,
    switchCamera,
  } = camera;

  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackImgRef = useRef<HTMLImageElement | null>(null);
  const [fallbackImageSrc, setFallbackImageSrc] = useState<string | null>(null);

  // Warm the chroma-key cache for the current theme's stickers as soon as
  // we land here, so the first shutter press doesn't stall on image work.
  useEffect(() => {
    preloadDecorations(allDecorationSources());
  }, []);

  // If we arrive here without a live stream and without a prior fatal
  // error (e.g. direct navigation, or a retry), attempt to start.
  useEffect(() => {
    if (!isReady && !isStarting && !error && !fallbackImageSrc) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCaptureSequence = useCallback(
    async (source: HTMLVideoElement | HTMLImageElement, mirrored: boolean) => {
      setIsCapturing(true);
      for (let n = COUNTDOWN_SECONDS; n >= 1; n -= 1) {
        setCount(n);
        await new Promise((r) => setTimeout(r, 700));
      }
      setCount(null);
      setFlash(true);
      setTimeout(() => setFlash(false), 260);

      try {
        const photo = await composePhoto({
          source,
          theme: THEMES[theme],
          mirrored,
        });
        onCaptured(photo);
      } catch (err) {
        console.error("Failed to compose photo", err);
        setIsCapturing(false);
      }
    },
    [onCaptured, theme]
  );

  const handleShutter = useCallback(() => {
    if (isCapturing) return;
    if (fallbackImageSrc && fallbackImgRef.current) {
      runCaptureSequence(fallbackImgRef.current, false);
      return;
    }
    if (videoElRef.current && isReady) {
      runCaptureSequence(videoElRef.current, isMirrored);
    }
  }, [fallbackImageSrc, isCapturing, isMirrored, isReady, runCaptureSequence, videoElRef]);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setFallbackImageSrc(url);
    },
    []
  );

  const showFileFallback = error?.kind === "not-found";
  const showRetry =
    error?.kind === "permission-denied" ||
    error?.kind === "unknown" ||
    error?.kind === "insecure-context";

  return (
    <div className={styles.screen}>
      <div className={styles.previewWrap}>
        {fallbackImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={fallbackImgRef}
            src={fallbackImageSrc}
            alt="Selected photo"
            className={styles.fallbackImage}
          />
        ) : (
          <video
            ref={videoRef}
            className={styles.video}
            style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
            autoPlay
            playsInline
            muted
          />
        )}

        {!isReady && !fallbackImageSrc && !error && (
          <div className={styles.centerMessage}>
            <div className={styles.spinner} aria-hidden />
            <p>Starting camera…</p>
          </div>
        )}

        {error && !showFileFallback && (
          <div className={styles.centerMessage}>
            <p className={styles.errorTitle}>Camera unavailable</p>
            <p className={styles.errorBody}>{error.message}</p>
            {error.kind === "permission-denied" && (
              <p className={styles.errorHint}>
                Check your browser&rsquo;s site settings and allow camera access
                for this page, then try again.
              </p>
            )}
            {showRetry && (
              <button className={styles.retryButton} onClick={() => start()}>
                Try again
              </button>
            )}
          </div>
        )}

        {showFileFallback && !fallbackImageSrc && (
          <div className={styles.centerMessage}>
            <p className={styles.errorTitle}>No camera found</p>
            <p className={styles.errorBody}>
              No worries — pick or take a photo instead.
            </p>
            <button
              className={styles.retryButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Photo
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className={styles.hiddenInput}
          onChange={handleFileSelected}
        />

        {flash && <div className={styles.flash} />}
        {count !== null && (
          <div className={styles.countdown} key={count}>
            {count}
          </div>
        )}

        <button className={styles.exitButton} onClick={onExit} aria-label="Exit to welcome screen">
          ✕
        </button>

        {hasMultipleCameras && !fallbackImageSrc && (
          <button
            className={styles.flipButton}
            onClick={switchCamera}
            aria-label="Switch camera"
            disabled={isCapturing}
          >
            ↺
          </button>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.themeRow} role="radiogroup" aria-label="Choose a team">
          {(Object.values(THEMES)).map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={theme === t.id}
              className={`${styles.themeChip} ${theme === t.id ? styles.themeChipActive : ""}`}
              style={{
                // @ts-expect-error CSS custom property
                "--chip-accent": t.accent,
                "--chip-accent-dark": t.accentDark,
              }}
              onClick={() => onThemeChange(t.id)}
              disabled={isCapturing}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          className={styles.shutter}
          onClick={handleShutter}
          disabled={isCapturing || (!isReady && !fallbackImageSrc)}
          aria-label="Take photo"
        >
          <span className={styles.shutterInner} />
        </button>
      </div>
    </div>
  );
}

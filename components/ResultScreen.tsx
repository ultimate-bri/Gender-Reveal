"use client";

import { useMemo, useState } from "react";
import { detectSaveMethod, savePhoto } from "@/lib/saveShare";
import { THEMES } from "@/lib/decorations";
import type { CapturedPhoto } from "@/types";
import styles from "./ResultScreen.module.css";

interface Props {
  photo: CapturedPhoto;
  onRetake: () => void;
  onDone: () => void;
}

type Status = "idle" | "working" | "done" | "error";

const ACTION_LABEL: Record<ReturnType<typeof detectSaveMethod>, string> = {
  filesystem: "Save Photo",
  share: "Share Photo",
  download: "Download Photo",
};

const SUCCESS_MESSAGE: Record<ReturnType<typeof detectSaveMethod>, string> = {
  filesystem: "Saved to your GenderReveal folder!",
  share: "Shared!",
  download: "Downloaded!",
};

export default function ResultScreen({ photo, onRetake, onDone }: Props) {
  const theme = THEMES[photo.theme];
  const method = useMemo(() => detectSaveMethod(), []);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus("working");
    setMessage(null);
    try {
      const result = await savePhoto(photo.blob, photo.theme, photo.createdAt);
      setStatus("done");
      setMessage(SUCCESS_MESSAGE[result.method]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
      setMessage("Couldn't save that — please try again.");
    }
  };

  return (
    <div
      className={styles.screen}
      style={{
        // @ts-expect-error CSS custom property
        "--accent": theme.accent,
        "--accent-dark": theme.accentDark,
        "--accent-soft": theme.accentSoft,
      }}
    >
      <button className={styles.exitButton} onClick={onDone} aria-label="Back to start">
        ✕
      </button>

      <div className={styles.photoWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.dataUrl} alt="Your gender reveal photobooth picture" className={styles.photo} />
      </div>

      <div className={styles.controls}>
        {message && (
          <p className={status === "error" ? styles.errorMessage : styles.statusMessage}>
            {message}
          </p>
        )}
        <div className={styles.buttonRow}>
          <button className={styles.retakeButton} onClick={onRetake} disabled={status === "working"}>
            Retake
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={status === "working"}
          >
            {status === "working" ? "Working…" : ACTION_LABEL[method]}
          </button>
        </div>
      </div>
    </div>
  );
}

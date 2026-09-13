"use client";

import ChromaKeyedImage from "./ChromaKeyedImage";
import { THEMES } from "@/lib/decorations";
import type { Theme } from "@/types";
import styles from "./WelcomeScreen.module.css";

interface Props {
  onStart: () => void | Promise<void>;
  isStarting: boolean;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export default function WelcomeScreen({
  onStart,
  isStarting,
  theme,
  onThemeChange,
}: Props) {
  return (
    <div className={styles.screen}>
      <div className={styles.decorTopLeft}>
        <ChromaKeyedImage src="/decorations/flowers-red.jpg" alt="" />
      </div>
      <div className={styles.decorTopRight}>
        <ChromaKeyedImage src="/decorations/flower-green.jpg" alt="" />
      </div>
      <div className={styles.decorBottomLeft}>
        <ChromaKeyedImage src="/decorations/balloon-dog.jpg" alt="" />
      </div>
      <div className={styles.decorBottomRight}>
        <ChromaKeyedImage src="/decorations/onesies.jpg" alt="" />
      </div>

      <div className={styles.content}>
        <div className={styles.balloonWrap}>
          <ChromaKeyedImage src="/decorations/question-balloon.jpg" alt="Mystery balloon" />
        </div>

        <h1 className={styles.title}>Gender Reveal Photobooth</h1>
        <p className={styles.subtitle}>
          Pick a team, strike a pose, and help us capture the moment.
        </p>

        <div
          className={styles.themeRow}
          role="radiogroup"
          aria-label="Choose a team"
        >
          {Object.values(THEMES).map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={theme === t.id}
              className={`${styles.themeChip} ${
                theme === t.id ? styles.themeChipActive : ""
              }`}
              style={{
                // @ts-expect-error CSS custom property
                "--chip-accent": t.accent,
                "--chip-accent-dark": t.accentDark,
              }}
              onClick={() => onThemeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          className={styles.startButton}
          onClick={onStart}
          disabled={isStarting}
        >
          {isStarting ? "Opening camera…" : "Start Camera"}
        </button>

        <p className={styles.hint}>We&rsquo;ll ask to use your camera next.</p>
      </div>
    </div>
  );
}

"use client";

import ChromaKeyedImage from "./ChromaKeyedImage";
import styles from "./WelcomeScreen.module.css";

interface Props {
  onStart: () => void | Promise<void>;
  isStarting: boolean;
}

export default function WelcomeScreen({ onStart, isStarting }: Props) {
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

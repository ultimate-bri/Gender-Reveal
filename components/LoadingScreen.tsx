import styles from "./LoadingScreen.module.css";

/**
 * Shown for the brief window between page mount and the app actually being
 * ready to use — while fonts finish loading and every decoration sticker
 * has been fetched and chroma-keyed once (see the preload call in
 * app/page.tsx). Without this, the very first theme pick or shutter press
 * could stall for that same work instead, which is what used to make the
 * app feel like it was hanging.
 */
export default function LoadingScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.spinner} aria-hidden />
      <h1 className={styles.title}>Gender Reveal Photobooth</h1>
      <p className={styles.subtitle}>Getting things ready&hellip;</p>
    </div>
  );
}

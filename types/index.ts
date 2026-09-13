export type Theme = "boy" | "girl";

export type Screen = "welcome" | "camera" | "result";

export type FacingMode = "user" | "environment";

/** A single decoration image stamped onto the final photo. */
export interface DecorationLayer {
  /** Path under /public used to load + chroma-key the source art. */
  src: string;
  /** Position + size expressed as a fraction of the canvas (0–1), so the
   *  same layout scales to any capture resolution. Anchored top-left. */
  x: number;
  y: number;
  width: number;
  /** Height is derived from the source aspect ratio unless provided. */
  height?: number;
  rotationDeg?: number;
  /** Higher draws on top. */
  z?: number;
  /** Mirror horizontally — handy for reusing one asset on both sides of a frame. */
  flip?: boolean;
  opacity?: number;
}

export interface ThemeConfig {
  id: Theme;
  label: string;
  /** Primary accent used for chips, borders, buttons, and captured-photo text. */
  accent: string;
  accentDark: string;
  accentSoft: string;
  /** Second title-word color ("Reveal!") — the other team's accent, for the
   *  two-tone "Gender / Reveal!" logotype. */
  contrastDark: string;
  frameLabel: string;
  decorations: DecorationLayer[];
}

export interface CapturedPhoto {
  blob: Blob;
  dataUrl: string;
  theme: Theme;
  createdAt: number;
}

/** Number of individual photos captured into one vertical strip. */
export const SHOT_COUNT = 3;

export type SaveMethod = "filesystem" | "share" | "download";

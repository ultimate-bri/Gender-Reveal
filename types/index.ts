export type Theme = "boy" | "girl";

export type Screen = "loading" | "welcome" | "camera" | "result";

export type FacingMode = "user" | "environment";

/** Named reference points derived from the strip's actual slot geometry
 *  (computed in the compositor), rather than raw canvas fractions. This is
 *  what keeps stickers glued to "the corner of photo 1" or "the seam
 *  between photo 2 and 3" even if slot size/spacing ever changes. */
export type DecorationAnchor =
  | "top-left"
  | "top-right"
  | "top-center"
  | "seam1-left"
  | "seam1-right"
  | "seam1-center"
  | "seam2-left"
  | "seam2-right"
  | "seam2-center"
  | "bottom-left"
  | "bottom-right";

/** A single decoration image stamped onto the final strip. */
export interface DecorationLayer {
  /** Path under /public used to load + chroma-key the source art. */
  src: string;
  /** Geometric reference point the sticker is centered on. */
  anchor: DecorationAnchor;
  /** Fine-tune nudges in px, relative to the anchor point (1080-wide canvas). */
  offsetX?: number;
  offsetY?: number;
  /** Sticker width as a fraction of canvas width. Height follows the
   *  source image's aspect ratio unless overridden. */
  width: number;
  height?: number;
  /** Crop a rectangular slice out of the source image before drawing it —
   *  fractions (0-1) of the source's natural width/height. Defaults to
   *  the full image (cropX/cropY 0, cropWidth/cropHeight 1). Lets one
   *  wide asset (e.g. two onesies side by side on one clothesline) serve
   *  as two separate, tightly-cropped stickers — one per theme — without
   *  needing two separate files. */
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  rotationDeg?: number;
  /** Higher draws on top. */
  z?: number;
  /** Mirror horizontally — handy for reusing one asset on both sides. */
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

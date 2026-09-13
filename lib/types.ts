export type Gender = "girl" | "boy";

export type FlowStep = "welcome" | "camera" | "review";

export type FacingMode = "user" | "environment";

/** A single captured photo, stored as a data URL (JPEG). */
export interface CapturedPhoto {
  id: string;
  dataUrl: string;
}

/** Normalized (0-1) rectangle describing a photo window inside a frame image. */
export interface WindowRect {
  /** left edge, 0-1 of frame width */
  x: number;
  /** top edge, 0-1 of frame height */
  y: number;
  /** width, 0-1 of frame width */
  width: number;
  /** height, 0-1 of frame height */
  height: number;
}

/**
 * A decorative sticker that sits ON TOP of the composited photos + frame.
 * These exist because the frame artwork has decorations (rainbows,
 * flowers, balloons, etc.) that visually sit right at the edge of a
 * photo window. Since the frame's own artwork gets clipped wherever it
 * overlaps a window (to let the photo show through), those decorations
 * would otherwise look cut off / "overshadowed" once a photo fills the
 * window. Drawing the full sticker again afterwards, on top of
 * everything, restores them completely.
 *
 * `box` is a normalized (0-1) bounding rectangle (relative to the
 * canvas). The sticker's own aspect ratio is preserved and it is
 * fit ("contain") and centered within that box.
 */
export interface StickerPlacement {
  /** Path to the transparent sticker PNG, relative to /public */
  src: string;
  box: WindowRect;
}

export interface FrameConfig {
  id: Gender;
  label: string;
  /** Path to the transparent-window frame PNG, relative to /public */
  src: string;
  /** Output canvas size the frame image was designed for */
  canvasWidth: number;
  canvasHeight: number;
  /** The 3 photo windows, in capture order (top to bottom) */
  windows: [WindowRect, WindowRect, WindowRect];
  /** Decorative stickers redrawn on top so they never get overshadowed */
  stickers: StickerPlacement[];
}

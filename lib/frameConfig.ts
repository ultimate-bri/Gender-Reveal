import { FrameConfig, Gender, StickerPlacement, WindowRect } from "./types";

/**
 * ------------------------------------------------------------------
 * FRAME WINDOW COORDINATES
 * ------------------------------------------------------------------
 * These were measured directly off the supplied template artwork
 * (normalized 0-1, relative to the frame image's own width/height),
 * so they line up whether you render the strip at 1200x3600 or any
 * other multiple of the 1:3 aspect ratio.
 *
 * If you swap in your own frame PNG, tweak these four numbers per
 * window until the live preview lines up with your artwork:
 *   x, y      -> top-left corner of the photo window
 *   width     -> how wide the window is
 *   height    -> how tall the window is
 *
 * All three windows currently share the same x/width (the frame's
 * artwork lines the windows up in a single column) - only y/height
 * change per window. Edit freely if your frame differs.
 * ------------------------------------------------------------------
 */
const WINDOW_X = 0.08;
const WINDOW_WIDTH = 0.84;

const SHARED_WINDOWS: [WindowRect, WindowRect, WindowRect] = [
  { x: WINDOW_X, y: 0.125, width: WINDOW_WIDTH, height: 0.245 },
  { x: WINDOW_X, y: 0.405, width: WINDOW_WIDTH, height: 0.235 },
  { x: WINDOW_X, y: 0.64, width: WINDOW_WIDTH, height: 0.235 },
];

// Strip render size. Kept at a 1:3 ratio (2:6) for print-quality output.
export const STRIP_WIDTH = 1200;
export const STRIP_HEIGHT = 3600;

/**
 * ------------------------------------------------------------------
 * STICKER OVERLAYS
 * ------------------------------------------------------------------
 * The frame PNGs have decorations (rainbows, flowers, balloons...)
 * drawn right at the edge of a photo window. Anywhere that artwork
 * overlaps a window, it was cut to transparent so the photo can show
 * through - which means once a real photo fills that window, the
 * decoration next to it looks chopped off/overshadowed.
 *
 * These sticker entries redraw the *full* decoration on top of the
 * finished photo+frame composite, at the same spot, so nothing looks
 * clipped no matter what photo is behind it. Coordinates below were
 * measured directly off each frame PNG (normalized 0-1) so the
 * sticker's bounding box lines up with where the clipped artwork
 * actually sits.
 * ------------------------------------------------------------------
 */
const GIRL_STICKERS: StickerPlacement[] = [
  // Rainbow tucked into the gap between windows 1 & 2 (left side)
  { src: "/stickers/rainbow.png", box: { x: 0.0167, y: 0.3583, width: 0.2833, height: 0.05 } },
  // Pink & blue onesies hanging in the same gap (right side)
  { src: "/stickers/onesies.png", box: { x: 0.6583, y: 0.3583, width: 0.3, height: 0.05 } },
  // Small flower peeking through the thin strip between windows 2 & 3
  { src: "/stickers/flower-green.png", box: { x: -0.0333, y: 0.5986, width: 0.1917, height: 0.0597 } },
  // Red flower duo at window 3's bottom-left corner
  { src: "/stickers/red-flowers.png", box: { x: -0.0083, y: 0.7972, width: 0.2, height: 0.0833 } },
  // Cream "?" balloon at window 3's bottom-right corner
  { src: "/stickers/qmark-balloon.png", box: { x: 0.6583, y: 0.8194, width: 0.2917, height: 0.1333 } },
];

const BOY_STICKERS: StickerPlacement[] = [
  // Balloon-animal poodle spanning the gap between windows 1 & 2 (right side)
  { src: "/stickers/balloon-dog.png", box: { x: 0.6417, y: 0.3111, width: 0.35, height: 0.0972 } },
  // Mushrooms tucked into window 3's bottom-left corner
  { src: "/stickers/mushrooms.png", box: { x: -0.025, y: 0.7944, width: 0.1917, height: 0.0833 } },
  // Pink/blue "?" with ribbon bows at window 3's bottom-right corner
  { src: "/stickers/qmark-bows.png", box: { x: 0.5917, y: 0.8528, width: 0.3833, height: 0.1083 } },
];

export const FRAMES: Record<Gender, FrameConfig> = {
  girl: {
    id: "girl",
    label: "It's a Girl!",
    src: "/frames/pink-frame.png",
    canvasWidth: STRIP_WIDTH,
    canvasHeight: STRIP_HEIGHT,
    windows: SHARED_WINDOWS,
    stickers: GIRL_STICKERS,
  },
  boy: {
    id: "boy",
    label: "It's a Boy!",
    src: "/frames/blue-frame.png",
    canvasWidth: STRIP_WIDTH,
    canvasHeight: STRIP_HEIGHT,
    windows: SHARED_WINDOWS,
    stickers: BOY_STICKERS,
  },
};

export function getFrameConfig(gender: Gender): FrameConfig {
  return FRAMES[gender];
}

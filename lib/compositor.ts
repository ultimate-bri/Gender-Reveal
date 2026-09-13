import { getKeyedImage } from "./chromaKey";
import type { CapturedPhoto, DecorationAnchor, ThemeConfig } from "@/types";

/** Fixed strip width. Using a constant target (rather than the raw,
 *  device-dependent video resolution) keeps sticker layout, text size, and
 *  crop framing identical across every phone and browser. */
export const OUTPUT_WIDTH = 1080;

const TOP_BORDER_H = 56;
const HEADER_H = 190;
const SIDE_MARGIN = 46;
const SLOT_GAP = 26;
const FOOTER_H = 150;
const BOTTOM_BORDER_H = 64;
const SLOT_COUNT = 3;

/** Photos are square, so the whole strip's height falls out of the width
 *  instead of being picked independently — one less number to keep in sync. */
const SLOT_SIZE = OUTPUT_WIDTH - SIDE_MARGIN * 2;
const SLOTS_TOP = TOP_BORDER_H + HEADER_H;

export const OUTPUT_HEIGHT =
  SLOTS_TOP +
  SLOT_SIZE * SLOT_COUNT +
  SLOT_GAP * (SLOT_COUNT - 1) +
  FOOTER_H +
  BOTTOM_BORDER_H;

/** Pixel rect for photo slot `i` (0-based) on the strip canvas. Always
 *  square — that's the "squared photo" the frame is built around. */
export function getSlotRect(i: number) {
  return {
    x: SIDE_MARGIN,
    y: SLOTS_TOP + i * (SLOT_SIZE + SLOT_GAP),
    width: SLOT_SIZE,
    height: SLOT_SIZE,
  };
}

const SLOT_RECTS = [getSlotRect(0), getSlotRect(1), getSlotRect(2)];

/** Resolves a named anchor to a pixel point using the actual slot geometry,
 *  so a sticker pinned to "the seam between photo 1 and 2" stays glued
 *  there even if slot size/spacing changes later. */
function anchorPoint(anchor: DecorationAnchor): { x: number; y: number } {
  const [s0, s1, s2] = SLOT_RECTS;
  switch (anchor) {
    case "top-left":
      return { x: s0.x, y: s0.y };
    case "top-right":
      return { x: s0.x + s0.width, y: s0.y };
    case "top-center":
      return { x: s0.x + s0.width / 2, y: s0.y };
    case "seam1-left":
      return { x: s0.x, y: (s0.y + s0.height + s1.y) / 2 };
    case "seam1-right":
      return { x: s0.x + s0.width, y: (s0.y + s0.height + s1.y) / 2 };
    case "seam1-center":
      return { x: s0.x + s0.width / 2, y: (s0.y + s0.height + s1.y) / 2 };
    case "seam2-left":
      return { x: s1.x, y: (s1.y + s1.height + s2.y) / 2 };
    case "seam2-right":
      return { x: s1.x + s1.width, y: (s1.y + s1.height + s2.y) / 2 };
    case "seam2-center":
      return { x: s1.x + s1.width / 2, y: (s1.y + s1.height + s2.y) / 2 };
    case "bottom-left":
      return { x: s2.x, y: s2.y + s2.height };
    case "bottom-right":
      return { x: s2.x + s2.width, y: s2.y + s2.height };
    default:
      return { x: 0, y: 0 };
  }
}

async function ensureFontLoaded() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load("700 64px 'Baloo 2'"),
      document.fonts.load("600 34px 'Baloo 2'"),
      document.fonts.load("italic 600 36px 'Baloo 2'"),
    ]);
  } catch {
    // If the font API throws (rare, older browsers), we still draw with
    // whatever fallback font is active rather than blocking capture.
  }
}

/** Computes a "cover" crop rectangle so the source fills the target
 *  rectangle without distortion, matching object-fit: cover behavior. */
function coverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
  } else {
    cropHeight = sourceWidth / targetRatio;
  }

  const cropX = (sourceWidth - cropWidth) / 2;
  const cropY = (sourceHeight - cropHeight) / 2;

  return { cropX, cropY, cropWidth, cropHeight };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/** Cloud-scallop border band: a row of overlapping circles, like a printed
 *  strip's die-cut edge. Cheap to draw — no images involved. */
function drawScallopBand(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  facingDown: boolean
) {
  const bumpWidth = 96;
  const count = Math.ceil(OUTPUT_WIDTH / bumpWidth) + 1;
  ctx.save();
  ctx.fillStyle = "#fdf3e3";
  ctx.strokeStyle = "#3a2e2a";
  ctx.lineWidth = 3;
  const centerY = facingDown ? y : y + height;
  ctx.beginPath();
  for (let i = 0; i < count; i += 1) {
    const cx = i * bumpWidth;
    ctx.moveTo(cx + bumpWidth, centerY);
    ctx.arc(cx + bumpWidth / 2, centerY, bumpWidth / 2, 0, Math.PI * 2);
  }
  // Fill the rectangular body between the bumps and the canvas edge too.
  if (facingDown) {
    ctx.rect(0, y, OUTPUT_WIDTH, height / 2);
  } else {
    ctx.rect(0, y + height / 2, OUTPUT_WIDTH, height / 2);
  }
  ctx.fill("evenodd");
  ctx.restore();
}

export type PhotoSource = HTMLVideoElement | HTMLImageElement;

function isVideoSource(source: PhotoSource): source is HTMLVideoElement {
  return "videoWidth" in source;
}

/**
 * Snapshots one frame from the live video (or fallback <img>) straight into
 * a square canvas, cropped/mirrored to match the on-screen preview. Called
 * once per shot, immediately, so each of the 3 poses in a strip is the
 * frame that was live *at that moment* — not whatever the video happens to
 * show later when the strip is assembled.
 */
export function captureFrame(
  source: PhotoSource,
  mirrored: boolean
): HTMLCanvasElement {
  const sourceWidth = isVideoSource(source)
    ? source.videoWidth
    : source.naturalWidth;
  const sourceHeight = isVideoSource(source)
    ? source.videoHeight
    : source.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = SLOT_SIZE;
  canvas.height = SLOT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const { cropX, cropY, cropWidth, cropHeight } = coverCrop(
    sourceWidth,
    sourceHeight,
    SLOT_SIZE,
    SLOT_SIZE
  );

  ctx.save();
  if (mirrored) {
    ctx.translate(SLOT_SIZE, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    source,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    SLOT_SIZE,
    SLOT_SIZE
  );
  ctx.restore();

  return canvas;
}

export interface ComposeStripOptions {
  /** One pre-captured frame per photo slot, in order, top to bottom. */
  frames: HTMLCanvasElement[];
  theme: ThemeConfig;
}

export async function composeStrip({
  frames,
  theme,
}: ComposeStripOptions): Promise<CapturedPhoto> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  await ensureFontLoaded();

  // 1. Solid theme-color background — this doubles as the strip's border.
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  // 2. Cream cloud-scallop bands top and bottom, like a die-cut strip edge.
  drawScallopBand(ctx, 0, TOP_BORDER_H, true);
  drawScallopBand(ctx, OUTPUT_HEIGHT - BOTTOM_BORDER_H, BOTTOM_BORDER_H, false);

  // 3. Two-tone "Gender / Reveal!" title.
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.accentDark;
  ctx.font = "700 96px 'Baloo 2', sans-serif";
  ctx.fillText("Gender", OUTPUT_WIDTH / 2, TOP_BORDER_H + 92);
  ctx.fillStyle = theme.contrastDark;
  ctx.font = "italic 700 82px 'Baloo 2', sans-serif";
  ctx.fillText("Reveal!", OUTPUT_WIDTH / 2, TOP_BORDER_H + 170);
  ctx.restore();

  // 4. Photo slots — white rounded frame + the captured (square) shot inside.
  for (let i = 0; i < SLOT_COUNT; i += 1) {
    const { x, y, width, height } = SLOT_RECTS[i];
    const frame = frames[i];

    ctx.save();
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, x - 8, y - 8, width + 16, height + 16, 22);
    ctx.fill();
    ctx.restore();

    if (frame) {
      ctx.save();
      drawRoundedRect(ctx, x, y, width, height, 16);
      ctx.clip();
      ctx.drawImage(frame, x, y, width, height);
      ctx.restore();
    }
  }

  // 5. Theme stickers, chroma-keyed to remove their green backdrop, pinned
  //    to named geometry anchors (corners/seams) so they never double up.
  const layers = [...theme.decorations].sort(
    (a, b) => (a.z ?? 0) - (b.z ?? 0)
  );

  for (const layer of layers) {
    try {
      const keyed = await getKeyedImage(layer.src);

      // Optional crop rectangle (fractions of the source's natural size) —
      // e.g. pulling just the pink or just the blue onesie out of one
      // shared clothesline image instead of drawing both halves.
      const cropXFrac = layer.cropX ?? 0;
      const cropYFrac = layer.cropY ?? 0;
      const cropWidthFrac = layer.cropWidth ?? 1;
      const cropHeightFrac = layer.cropHeight ?? 1;
      const sourceX = cropXFrac * keyed.width;
      const sourceY = cropYFrac * keyed.height;
      const sourceWidth = cropWidthFrac * keyed.width;
      const sourceHeight = cropHeightFrac * keyed.height;

      const drawWidth = layer.width * OUTPUT_WIDTH;
      const aspect = sourceHeight / sourceWidth;
      const drawHeight = layer.height
        ? layer.height * OUTPUT_HEIGHT
        : drawWidth * aspect;

      const anchor = anchorPoint(layer.anchor);
      const centerX = anchor.x + (layer.offsetX ?? 0);
      const centerY = anchor.y + (layer.offsetY ?? 0);

      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;
      ctx.translate(centerX, centerY);
      if (layer.rotationDeg) {
        ctx.rotate((layer.rotationDeg * Math.PI) / 180);
      }
      if (layer.flip) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        keyed.canvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();
    } catch {
      // A single missing/broken sticker shouldn't tank the whole strip —
      // skip it and keep compositing the rest.
    }
  }

  // 6. "Thank you" footer.
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fdf3e3";
  ctx.font = "700 46px 'Baloo 2', sans-serif";
  ctx.fillText(
    "Thank You for Coming!",
    OUTPUT_WIDTH / 2,
    OUTPUT_HEIGHT - BOTTOM_BORDER_H - 78
  );
  ctx.font = "italic 600 36px 'Baloo 2', sans-serif";
  ctx.fillText(
    "\u2013 Mommy She & Daddy Bri",
    OUTPUT_WIDTH / 2,
    OUTPUT_HEIGHT - BOTTOM_BORDER_H - 24
  );
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/png");
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Failed to encode photo"));
    }, "image/png");
  });

  return {
    blob,
    dataUrl,
    theme: theme.id,
    createdAt: Date.now(),
  };
}

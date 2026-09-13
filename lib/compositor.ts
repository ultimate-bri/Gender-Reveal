import { getKeyedImage } from "./chromaKey";
import type { CapturedPhoto, ThemeConfig } from "@/types";

/** Fixed portrait strip size. Using a constant target (rather than the raw,
 *  device-dependent video resolution) keeps sticker layout, text size, and
 *  the crop framing identical across every phone and browser. */
export const OUTPUT_WIDTH = 1080;
export const OUTPUT_HEIGHT = 1760;

const TOP_BORDER_H = 56;
const HEADER_H = 190;
const SIDE_MARGIN = 46;
const SLOT_GAP = 22;
const FOOTER_H = 150;
const BOTTOM_BORDER_H = 64;
const SLOT_COUNT = 3;

const SLOTS_TOP = TOP_BORDER_H + HEADER_H;
const SLOTS_BOTTOM = OUTPUT_HEIGHT - FOOTER_H - BOTTOM_BORDER_H;
const SLOTS_AREA_H = SLOTS_BOTTOM - SLOTS_TOP;
const SLOT_H = (SLOTS_AREA_H - SLOT_GAP * (SLOT_COUNT - 1)) / SLOT_COUNT;
const SLOT_W = OUTPUT_WIDTH - SIDE_MARGIN * 2;

/** Pixel rect for photo slot `i` (0-based) on the strip canvas. */
export function getSlotRect(i: number) {
  return {
    x: SIDE_MARGIN,
    y: SLOTS_TOP + i * (SLOT_H + SLOT_GAP),
    width: SLOT_W,
    height: SLOT_H,
  };
}

async function ensureFontLoaded() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load("700 64px 'Baloo 2'"),
      document.fonts.load("600 34px 'Baloo 2'"),
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
 * a same-aspect-ratio canvas, cropped/mirrored to match the on-screen
 * preview. Called once per shot, immediately, so each of the 3 poses in a
 * strip is the frame that was live *at that moment* — not whatever the
 * video happens to show later when the strip is assembled.
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
  canvas.width = SLOT_W;
  canvas.height = SLOT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const { cropX, cropY, cropWidth, cropHeight } = coverCrop(
    sourceWidth,
    sourceHeight,
    SLOT_W,
    SLOT_H
  );

  ctx.save();
  if (mirrored) {
    ctx.translate(SLOT_W, 0);
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
    SLOT_W,
    SLOT_H
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

  // 4. Photo slots — white rounded frame + the captured shot inside it.
  for (let i = 0; i < SLOT_COUNT; i += 1) {
    const { x, y, width, height } = getSlotRect(i);
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

  // 5. Theme stickers, chroma-keyed to remove their green backdrop, drawn
  //    on top so they straddle the seams between photo slots.
  const layers = [...theme.decorations].sort(
    (a, b) => (a.z ?? 0) - (b.z ?? 0)
  );

  for (const layer of layers) {
    try {
      const keyed = await getKeyedImage(layer.src);
      const drawWidth = layer.width * OUTPUT_WIDTH;
      const aspect = keyed.height / keyed.width;
      const drawHeight = layer.height
        ? layer.height * OUTPUT_HEIGHT
        : drawWidth * aspect;

      const drawX = layer.x * OUTPUT_WIDTH;
      const drawY = layer.y * OUTPUT_HEIGHT;
      const centerX = drawX + drawWidth / 2;
      const centerY = drawY + drawHeight / 2;

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

  // 6. Hashtag footer.
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fdf3e3";
  ctx.font = "700 52px 'Baloo 2', sans-serif";
  ctx.fillText("#GirlorBoy?", SIDE_MARGIN + 4, OUTPUT_HEIGHT - BOTTOM_BORDER_H - 78);
  ctx.fillText("#BabyShower", SIDE_MARGIN + 4, OUTPUT_HEIGHT - BOTTOM_BORDER_H - 20);
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

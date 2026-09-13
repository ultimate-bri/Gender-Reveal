import { getKeyedImage } from "./chromaKey";
import type { CapturedPhoto, ThemeConfig } from "@/types";

/** Fixed portrait output size. Using a constant target (rather than the raw,
 *  device-dependent video resolution) keeps sticker layout, text size, and
 *  the crop framing identical across every phone and browser. */
export const OUTPUT_WIDTH = 1080;
export const OUTPUT_HEIGHT = 1440;

const FOOTER_TEXT = "Thank you for coming! \uD83D\uDC95 Mommy She & Daddy Bri";

async function ensureFontLoaded() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load("700 48px 'Baloo 2'"),
      document.fonts.load("600 30px 'Baloo 2'"),
    ]);
  } catch {
    // If the font API throws (rare, older browsers), we still draw with
    // whatever fallback font is active rather than blocking capture.
  }
}

/** Computes a "cover" crop rectangle so the source video fills the target
 *  portrait canvas without distortion, matching the live preview's
 *  object-fit: cover behavior exactly. */
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

export type PhotoSource = HTMLVideoElement | HTMLImageElement;

function isVideoSource(source: PhotoSource): source is HTMLVideoElement {
  return "videoWidth" in source;
}

export interface ComposeOptions {
  /** Either the live camera preview, or an <img> loaded from the
   *  <input type="file"> fallback used when no camera is available. */
  source: PhotoSource;
  theme: ThemeConfig;
  /** Only meaningful for a front-camera video source. */
  mirrored: boolean;
}

export async function composePhoto({
  source,
  theme,
  mirrored,
}: ComposeOptions): Promise<CapturedPhoto> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  // 1. Draw the captured frame, cropped + mirrored to match preview.
  const sourceWidth = isVideoSource(source)
    ? source.videoWidth
    : source.naturalWidth;
  const sourceHeight = isVideoSource(source)
    ? source.videoHeight
    : source.naturalHeight;
  const { cropX, cropY, cropWidth, cropHeight } = coverCrop(
    sourceWidth,
    sourceHeight,
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT
  );

  ctx.save();
  if (mirrored) {
    ctx.translate(OUTPUT_WIDTH, 0);
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
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT
  );
  ctx.restore();

  // 2. Overlay theme decorations, chroma-keyed to remove their green backdrop.
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
      // A single missing/broken sticker shouldn't tank the whole photo —
      // skip it and keep compositing the rest.
    }
  }

  // 3. Footer band with the thank-you message.
  await ensureFontLoaded();

  const footerHeight = OUTPUT_HEIGHT * 0.105;
  const footerY = OUTPUT_HEIGHT - footerHeight;

  ctx.save();
  ctx.fillStyle = theme.accentSoft;
  ctx.fillRect(0, footerY, OUTPUT_WIDTH, footerHeight);

  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, footerY, OUTPUT_WIDTH, Math.max(4, OUTPUT_HEIGHT * 0.006));

  ctx.fillStyle = theme.accentDark;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = 40;
  ctx.font = `600 ${fontSize}px 'Baloo 2', sans-serif`;
  const maxTextWidth = OUTPUT_WIDTH * 0.92;
  while (ctx.measureText(FOOTER_TEXT).width > maxTextWidth && fontSize > 18) {
    fontSize -= 2;
    ctx.font = `600 ${fontSize}px 'Baloo 2', sans-serif`;
  }
  ctx.fillText(FOOTER_TEXT, OUTPUT_WIDTH / 2, footerY + footerHeight / 2 + 2);
  ctx.restore();

  // 4. Outer frame border in the theme accent, like a printed photobooth strip.
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = OUTPUT_WIDTH * 0.018;
  drawRoundedRect(
    ctx,
    ctx.lineWidth / 2,
    ctx.lineWidth / 2,
    OUTPUT_WIDTH - ctx.lineWidth,
    OUTPUT_HEIGHT - ctx.lineWidth,
    OUTPUT_WIDTH * 0.04
  );
  ctx.stroke();
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

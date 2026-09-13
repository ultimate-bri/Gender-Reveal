import { getFrameConfig } from "./frameConfig";
import { CapturedPhoto, Gender } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Draws `img` into the destination rect using "object-fit: contain"
 * style scaling - the whole image is shown, scaled up/down to fit
 * inside the rect without cropping or distorting it, and centered.
 * Used for stickers, where we want the full artwork to show rather
 * than crop it.
 */
function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destX: number,
  destY: number,
  destW: number,
  destH: number
) {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  const scale = Math.min(destW / srcW, destH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  const x = destX + (destW - w) / 2;
  const y = destY + (destH - h) / 2;

  ctx.drawImage(img, x, y, w, h);
}

/**
 * Draws `img` into the destination rect using "object-fit: cover" style
 * cropping - the image fills the rect completely, center-cropped, with
 * no distortion.
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  destX: number,
  destY: number,
  destW: number,
  destH: number
) {
  const srcW = "naturalWidth" in img ? img.naturalWidth : img.width;
  const srcH = "naturalHeight" in img ? img.naturalHeight : img.height;

  const srcRatio = srcW / srcH;
  const destRatio = destW / destH;

  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;

  if (srcRatio > destRatio) {
    // source is wider than destination -> crop left/right
    sw = srcH * destRatio;
    sx = (srcW - sw) / 2;
  } else {
    // source is taller than destination -> crop top/bottom
    sh = srcW / destRatio;
    sy = (srcH - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, destX, destY, destW, destH);
}

export interface CompositeResult {
  blob: Blob;
  dataUrl: string;
}

/**
 * Composites 3 captured photos + the chosen gender frame into a single
 * print-quality photo strip. Runs entirely on an offscreen canvas.
 */
export async function compositeStrip(
  photos: CapturedPhoto[],
  gender: Gender
): Promise<CompositeResult> {
  if (photos.length !== 3) {
    throw new Error("compositeStrip requires exactly 3 photos");
  }

  const config = getFrameConfig(gender);
  const { canvasWidth, canvasHeight, windows, src, stickers } = config;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Load the 3 photos + the frame + any sticker overlays in parallel
  const [photoImages, frameImage, stickerImages] = await Promise.all([
    Promise.all(photos.map((p) => loadImage(p.dataUrl))),
    loadImage(src),
    Promise.all(stickers.map((s) => loadImage(s.src))),
  ]);

  // Draw each photo into its window, cover-cropped
  photoImages.forEach((img, i) => {
    const win = windows[i];
    const destX = win.x * canvasWidth;
    const destY = win.y * canvasHeight;
    const destW = win.width * canvasWidth;
    const destH = win.height * canvasHeight;
    drawImageCover(ctx, img, destX, destY, destW, destH);
  });

  // Draw the frame (with transparent windows) on top
  ctx.drawImage(frameImage, 0, 0, canvasWidth, canvasHeight);

  // Finally, redraw the decorative stickers on top of EVERYTHING. The
  // frame's own artwork gets clipped anywhere it overlaps a photo
  // window (so the photo can show through), which otherwise leaves
  // rainbows/flowers/balloons etc. looking cut off once a photo is in
  // place. Drawing them again here, last, keeps them fully intact.
  stickerImages.forEach((img, i) => {
    const { box } = stickers[i];
    const destX = box.x * canvasWidth;
    const destY = box.y * canvasHeight;
    const destW = box.width * canvasWidth;
    const destH = box.height * canvasHeight;
    drawImageContain(ctx, img, destX, destY, destW, destH);
  });

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))),
      "image/jpeg",
      0.95
    );
  });

  return { blob, dataUrl };
}

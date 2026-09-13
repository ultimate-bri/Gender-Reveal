/**
 * Runtime chroma-key removal for the green-background sticker PNGs/JPGs.
 *
 * Each source asset is loaded once, processed into a transparent-background
 * canvas, and cached in memory (`keyedImageCache`) so repeat draws — and
 * repeat photos in the same session — never reprocess pixels twice.
 */

/** How aggressively "green" a pixel must be before it's treated as background.
 *  Lower = keys out more (risks eating green-ish highlights on the art).
 *  Higher = keys out less (risks leaving a green halo at edges). */
export const CHROMA_TOLERANCE = 48;

/** Width (in the same units as CHROMA_TOLERANCE) of the soft falloff band
 *  used to antialias sticker edges instead of leaving a hard cutout line. */
const FEATHER = 26;

interface KeyedImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const keyedImageCache = new Map<string, Promise<KeyedImage>>();

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load decoration image: ${src}`));
    img.src = src;
  });
}

/**
 * Loads `src`, removes its green background, and returns a cached
 * <canvas> containing the result with real alpha transparency.
 */
export async function getKeyedImage(
  src: string,
  tolerance: number = CHROMA_TOLERANCE
): Promise<KeyedImage> {
  const cacheKey = `${src}::${tolerance}`;
  const cached = keyedImageCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const img = await loadHtmlImage(src);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D canvas context unavailable");

    ctx.drawImage(img, 0, 0);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // "Greenness" — how far g sits above the strongest of r/b. Pure
      // green-screen pixels score high; skin tones, oranges, pinks, and
      // creams in the artwork score at or below zero.
      const greenness = g - Math.max(r, b);

      let alpha = 255;
      if (greenness >= tolerance) {
        alpha = 0;
      } else if (greenness >= tolerance - FEATHER) {
        const t = (tolerance - greenness) / FEATHER; // 0 at edge -> 1 inside
        alpha = Math.round(255 * t);
      }

      if (alpha < 255) {
        // Despill: pull the green channel toward the r/b average so
        // partially-keyed edge pixels don't keep a green fringe once
        // composited over the photo.
        const avg = (r + b) / 2;
        const spillFix = 1 - alpha / 255;
        data[i + 1] = Math.round(g * (1 - spillFix) + avg * spillFix);
      }

      data[i + 3] = alpha;
    }

    ctx.putImageData(frame, 0, 0);

    return { canvas, width: canvas.width, height: canvas.height };
  })();

  keyedImageCache.set(cacheKey, promise);
  return promise;
}

/** Warms the cache for a batch of decoration sources (used on theme select
 *  so the first capture doesn't stall on image processing). Returns a
 *  promise that resolves once every source has settled (loaded+keyed or
 *  failed) so callers — like the startup loading screen — can await it. */
export function preloadDecorations(sources: string[]): Promise<void> {
  return Promise.all(
    sources.map((src) =>
      getKeyedImage(src).catch(() => {
        // Swallowed: a failed preload just means the first real draw retries.
      })
    )
  ).then(() => undefined);
}

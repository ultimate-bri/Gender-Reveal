/** True when running on a touch/mobile device (iOS or Android). */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  const isAndroid = /Android/.test(ua);
  const isTouchPrimary =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)")?.matches;
  return isIOS || isAndroid || Boolean(isTouchPrimary && /Mobi/.test(ua));
}

/** True when the Web Share API supports sharing files (iOS Safari, Android Chrome). */
export function canShareFiles(file: File): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  return Boolean(
    typeof nav.canShare === "function" &&
      typeof nav.share === "function" &&
      nav.canShare({ files: [file] })
  );
}

/** True when the File System Access API (showSaveFilePicker) is available - Chromium desktop. */
export function canUseFileSystemAccess(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

/** True when the browser exposes getUserMedia at all. */
export function hasCameraSupport(): boolean {
  return Boolean(
    typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/** True when running in a secure context (HTTPS or localhost) - required for camera access. */
export function isSecureContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

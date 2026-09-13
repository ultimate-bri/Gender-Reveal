import { canShareFiles, canUseFileSystemAccess, isMobileDevice } from "./device";

export type SaveMethod = "share" | "filesystem" | "download";

export interface SaveResult {
  method: SaveMethod;
  /** false if the user cancelled a native picker/share sheet - not an error */
  cancelled: boolean;
}

const FILE_NAME = "gender-reveal-strip.jpg";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a tick to pick up the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Saves the photo strip using the best available method for the current
 * device:
 *  - Mobile (iOS/Android): Web Share API with files, so the OS share sheet
 *    (with "Save to Photos" / "Save image") appears. Falls back to a
 *    blob-URL download if sharing files isn't supported.
 *  - Desktop (Chromium): showSaveFilePicker so the user can choose a folder.
 *    Falls back to a plain download on Safari/Firefox desktop.
 */
export async function saveStrip(blob: Blob): Promise<SaveResult> {
  const file = new File([blob], FILE_NAME, { type: "image/jpeg" });

  if (isMobileDevice() && canShareFiles(file)) {
    try {
      await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
        files: [file],
        title: "Gender Reveal Photo Strip",
      });
      return { method: "share", cancelled: false };
    } catch (err) {
      // AbortError = user dismissed the share sheet, not a real failure
      if (err instanceof DOMException && err.name === "AbortError") {
        return { method: "share", cancelled: true };
      }
      // Any other failure: fall through to download fallback
      downloadBlob(blob, FILE_NAME);
      return { method: "download", cancelled: false };
    }
  }

  if (!isMobileDevice() && canUseFileSystemAccess()) {
    try {
      const handle = await window.showSaveFilePicker!({
        suggestedName: FILE_NAME,
        types: [
          {
            description: "JPEG Image",
            accept: { "image/jpeg": [".jpg", ".jpeg"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { method: "filesystem", cancelled: false };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { method: "filesystem", cancelled: true };
      }
      downloadBlob(blob, FILE_NAME);
      return { method: "download", cancelled: false };
    }
  }

  downloadBlob(blob, FILE_NAME);
  return { method: "download", cancelled: false };
}

import { idbGet, idbSet } from "./idb";
import type { SaveMethod } from "@/types";

const DIR_HANDLE_KEY = "genderRevealDirHandle";
const FOLDER_NAME = "GenderReveal";

/** Cached in-memory for the current tab session once granted, so we don't
 *  even have to touch IndexedDB on every single save. */
let cachedDirHandle: FileSystemDirectoryHandle | null = null;

export function filenameFor(theme: string, createdAt: number): string {
  const iso = new Date(createdAt).toISOString().replace(/[:.]/g, "-");
  return `genderreveal-${theme}-${iso}.png`;
}

export function detectSaveMethod(): SaveMethod {
  if (typeof window === "undefined") return "download";
  if (typeof window.showDirectoryPicker === "function") return "filesystem";
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    return "share";
  }
  return "download";
}

async function verifyOrRequestPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const opts = { mode: "readwrite" as const };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

/** Gets the cached "GenderReveal" folder handle, restoring it from
 *  IndexedDB if needed, or prompting the user to pick a parent folder
 *  (once) if none has been granted yet. */
async function getGenderRevealFolder(): Promise<FileSystemDirectoryHandle> {
  if (cachedDirHandle && (await verifyOrRequestPermission(cachedDirHandle))) {
    return cachedDirHandle;
  }

  const stored = await idbGet<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
  if (stored && (await verifyOrRequestPermission(stored))) {
    cachedDirHandle = stored;
    return stored;
  }

  if (!window.showDirectoryPicker) {
    throw new Error("File System Access API unavailable");
  }

  const parent = await window.showDirectoryPicker({
    id: "gender-reveal-photobooth",
    mode: "readwrite",
    startIn: "pictures",
  });
  const genderRevealDir = await parent.getDirectoryHandle(FOLDER_NAME, {
    create: true,
  });

  await idbSet(DIR_HANDLE_KEY, genderRevealDir);
  cachedDirHandle = genderRevealDir;
  return genderRevealDir;
}

/** Forgets the remembered folder so the next save re-prompts the user
 *  (exposed for a "change folder" affordance / troubleshooting). */
export async function forgetSavedFolder(): Promise<void> {
  cachedDirHandle = null;
  await idbSet(DIR_HANDLE_KEY, undefined);
}

async function saveViaFilesystem(blob: Blob, filename: string): Promise<void> {
  const dir = await getGenderRevealFolder();
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function saveViaShare(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });
  const shareData: ShareData = {
    files: [file],
    title: "Gender Reveal Photobooth",
    text: "Our gender reveal photobooth picture!",
  };
  if (!navigator.canShare?.(shareData)) {
    throw new Error("This device can't share image files");
  }
  await navigator.share(shareData);
}

function saveViaDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a tick to pick up the blob before revoking it.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export interface SaveResult {
  method: SaveMethod;
  filename: string;
}

/**
 * Saves/shares a photo using the best method available on this device,
 * with automatic fallback if the preferred method fails or is cancelled.
 *
 *  - Desktop Chromium: File System Access API -> a persistent "GenderReveal" folder.
 *  - Mobile (iOS/Android): Web Share Level 2 native share sheet.
 *  - Everything else: plain <a download> file save.
 */
export async function savePhoto(
  blob: Blob,
  theme: string,
  createdAt: number
): Promise<SaveResult> {
  const filename = filenameFor(theme, createdAt);
  const method = detectSaveMethod();

  try {
    if (method === "filesystem") {
      await saveViaFilesystem(blob, filename);
      return { method, filename };
    }
    if (method === "share") {
      await saveViaShare(blob, filename);
      return { method, filename };
    }
  } catch (err) {
    // AbortError means the person cancelled a picker/share sheet on
    // purpose — respect that instead of silently forcing a download.
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    // Any other failure (permission revoked, API misbehaving, etc.) falls
    // through to the universal download so the photo is never stranded.
  }

  saveViaDownload(blob, filename);
  return { method: "download", filename };
}

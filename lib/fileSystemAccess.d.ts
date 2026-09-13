// Minimal ambient types for the File System Access API (Chromium desktop).
// Not yet part of TypeScript's built-in DOM lib.
export {};

declare global {
  interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }

  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: Blob | BufferSource | string): Promise<void>;
    close(): Promise<void>;
  }

  interface Window {
    showSaveFilePicker?: (
      options?: SaveFilePickerOptions
    ) => Promise<FileSystemFileHandle>;
  }
}

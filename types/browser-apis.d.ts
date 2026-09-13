export {};

declare global {
  interface FileSystemHandlePermissionDescriptor {
    mode?: "read" | "readwrite";
  }

  interface FileSystemDirectoryHandle {
    kind: "directory";
    name: string;
    getDirectoryHandle(
      name: string,
      options?: { create?: boolean }
    ): Promise<FileSystemDirectoryHandle>;
    getFileHandle(
      name: string,
      options?: { create?: boolean }
    ): Promise<FileSystemFileHandle>;
    queryPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
    requestPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
  }

  interface FileSystemFileHandle {
    kind: "file";
    name: string;
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: Blob | BufferSource | string): Promise<void>;
    close(): Promise<void>;
  }

  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string;
      mode?: "read" | "readwrite";
      startIn?: string;
    }) => Promise<FileSystemDirectoryHandle>;
  }

  interface Navigator {
    canShare?: (data?: ShareData) => boolean;
  }
}

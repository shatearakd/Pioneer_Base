import { saveMedia, getMedia } from "../db.js";

// Media handling. Files can live inside IndexedDB (kept on device) or, when the
// File System Access API is available, be written to a location the user picks
// (useful for large videos that you don't want duplicated in the database).

export function fileSystemAccessSupported() {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

// Store a Blob/File inside IndexedDB and return the media record.
export async function storeBlob({ projectId, blob, mimeType, filename }) {
  return saveMedia({
    projectId,
    blob,
    mimeType: mimeType || blob.type || "application/octet-stream",
    filename,
  });
}

// Turn a stored media record into an object URL for playback/preview.
// Callers should revokeObjectURL when done.
export async function mediaObjectUrl(mediaId) {
  const rec = await getMedia(mediaId);
  if (!rec?.blob) return null;
  return URL.createObjectURL(rec.blob);
}

// Save a blob to an external location the user chooses (keeps big files off the
// database). Falls back to a normal download when the picker is unavailable.
export async function saveToDevice(blob, suggestedName) {
  if (fileSystemAccessSupported()) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e) {
      if (e?.name === "AbortError") return false;
      // fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName || "download";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export function humanSize(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

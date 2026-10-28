import { useEffect, useState } from "react";
import { getMedia } from "../db.js";
import { humanSize, saveToDevice } from "../lib/media.js";
import Icon from "./Icon.jsx";

// Renders a stored media record (audio or video) with a save-to-device option.
export default function MediaPlayer({ mediaId }) {
  const [media, setMedia] = useState(null);
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let revoked = null;
    let alive = true;
    (async () => {
      const rec = await getMedia(mediaId);
      if (!alive || !rec?.blob) return;
      const objUrl = URL.createObjectURL(rec.blob);
      revoked = objUrl;
      setMedia(rec);
      setUrl(objUrl);
    })();
    return () => {
      alive = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [mediaId]);

  if (!media || !url) return null;
  const isVideo = (media.mimeType || "").startsWith("video");

  return (
    <div className="mt-3 panel-2 p-3">
      {isVideo ? (
        <video src={url} controls className="w-full max-h-72 rounded-lg bg-black" />
      ) : (
        <audio src={url} controls className="w-full" />
      )}
      <div className="flex items-center justify-between mt-2 font-label-sm text-label-sm text-text-muted">
        <span className="truncate flex items-center gap-1">
          <Icon name={isVideo ? "movie" : "graphic_eq"} className="text-[14px] text-secondary" />
          {media.filename} {media.size ? `· ${humanSize(media.size)}` : ""}
        </span>
        <button
          className="flex items-center gap-1 text-primary hover:underline flex-shrink-0"
          onClick={() => saveToDevice(media.blob, media.filename)}
        >
          <Icon name="file_download" className="text-[15px]" /> Save
        </button>
      </div>
    </div>
  );
}

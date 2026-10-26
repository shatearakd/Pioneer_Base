import { useEffect, useState } from "react";
import { getMedia } from "../db.js";
import { humanSize, saveToDevice } from "../lib/media.js";

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
    <div className="mt-2">
      {isVideo ? (
        <video src={url} controls className="w-full max-h-72 rounded-xl bg-black" />
      ) : (
        <audio src={url} controls className="w-full" />
      )}
      <div className="flex items-center justify-between mt-1 text-xs text-ink/40">
        <span>
          {media.filename} {media.size ? `· ${humanSize(media.size)}` : ""}
        </span>
        <button
          className="hover:text-teal"
          onClick={() => saveToDevice(media.blob, media.filename)}
        >
          Save to device
        </button>
      </div>
    </div>
  );
}

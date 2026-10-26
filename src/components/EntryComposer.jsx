import { useRef, useState } from "react";
import { saveEntry } from "../db.js";
import { storeBlob } from "../lib/media.js";
import { recordAudio, mediaRecorderSupported } from "../lib/voice.js";
import VoiceButton from "./VoiceButton.jsx";

const KINDS = [
  { id: "note", label: "Note" },
  { id: "doc", label: "Document" },
  { id: "result", label: "Result" },
  { id: "hypothesis", label: "Hypothesis" },
  { id: "labReport", label: "Lab report" },
];

// Composer for adding log entries to a project: typed/dictated text, recorded
// audio, or an attached audio/video file. onSaved() refreshes the parent.
export default function EntryComposer({ projectId, onSaved }) {
  const [kind, setKind] = useState("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef(null);
  const fileRef = useRef(null);

  async function addText() {
    if (!title.trim() && !body.trim()) return;
    setBusy(true);
    try {
      await saveEntry({ projectId, kind, title, body });
      setTitle("");
      setBody("");
      onSaved?.();
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      const blob = await recRef.current.stop();
      setRecording(false);
      const media = await storeBlob({
        projectId,
        blob,
        mimeType: blob.type,
        filename: `audio-${Date.now()}.webm`,
      });
      await saveEntry({
        projectId,
        kind: "audio",
        title: title.trim() || "Audio log",
        body: body.trim(),
        mediaId: media.id,
      });
      setTitle("");
      setBody("");
      onSaved?.();
      return;
    }
    try {
      recRef.current = await recordAudio();
      setRecording(true);
    } catch {
      alert("Microphone not available or permission denied.");
    }
  }

  async function onFilePicked(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const media = await storeBlob({
        projectId,
        blob: file,
        mimeType: file.type,
        filename: file.name,
      });
      const isVideo = file.type.startsWith("video");
      await saveEntry({
        projectId,
        kind: isVideo ? "video" : "audio",
        title: title.trim() || file.name,
        body: body.trim(),
        mediaId: media.id,
      });
      setTitle("");
      setBody("");
      onSaved?.();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={`chip border ${
              kind === k.id ? "border-teal/50 text-teal bg-teal/10" : "border-white/10"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <input
        className="field"
        placeholder="Entry title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="flex items-start gap-2">
        <textarea
          className="field min-h-[80px] flex-1"
          placeholder="Write your log, or dictate it with the mic…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={addText} disabled={busy}>
          Save entry
        </button>

        <VoiceButton
          onTranscript={() => {}}
          onFinal={(t) => t && setBody((prev) => (prev ? `${prev} ${t}` : t))}
        />

        {mediaRecorderSupported() && (
          <button
            onClick={toggleRecording}
            className={`btn ${recording ? "bg-tangerine text-base-950 pulse-rec" : "btn-ghost"}`}
          >
            {recording ? "Stop & save audio" : "Record audio"}
          </button>
        )}

        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          Attach audio / video
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={onFilePicked}
        />
      </div>
    </div>
  );
}

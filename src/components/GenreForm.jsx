import { useState } from "react";
import { saveGenre, deleteGenre } from "../db.js";
import Icon from "./Icon.jsx";

// Kinetic Lab Matrix accent palette for genre branch nodes.
const SWATCHES = ["#52d8e7", "#85f3ff", "#ffb955", "#00E59B", "#F5A623", "#7A929E"];

// Create or edit a genre folder (branch node in the taxonomy tree).
export default function GenreForm({ genre, onSaved, onCancel }) {
  const [name, setName] = useState(genre?.name || "");
  const [color, setColor] = useState(genre?.color || SWATCHES[0]);
  const [tags, setTags] = useState((genre?.tags || []).join(", "));
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await saveGenre({
        id: genre?.id,
        name,
        color,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onSaved?.(saved);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this genre? Its projects become Unfiled.")) return;
    await deleteGenre(genre.id);
    onSaved?.(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input
          className="field mt-1.5"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chemistry"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label">Branch accent</label>
        <div className="flex gap-2.5 mt-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full border-2 transition-transform ${
                color === c ? "border-text-primary scale-110" : "border-transparent"
              }`}
              style={{ background: c, boxShadow: `0 0 10px ${c}66` }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="label">Tags (comma separated)</label>
        <input
          className="field mt-1.5"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="reactions, materials"
        />
      </div>
      <div className="flex justify-between gap-2 pt-2">
        <div>
          {genre && (
            <button type="button" className="btn-danger" onClick={handleDelete}>
              <Icon name="delete" className="text-[16px]" /> Delete
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
            {genre ? "Save" : "Create genre"}
          </button>
        </div>
      </div>
    </form>
  );
}

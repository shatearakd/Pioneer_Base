import { useState } from "react";
import { saveGenre, deleteGenre } from "../db.js";

const SWATCHES = ["#00b0be", "#3594cc", "#ea801c", "#c99b38", "#8fd7d7", "#eddca5"];

// Create or edit a genre folder (category node in the tree).
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
        <label className="text-xs text-ink/50 font-header">Name</label>
        <input
          className="field mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chemistry"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs text-ink/50 font-header">Color</label>
        <div className="flex gap-2 mt-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full border-2 ${
                color === c ? "border-ink" : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-ink/50 font-header">Tags (comma separated)</label>
        <input
          className="field mt-1"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="reactions, materials"
        />
      </div>
      <div className="flex justify-between gap-2 pt-2">
        <div>
          {genre && (
            <button type="button" className="btn-ghost text-tangerine border-tangerine/30" onClick={handleDelete}>
              Delete
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

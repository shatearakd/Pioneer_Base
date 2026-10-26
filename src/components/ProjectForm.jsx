import { useEffect, useState } from "react";
import { listGenres, saveProject, saveGenre, setPrimaryProject } from "../db.js";
import VoiceButton from "./VoiceButton.jsx";

const KINDS = ["experiment", "project", "invention"];

// Create or edit a project. onSaved(project) fires after a successful save.
export default function ProjectForm({ project, defaultGenreId, onSaved, onCancel }) {
  const [genres, setGenres] = useState([]);
  const [title, setTitle] = useState(project?.title || "");
  const [kind, setKind] = useState(project?.kind || "experiment");
  const [genreId, setGenreId] = useState(project?.genreId || defaultGenreId || "");
  const [overview, setOverview] = useState(project?.overview || "");
  const [tags, setTags] = useState((project?.tags || []).join(", "));
  const [isPrimary, setIsPrimary] = useState(project?.isPrimary || false);
  const [newGenre, setNewGenre] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listGenres().then(setGenres);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      let gid = genreId;
      if (gid === "__new__" && newGenre.trim()) {
        const g = await saveGenre({ name: newGenre.trim() });
        gid = g.id;
      } else if (gid === "__new__") {
        gid = null;
      }
      const saved = await saveProject({
        id: project?.id,
        title,
        kind,
        genreId: gid || null,
        overview,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (isPrimary) await setPrimaryProject(saved.id);
      onSaved?.(saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-ink/50 font-header">Title</label>
        <input
          className="field mt-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Saltwater battery cell"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-ink/50 font-header">Type</label>
          <select className="field mt-1" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k} value={k} className="bg-base-800">
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 font-header">Genre folder</label>
          <select
            className="field mt-1"
            value={genreId}
            onChange={(e) => setGenreId(e.target.value)}
          >
            <option value="" className="bg-base-800">
              Unfiled
            </option>
            {genres.map((g) => (
              <option key={g.id} value={g.id} className="bg-base-800">
                {g.name}
              </option>
            ))}
            <option value="__new__" className="bg-base-800">
              + New genre…
            </option>
          </select>
        </div>
      </div>

      {genreId === "__new__" && (
        <input
          className="field"
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
          placeholder="New genre name"
        />
      )}

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-ink/50 font-header">Overview</label>
          <VoiceButton
            className="!px-2 !py-1 text-xs"
            onFinal={(t) => t && setOverview((prev) => (prev ? `${prev} ${t}` : t))}
          />
        </div>
        <textarea
          className="field mt-1 min-h-[90px]"
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
          placeholder="What is this project about?"
        />
      </div>

      <div>
        <label className="text-xs text-ink/50 font-header">Tags (comma separated)</label>
        <input
          className="field mt-1"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="energy, electrochemistry"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="accent-teal h-4 w-4"
        />
        Set as my primary experiment
      </label>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={busy || !title.trim()}>
          {project ? "Save changes" : "Create project"}
        </button>
      </div>
    </form>
  );
}

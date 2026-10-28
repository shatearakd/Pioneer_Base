import { useEffect, useState } from "react";
import { listGenres, saveProject, saveGenre, setPrimaryProject } from "../db.js";
import VoiceButton from "./VoiceButton.jsx";
import Icon from "./Icon.jsx";
import { kindMeta, accent } from "../lib/ui.js";

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
        <label className="label">Title</label>
        <input
          className="field mt-1.5"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Saltwater battery cell"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="label">Type</label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {KINDS.map((k) => {
            const m = kindMeta(k);
            const a = accent(m.accent);
            const on = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`btn border ${
                  on ? `${a.border} ${a.soft}` : "border-surface-border text-text-muted hover:text-on-surface"
                }`}
              >
                <Icon name={m.icon} className="text-[16px]" /> {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label">Genre folder</label>
        <select
          className="field mt-1.5"
          value={genreId}
          onChange={(e) => setGenreId(e.target.value)}
        >
          <option value="" className="bg-surface-container">
            Unfiled
          </option>
          {genres.map((g) => (
            <option key={g.id} value={g.id} className="bg-surface-container">
              {g.name}
            </option>
          ))}
          <option value="__new__" className="bg-surface-container">
            + New genre…
          </option>
        </select>
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
          <label className="label">Overview</label>
          <VoiceButton
            className="!px-2 !py-1"
            onFinal={(t) => t && setOverview((prev) => (prev ? `${prev} ${t}` : t))}
          />
        </div>
        <textarea
          className="field mt-1.5 min-h-[90px]"
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
          placeholder="What is this project about?"
        />
      </div>

      <div>
        <label className="label">Tags (comma separated)</label>
        <input
          className="field mt-1.5"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="energy, electrochemistry"
        />
      </div>

      <label className="flex items-center gap-2.5 font-body-md text-body-md text-on-surface">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="accent-primary h-4 w-4"
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

import { useState } from "react";
import { Link } from "react-router-dom";

// Mind-map style tree: each genre is a node with a connector line out to its
// project folder cards. Expanding/collapsing keeps the canvas tidy.
export default function FolderTree({ genres, projectsByGenre, unfiled = [], onEditGenre }) {
  return (
    <div className="space-y-6">
      {genres.map((g) => (
        <GenreBranch
          key={g.id}
          genre={g}
          projects={projectsByGenre[g.id] || []}
          onEdit={onEditGenre}
        />
      ))}
      {unfiled.length > 0 && (
        <GenreBranch
          genre={{ id: "__unfiled__", name: "Unfiled", color: "#8fd7d7", tags: [] }}
          projects={unfiled}
        />
      )}
    </div>
  );
}

function GenreBranch({ genre, projects, onEdit }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass rounded-3xl p-4">
      {/* Node */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="h-10 w-10 rounded-2xl grid place-items-center text-base-950 font-bold shrink-0 transition hover:scale-105"
          style={{ background: genre.color }}
          title={open ? "Collapse" : "Expand"}
        >
          {genre.name[0]?.toUpperCase()}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-header text-ink">{genre.name}</h3>
            <span className="text-xs text-ink/40">
              {projects.length} item{projects.length === 1 ? "" : "s"}
            </span>
          </div>
          {genre.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {genre.tags.map((t) => (
                <span key={t} className="chip">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        {onEdit && genre.id !== "__unfiled__" && (
          <button className="text-ink/40 hover:text-ink text-sm" onClick={() => onEdit(genre)}>
            Edit
          </button>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-ink/40 hover:text-ink text-sm w-6"
        >
          {open ? "▾" : "▸"}
        </button>
      </div>

      {/* Branch cards */}
      {open && (
        <div className="mt-4 pl-5 ml-5 border-l border-dashed border-white/15 space-y-3">
          {projects.length === 0 ? (
            <p className="text-ink/40 text-sm italic">No projects in this folder yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/project/${p.id}`}
                  className="relative block rounded-2xl bg-base-800/70 border border-white/10 p-3 hover:border-teal/40 transition fade-in"
                >
                  <span
                    className="absolute -left-[22px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full"
                    style={{ background: genre.color }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-ink/50">{p.kind}</span>
                    {p.isPrimary && <span className="chip border border-teal/40 text-teal">★</span>}
                  </div>
                  <div className="font-header text-ink leading-tight mt-1">{p.title}</div>
                  {p.overview && (
                    <p className="text-xs text-ink/55 mt-1 line-clamp-2">{p.overview}</p>
                  )}
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="chip text-[10px] px-2 py-0.5">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

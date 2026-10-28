import { useState } from "react";
import { Link } from "react-router-dom";
import ProjectCard from "./ProjectCard.jsx";
import Icon from "./Icon.jsx";

// Mind-map / taxonomy graph: a root vault node branches out to each genre, and
// every genre branch holds its project folder cards on a dashed circuit guide.
export default function FolderTree({ genres, projectsByGenre, unfiled = [], onEditGenre }) {
  const branches = [
    ...genres.map((g) => ({ genre: g, projects: projectsByGenre[g.id] || [] })),
  ];
  if (unfiled.length > 0) {
    branches.push({
      genre: { id: "__unfiled__", name: "Unfiled", color: "#7A929E", tags: [] },
      projects: unfiled,
    });
  }
  const totalProjects = branches.reduce((n, b) => n + b.projects.length, 0);

  return (
    <div className="relative panel bg-surface-container-lowest/60 p-space-md overflow-hidden">
      {/* Blueprint dot matrix backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(#52d8e7 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Root node */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-panel border border-surface-border shadow-md">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div className="flex flex-col items-center">
            <span className="font-headline-sm text-headline-sm text-text-primary uppercase tracking-wider">
              Research Vault
            </span>
            <span className="font-label-sm text-label-sm text-text-muted">
              {totalProjects} invention{totalProjects === 1 ? "" : "s"} • {branches.length} branch
              {branches.length === 1 ? "" : "es"}
            </span>
          </div>
          <Icon name="lock_open" className="text-[18px] text-primary" />
        </div>
        <div className="w-0.5 h-6 bg-surface-border my-1" />
        <div className="w-full max-w-[280px] h-0.5 bg-surface-border" />
      </div>

      {/* Branches */}
      <div className="relative z-10 flex flex-col gap-space-lg mt-4">
        {branches.map((b) => (
          <GenreBranch
            key={b.genre.id}
            genre={b.genre}
            projects={b.projects}
            onEdit={b.genre.id === "__unfiled__" ? null : onEditGenre}
          />
        ))}
      </div>
    </div>
  );
}

function GenreBranch({ genre, projects, onEdit }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col">
      {/* Branch header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-center w-7 h-7 rounded bg-surface-container-high text-primary hover:bg-surface-bright transition-colors flex-shrink-0"
          title={open ? "Collapse" : "Expand"}
        >
          <Icon name={open ? "expand_more" : "chevron_right"} className="text-[16px]" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container border border-surface-border shadow-sm min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: genre.color, boxShadow: `0 0 8px ${genre.color}cc` }}
          />
          <span
            className="font-label-md text-label-md font-bold tracking-wider uppercase truncate"
            style={{ color: genre.color }}
          >
            {genre.name}
          </span>
          <span className="font-label-sm text-label-sm text-text-muted px-1 rounded bg-surface-container-lowest flex-shrink-0">
            {projects.length} item{projects.length === 1 ? "" : "s"}
          </span>
        </div>
        {onEdit && (
          <button
            onClick={() => onEdit(genre)}
            className="ml-auto h-8 w-8 grid place-items-center rounded text-text-muted hover:text-text-primary hover:bg-surface-container-high transition-colors flex-shrink-0"
            title="Edit genre"
          >
            <Icon name="tune" className="text-[16px]" />
          </button>
        )}
      </div>

      {/* Branch children on a dashed circuit guide */}
      {open && (
        <div
          className="ml-3.5 pl-4 pt-3 border-l-2 border-dashed"
          style={{ borderColor: `${genre.color}55` }}
        >
          {projects.length === 0 ? (
            <p className="font-body-sm text-body-sm text-text-muted italic flex items-center gap-1.5">
              <Icon name="subdirectory_arrow_right" className="text-[14px]" />
              No projects in this branch yet.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} compact />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

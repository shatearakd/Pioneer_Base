import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listArchivedProjects,
  listGenres,
  listEntries,
  listMedia,
  reopenProject,
  projectByteSize,
} from "../db.js";
import { useApp } from "../store.js";
import { exportProjectZip } from "../lib/export.js";
import { humanSize } from "../lib/media.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Icon from "../components/Icon.jsx";
import { kindMeta, accent, projectCode, fmtDate } from "../lib/ui.js";

export default function Archive() {
  const navigate = useNavigate();
  const { dataVersion, bumpData } = useApp();
  const [status, setStatus] = useState("loading");
  const [projects, setProjects] = useState([]);
  const [genres, setGenres] = useState([]);
  const [stats, setStats] = useState({});
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      try {
        const [p, g] = await Promise.all([listArchivedProjects(), listGenres()]);
        if (!alive) return;
        setProjects(p);
        setGenres(g);
        const map = {};
        await Promise.all(
          p.map(async (proj) => {
            const [entries, media, bytes] = await Promise.all([
              listEntries(proj.id),
              listMedia(proj.id),
              projectByteSize(proj.id),
            ]);
            map[proj.id] = { logs: entries.length, media: media.length, bytes };
          })
        );
        if (!alive) return;
        setStats(map);
        setStatus("ready");
      } catch (e) {
        console.error(e);
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [dataVersion]);

  const genreMap = useMemo(
    () => Object.fromEntries(genres.map((g) => [g.id, g])),
    [genres]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (genreFilter !== "all" && p.genreId !== genreFilter) return false;
      if (!q) return true;
      return [p.title, p.overview, p.kind, (p.tags || []).join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [projects, query, genreFilter]);

  if (status === "loading") return <LoadingBlock />;
  if (status === "error") return <ErrorState onRetry={bumpData} />;

  return (
    <div className="space-y-5">
      <div className="panel p-space-md relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-primary/5 rounded-full pointer-events-none blur-xl" />
        <div className="flex items-center justify-between gap-2">
          <span className="label text-primary flex items-center gap-1.5">
            <Icon name="lock" className="text-[16px]" /> Archive repository // Cold storage
          </span>
          <span className="chip chip-nominal">
            <span className="w-1.5 h-1.5 rounded-full bg-status-nominal" />
            {projects.length} sealed
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-text-primary tracking-tight mt-2">
          Cryo-Archived Inventions
        </h1>
        <p className="font-body-sm text-body-sm text-text-muted mt-1">
          Completed experiments, projects, and inventions live here — separate from the active
          research vault.
        </p>
      </div>

      <div className="flex items-center justify-between panel-2 px-3 py-2">
        <span className="font-label-sm text-label-sm text-text-muted flex items-center gap-1.5">
          <Icon name="verified_user" className="text-[16px]" />
          Local archive • read-only until reopened
        </span>
        <Link to="/export" className="font-label-sm text-label-sm text-primary hover:underline">
          Batch export →
        </Link>
      </div>

      <div className="panel p-space-md space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
            <Icon name="search" className="text-[18px]" />
          </span>
          <input
            className="field pl-10"
            placeholder="Search archived projects or tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <FilterChip
            active={genreFilter === "all"}
            onClick={() => setGenreFilter("all")}
          >
            All archives ({projects.length})
          </FilterChip>
          {genres.map((g) => {
            const n = projects.filter((p) => p.genreId === g.id).length;
            if (!n) return null;
            return (
              <FilterChip
                key={g.id}
                active={genreFilter === g.id}
                onClick={() => setGenreFilter(g.id)}
              >
                {g.name} ({n})
              </FilterChip>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="Cold storage is empty."
          hint="Archive a finished project from its lab page to seal it here."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((p) => {
            const km = kindMeta(p.kind);
            const a = accent(km.accent);
            const genre = genreMap[p.genreId];
            const s = stats[p.id] || { logs: 0, media: 0, bytes: 0 };
            return (
              <article key={p.id} className="panel overflow-hidden">
                <div className={`h-1 w-full ${a.bar}`} />
                <div className="p-space-md space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="chip chip-nominal">
                          <Icon name="lock" className="text-[12px]" /> Archived & sealed
                        </span>
                        <span className="font-label-sm text-label-sm text-text-muted">
                          {fmtDate(p.archivedAt || p.updatedAt)}
                        </span>
                      </div>
                      <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight">
                        {projectCode(p)}: {p.title}
                      </h2>
                    </div>
                    <span className={`h-10 w-10 rounded-lg grid place-items-center ${a.bg} ${a.text} flex-shrink-0`}>
                      <Icon name={km.icon} className="text-[20px]" />
                    </span>
                  </div>

                  {p.overview && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {p.overview}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {genre && (
                      <span className="chip chip-primary">#{genre.name}</span>
                    )}
                    <span className="chip">{km.label}</span>
                    {(p.tags || []).slice(0, 4).map((t) => (
                      <span key={t} className="chip">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between font-label-sm text-label-sm text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <Icon name="inventory_2" className="text-[15px]" />
                      {s.logs} logs • {s.media} media
                    </span>
                    <span>{humanSize(s.bytes) || "0 B"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className="btn-ghost"
                      onClick={() => navigate(`/project/${p.id}`)}
                    >
                      <Icon name="fingerprint" className="text-[15px]" /> Inspect
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={async () => {
                        await reopenProject(p.id);
                        bumpData();
                      }}
                    >
                      <Icon name="lock_open" className="text-[15px]" /> Reopen
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => exportProjectZip(p.id)}
                    >
                      <Icon name="download" className="text-[15px]" /> Dossier
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded font-label-sm text-label-sm whitespace-nowrap shrink-0 transition-colors ${
        active ? "bg-primary text-on-primary" : "bg-surface-container text-text-muted hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingBlock() {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-text-muted">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span className="font-label-md text-label-md tracking-widest uppercase">Loading…</span>
    </div>
  );
}

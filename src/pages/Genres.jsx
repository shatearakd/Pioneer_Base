import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listGenres, listActiveProjects } from "../db.js";
import { useApp } from "../store.js";
import FolderTree from "../components/FolderTree.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Modal from "../components/Modal.jsx";
import GenreForm from "../components/GenreForm.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import Icon from "../components/Icon.jsx";

export default function Genres() {
  const navigate = useNavigate();
  const { dataVersion, bumpData } = useApp();
  const [status, setStatus] = useState("loading");
  const [genres, setGenres] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("");
  const [genreModal, setGenreModal] = useState({ open: false, genre: null });
  const [showProject, setShowProject] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      try {
        const [g, p] = await Promise.all([listGenres(), listActiveProjects()]);
        if (!alive) return;
        setGenres(g);
        setProjects(p);
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

  const { byGenre, unfiled } = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const matchP = (p) =>
      !q ||
      [p.title, p.overview, p.kind, (p.tags || []).join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    const map = {};
    const none = [];
    for (const p of projects) {
      if (!matchP(p)) continue;
      if (p.genreId) (map[p.genreId] ||= []).push(p);
      else none.push(p);
    }
    return { byGenre: map, unfiled: none };
  }, [projects, filter]);

  const visibleGenres = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.tags || []).join(" ").toLowerCase().includes(q) ||
        (byGenre[g.id] || []).length > 0
    );
  }, [genres, byGenre, filter]);

  if (status === "loading") return <LoadingBlock />;
  if (status === "error") return <ErrorState onRetry={bumpData} />;

  const empty = genres.length === 0 && projects.length === 0;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg text-text-primary">Taxonomy</h1>
            <span className="chip chip-primary">
              {genres.length} branch{genres.length === 1 ? "" : "es"}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-text-muted mt-1">
            Active research vault only.{" "}
            <Link to="/archive" className="text-primary hover:underline">
              Open cold-storage archive →
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-ghost"
            onClick={() => setGenreModal({ open: true, genre: null })}
          >
            <Icon name="create_new_folder" className="text-[18px]" /> Genre
          </button>
          <button className="btn-primary" onClick={() => setShowProject(true)}>
            <Icon name="add" className="text-[18px]" /> Project
          </button>
        </div>
      </header>

      {!empty && (
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
            <Icon name="search" className="text-[18px]" />
          </span>
          <input
            className="field pl-10 pr-9"
            placeholder="Filter by keyword, genre, or #tag…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-on-surface"
              onClick={() => setFilter("")}
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          )}
        </div>
      )}

      {empty ? (
        <EmptyState
          icon="account_tree"
          title="Nothing yet."
          hint="Add a genre branch, then start placing projects inside it."
          action={
            <button
              className="btn-primary"
              onClick={() => setGenreModal({ open: true, genre: null })}
            >
              <Icon name="create_new_folder" className="text-[18px]" /> Create genre
            </button>
          }
        />
      ) : (
        <FolderTree
          genres={visibleGenres}
          projectsByGenre={byGenre}
          unfiled={unfiled}
          onEditGenre={(g) => setGenreModal({ open: true, genre: g })}
        />
      )}

      <Modal
        open={genreModal.open}
        onClose={() => setGenreModal({ open: false, genre: null })}
        title={genreModal.genre ? "Edit genre" : "New genre"}
      >
        <GenreForm
          genre={genreModal.genre}
          onCancel={() => setGenreModal({ open: false, genre: null })}
          onSaved={() => {
            setGenreModal({ open: false, genre: null });
            bumpData();
          }}
        />
      </Modal>

      <Modal open={showProject} onClose={() => setShowProject(false)} title="New project">
        <ProjectForm
          onCancel={() => setShowProject(false)}
          onSaved={(p) => {
            setShowProject(false);
            bumpData();
            navigate(`/project/${p.id}`);
          }}
        />
      </Modal>
    </div>
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

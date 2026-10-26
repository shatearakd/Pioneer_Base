import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listGenres, listProjects } from "../db.js";
import { useApp } from "../store.js";
import FolderTree from "../components/FolderTree.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Modal from "../components/Modal.jsx";
import GenreForm from "../components/GenreForm.jsx";
import ProjectForm from "../components/ProjectForm.jsx";

export default function Genres() {
  const navigate = useNavigate();
  const { dataVersion, bumpData } = useApp();
  const [status, setStatus] = useState("loading");
  const [genres, setGenres] = useState([]);
  const [byGenre, setByGenre] = useState({});
  const [unfiled, setUnfiled] = useState([]);
  const [genreModal, setGenreModal] = useState({ open: false, genre: null });
  const [showProject, setShowProject] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      try {
        const [g, projects] = await Promise.all([listGenres(), listProjects()]);
        if (!alive) return;
        const map = {};
        const none = [];
        for (const p of projects) {
          if (p.genreId) (map[p.genreId] ||= []).push(p);
          else none.push(p);
        }
        setGenres(g);
        setByGenre(map);
        setUnfiled(none);
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

  if (status === "loading")
    return <div className="py-20 text-center text-ink/40 font-header">Loading…</div>;
  if (status === "error") return <ErrorState onRetry={bumpData} />;

  const empty = genres.length === 0 && unfiled.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-ink">Folder tree</h1>
          <p className="font-header text-ink/50 text-sm mt-1">
            Your projects, experiments, and inventions by genre.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setGenreModal({ open: true, genre: null })}>
            + Genre
          </button>
          <button className="btn-primary" onClick={() => setShowProject(true)}>
            + Project
          </button>
        </div>
      </header>

      {empty ? (
        <EmptyState
          title="Nothing yet."
          hint="Add a genre folder, then start placing projects inside it."
          action={
            <button className="btn-primary" onClick={() => setGenreModal({ open: true, genre: null })}>
              + Create genre
            </button>
          }
        />
      ) : (
        <FolderTree
          genres={genres}
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

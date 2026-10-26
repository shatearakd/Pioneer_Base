import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getPrimaryProject,
  getLastOpenedProject,
  listGenres,
  listProjects,
  listProjectsByGenre,
  listMilestones,
  getGenre,
} from "../db.js";
import { useApp } from "../store.js";
import ProjectCard from "../components/ProjectCard.jsx";
import Timeline from "../components/Timeline.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Modal from "../components/Modal.jsx";
import ProjectForm from "../components/ProjectForm.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { dataVersion, bumpData } = useApp();
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [primary, setPrimary] = useState(null);
  const [primaryGenre, setPrimaryGenre] = useState(null);
  const [primaryMilestones, setPrimaryMilestones] = useState([]);
  const [lastOpened, setLastOpened] = useState(null);
  const [genres, setGenres] = useState([]);
  const [projects, setProjects] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      try {
        const [p, last, g, all] = await Promise.all([
          getPrimaryProject(),
          getLastOpenedProject(),
          listGenres(),
          listProjects(),
        ]);
        if (!alive) return;
        setPrimary(p);
        setLastOpened(last);
        setGenres(g);
        setProjects(all);
        setGenreMap(Object.fromEntries(g.map((x) => [x.id, x])));
        if (p) {
          const [pg, ms] = await Promise.all([
            p.genreId ? getGenre(p.genreId) : null,
            listMilestones(p.id),
          ]);
          if (!alive) return;
          setPrimaryGenre(pg);
          setPrimaryMilestones(ms);
        } else {
          setPrimaryGenre(null);
          setPrimaryMilestones([]);
        }
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

  if (status === "loading") {
    return <div className="py-20 text-center text-ink/40 font-header">Loading…</div>;
  }
  if (status === "error") {
    return <ErrorState onRetry={bumpData} />;
  }

  const hasAnything = projects.length > 0 || genres.length > 0;

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="font-header text-ink/50 text-sm">Welcome back, Pioneer</p>
          <h1 className="font-title text-2xl tracking-wide text-ink mt-1">Dashboard</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + New project
        </button>
      </header>

      {!hasAnything && (
        <EmptyState
          title="Nothing yet."
          hint="Create your first project, experiment, or invention to get started."
          action={
            <button className="btn-primary" onClick={() => setShowNew(true)}>
              + New project
            </button>
          }
        />
      )}

      {hasAnything && (
        <>
          {/* Resume where you left off */}
          {lastOpened && (!primary || lastOpened.id !== primary.id) && (
            <Link
              to={`/project/${lastOpened.id}`}
              className="flex items-center justify-between glass rounded-2xl px-4 py-3 hover:border-teal/40 transition"
            >
              <span className="text-sm text-ink/70">
                Continue where you left off —{" "}
                <span className="text-ink font-header">{lastOpened.title}</span>
              </span>
              <span className="text-teal">→</span>
            </Link>
          )}

          {/* Primary experiment */}
          <section>
            <h2 className="font-header text-sm uppercase tracking-widest text-ink/45 mb-3">
              Main experiment
            </h2>
            {primary ? (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <ProjectCard project={primary} genre={primaryGenre} primary />
                </div>
                <div className="glass rounded-2xl p-4">
                  <h3 className="font-header text-sm text-ink/60 mb-3">Timeline so far</h3>
                  <div className="max-h-56 overflow-y-auto pr-1">
                    <Timeline milestones={primaryMilestones} />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No primary experiment set."
                hint="Open a project and mark it primary, or create one here."
                action={
                  <button className="btn-ghost" onClick={() => setShowNew(true)}>
                    + New project
                  </button>
                }
              />
            )}
          </section>

          {/* Genre folders */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-header text-sm uppercase tracking-widest text-ink/45">
                Genre folders
              </h2>
              <Link to="/genres" className="text-sm text-teal hover:underline">
                Open folder tree →
              </Link>
            </div>
            {genres.length === 0 ? (
              <p className="text-ink/45 text-sm">No genres yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {genres.map((g) => (
                  <GenreTile key={g.id} genre={g} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New project">
        <ProjectForm
          onCancel={() => setShowNew(false)}
          onSaved={(p) => {
            setShowNew(false);
            bumpData();
            navigate(`/project/${p.id}`);
          }}
        />
      </Modal>
    </div>
  );
}

function GenreTile({ genre }) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    listProjectsByGenre(genre.id).then((p) => setCount(p.length));
  }, [genre.id]);
  return (
    <Link
      to={`/genres?genre=${genre.id}`}
      className="glass rounded-2xl p-4 hover:-translate-y-0.5 transition block"
    >
      <div className="flex items-center gap-3">
        <span
          className="h-9 w-9 rounded-xl grid place-items-center text-base-950 font-bold"
          style={{ background: genre.color }}
        >
          {genre.name[0]?.toUpperCase()}
        </span>
        <div>
          <div className="font-header text-ink">{genre.name}</div>
          <div className="text-xs text-ink/45">
            {count == null ? "…" : `${count} project${count === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>
      {genre.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {genre.tags.slice(0, 3).map((t) => (
            <span key={t} className="chip">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

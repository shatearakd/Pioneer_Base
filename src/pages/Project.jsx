import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getProject,
  getGenre,
  listEntries,
  listMilestones,
  listReminders,
  saveMilestone,
  deleteMilestone,
  saveReminder,
  deleteReminder,
  deleteEntry,
  touchProject,
  setPrimaryProject,
  deleteProject,
} from "../db.js";
import { useApp } from "../store.js";
import { exportMarkdown, exportJSON } from "../lib/export.js";
import EntryComposer from "../components/EntryComposer.jsx";
import MediaPlayer from "../components/MediaPlayer.jsx";
import Timeline from "../components/Timeline.jsx";
import Modal from "../components/Modal.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";

const KIND_LABEL = {
  note: "Note",
  doc: "Document",
  audio: "Audio log",
  video: "Video log",
  result: "Result",
  hypothesis: "Hypothesis",
  labReport: "Lab report",
};

function groupByDay(entries) {
  const groups = {};
  for (const e of entries) {
    const day = new Date(e.date).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    (groups[day] ||= []).push(e);
  }
  return Object.entries(groups);
}

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bumpData } = useApp();
  const [status, setStatus] = useState("loading");
  const [project, setProject] = useState(null);
  const [genre, setGenre] = useState(null);
  const [entries, setEntries] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [tick, setTick] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", date: "" });
  const [newReminder, setNewReminder] = useState({ text: "", dueAt: "" });

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    touchProject(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      try {
        const p = await getProject(id);
        if (!alive) return;
        if (!p) {
          setStatus("missing");
          return;
        }
        const [g, e, m, r] = await Promise.all([
          p.genreId ? getGenre(p.genreId) : null,
          listEntries(id),
          listMilestones(id),
          listReminders(id),
        ]);
        if (!alive) return;
        setProject(p);
        setGenre(g);
        setEntries(e);
        setMilestones(m);
        setReminders(r);
        setStatus("ready");
      } catch (err) {
        console.error(err);
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, tick]);

  if (status === "loading")
    return <div className="py-20 text-center text-ink/40 font-header">Loading…</div>;
  if (status === "error") return <ErrorState message="Give us a sec. We are working it out." onRetry={refresh} />;
  if (status === "missing")
    return (
      <EmptyState
        title="That project could not be found."
        action={<Link className="btn-ghost" to="/">Back to dashboard</Link>}
      />
    );

  async function toggleMilestone(m) {
    await saveMilestone({ ...m, done: !m.done });
    refresh();
  }
  async function addMilestone(e) {
    e.preventDefault();
    if (!newMilestone.title.trim()) return;
    await saveMilestone({
      projectId: id,
      title: newMilestone.title,
      date: newMilestone.date || new Date().toISOString(),
    });
    setNewMilestone({ title: "", date: "" });
    refresh();
  }
  async function addReminder(e) {
    e.preventDefault();
    if (!newReminder.text.trim()) return;
    await saveReminder({
      projectId: id,
      text: newReminder.text,
      dueAt: newReminder.dueAt || new Date().toISOString(),
    });
    setNewReminder({ text: "", dueAt: "" });
    // Best-effort local notification permission prompt.
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    refresh();
  }
  async function makePrimary() {
    await setPrimaryProject(id);
    bumpData();
    refresh();
  }
  async function removeProject() {
    if (!window.confirm("Delete this project and all its logs? This cannot be undone.")) return;
    await deleteProject(id);
    bumpData();
    navigate("/");
  }

  const grouped = groupByDay(entries);

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-ink/50 hover:text-ink">
        ← Dashboard
      </Link>

      {/* Header */}
      <header className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="chip border border-teal/40 text-teal">{project.kind}</span>
              {project.isPrimary && (
                <span className="chip border border-teal/40 text-teal">Primary</span>
              )}
              {genre && (
                <span className="chip" style={{ color: genre.color }}>
                  {genre.name}
                </span>
              )}
            </div>
            <h1 className="font-title text-2xl text-ink tracking-wide">{project.title}</h1>
            {project.overview && (
              <p className="text-ink/60 mt-2 max-w-2xl">{project.overview}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!project.isPrimary && (
              <button className="btn-ghost" onClick={makePrimary}>
                Make primary
              </button>
            )}
            <button className="btn-ghost" onClick={() => setShowEdit(true)}>
              Edit
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn-ghost text-sm" onClick={() => exportMarkdown(id)}>
            Export .md
          </button>
          <button className="btn-ghost text-sm" onClick={() => exportJSON(id)}>
            Export .json
          </button>
          <button
            className="btn-ghost text-sm text-tangerine border-tangerine/30"
            onClick={removeProject}
          >
            Delete
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Log */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="font-header text-sm uppercase tracking-widest text-ink/45">
            Log & attachments
          </h2>
          <EntryComposer projectId={id} onSaved={refresh} />

          {entries.length === 0 ? (
            <EmptyState title="Oops, looks like we don't have anything listed." hint="Add a note, result, or recording above." />
          ) : (
            grouped.map(([day, items]) => (
              <div key={day}>
                <div className="text-xs uppercase tracking-widest text-ink/40 mb-2">{day}</div>
                <div className="space-y-3">
                  {items.map((e) => (
                    <article key={e.id} className="glass rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="chip border border-white/10">
                          {KIND_LABEL[e.kind] || e.kind}
                        </span>
                        <button
                          className="text-ink/30 hover:text-tangerine text-sm"
                          onClick={async () => {
                            await deleteEntry(e.id);
                            refresh();
                          }}
                          title="Delete entry"
                        >
                          ✕
                        </button>
                      </div>
                      {e.title && <h3 className="font-header text-ink mt-2">{e.title}</h3>}
                      {e.body && (
                        <p className="text-ink/70 text-sm mt-1 whitespace-pre-wrap">{e.body}</p>
                      )}
                      {e.mediaId && <MediaPlayer mediaId={e.mediaId} />}
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar: timeline + reminders */}
        <div className="space-y-6">
          <section className="glass rounded-2xl p-4">
            <h2 className="font-header text-sm uppercase tracking-widest text-ink/45 mb-3">
              Timeline
            </h2>
            <Timeline
              milestones={milestones}
              onToggle={toggleMilestone}
              onDelete={async (m) => {
                await deleteMilestone(m.id);
                refresh();
              }}
            />
            <form onSubmit={addMilestone} className="mt-4 space-y-2">
              <input
                className="field"
                placeholder="New milestone"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone((s) => ({ ...s, title: e.target.value }))}
              />
              <input
                type="date"
                className="field"
                value={newMilestone.date ? newMilestone.date.slice(0, 10) : ""}
                onChange={(e) =>
                  setNewMilestone((s) => ({
                    ...s,
                    date: e.target.value ? new Date(e.target.value).toISOString() : "",
                  }))
                }
              />
              <button className="btn-ghost w-full text-sm">Add milestone</button>
            </form>
          </section>

          <section className="glass rounded-2xl p-4">
            <h2 className="font-header text-sm uppercase tracking-widest text-ink/45 mb-3">
              Reminders
            </h2>
            {reminders.length === 0 ? (
              <p className="text-ink/45 text-sm italic">No reminders.</p>
            ) : (
              <ul className="space-y-2">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <div className="text-ink">{r.text}</div>
                      <div className="text-xs text-ink/40">
                        {new Date(r.dueAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="text-ink/30 hover:text-tangerine"
                      onClick={async () => {
                        await deleteReminder(r.id);
                        refresh();
                      }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addReminder} className="mt-4 space-y-2">
              <input
                className="field"
                placeholder="Remind me to…"
                value={newReminder.text}
                onChange={(e) => setNewReminder((s) => ({ ...s, text: e.target.value }))}
              />
              <input
                type="datetime-local"
                className="field"
                value={newReminder.dueAt ? newReminder.dueAt.slice(0, 16) : ""}
                onChange={(e) =>
                  setNewReminder((s) => ({
                    ...s,
                    dueAt: e.target.value ? new Date(e.target.value).toISOString() : "",
                  }))
                }
              />
              <button className="btn-ghost w-full text-sm">Add reminder</button>
            </form>
          </section>
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit project">
        <ProjectForm
          project={project}
          onCancel={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            bumpData();
            refresh();
          }}
        />
      </Modal>
    </div>
  );
}

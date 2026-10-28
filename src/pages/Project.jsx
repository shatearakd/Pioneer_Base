import { useEffect, useRef, useState } from "react";
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
import Icon from "../components/Icon.jsx";
import {
  kindMeta,
  accent,
  statusMeta,
  entryMeta,
  projectCode,
  progressPct,
  fmtDay,
  fmtDateTime,
} from "../lib/ui.js";

function groupByDay(entries) {
  const groups = {};
  for (const e of entries) {
    const day = fmtDay(e.date);
    (groups[day] ||= []).push(e);
  }
  return Object.entries(groups);
}

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bumpData } = useApp();
  const [statusState, setStatusState] = useState("loading");
  const [project, setProject] = useState(null);
  const [genre, setGenre] = useState(null);
  const [entries, setEntries] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState("logs");
  const [showEdit, setShowEdit] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", date: "" });
  const [newReminder, setNewReminder] = useState({ text: "", dueAt: "" });
  const composerRef = useRef(null);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    touchProject(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatusState("loading");
      try {
        const p = await getProject(id);
        if (!alive) return;
        if (!p) {
          setStatusState("missing");
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
        setStatusState("ready");
      } catch (err) {
        console.error(err);
        if (alive) setStatusState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, tick]);

  if (statusState === "loading") return <LoadingBlock />;
  if (statusState === "error")
    return <ErrorState message="Give us a sec. We are working it out." onRetry={refresh} />;
  if (statusState === "missing")
    return (
      <EmptyState
        icon="search_off"
        title="That project could not be found."
        action={
          <Link className="btn-ghost" to="/">
            <Icon name="arrow_back" className="text-[18px]" /> Back to dashboard
          </Link>
        }
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
  function jumpToComposer() {
    setTab("logs");
    setTimeout(() => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  const km = kindMeta(project.kind);
  const a = accent(km.accent);
  const sm = statusMeta(project.status);
  const sa = accent(sm.color);
  const pct = progressPct(milestones);
  const hypothesis = entries.find((e) => e.kind === "hypothesis");
  const statement = hypothesis?.body || project.overview;
  const grouped = groupByDay(entries);

  return (
    <div className="space-y-5 pb-4">
      {/* Breadcrumb / status strip */}
      <div className="flex items-center justify-between panel-2 px-3 py-2">
        <Link
          to="/"
          className="flex items-center gap-1.5 font-label-sm text-label-sm text-text-muted hover:text-on-surface min-w-0"
        >
          <Icon name="folder_special" className="text-[16px] text-primary flex-shrink-0" />
          <span className="truncate uppercase tracking-wider">
            {genre ? genre.name : "Unfiled"} / {projectCode(project)}
          </span>
        </Link>
        <span className={`flex items-center gap-1.5 font-label-sm text-label-sm flex-shrink-0 ${sa.text}`}>
          {sm.pulse && <span className={`w-2 h-2 rounded-full ${sa.bar} animate-pulse`} />}
          {project.isPrimary ? "Primary" : sm.label}
        </span>
      </div>

      {/* Header module */}
      <header className="relative panel p-space-md overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`chip ${a.soft} font-bold`}>#{projectCode(project)}</span>
            <span className="chip">{km.label}</span>
            {genre && (
              <span className="chip" style={{ color: genre.color }}>
                {genre.name}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {!project.isPrimary && (
              <button
                className="h-9 w-9 grid place-items-center rounded-lg text-tertiary hover:bg-surface-container-high transition-colors"
                onClick={makePrimary}
                title="Make primary"
              >
                <Icon name="star" className="text-[18px]" />
              </button>
            )}
            <button
              className="h-9 w-9 grid place-items-center rounded-lg text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={() => setShowEdit(true)}
              title="Edit"
            >
              <Icon name="edit" className="text-[18px]" />
            </button>
          </div>
        </div>

        <h1 className="relative font-headline-lg-mobile text-headline-lg-mobile text-text-primary tracking-tight mt-3 flex items-center gap-2">
          <Icon name={km.icon} className={`text-[24px] ${a.text}`} />
          {project.title}
        </h1>

        {statement && (
          <div className="relative panel-2 p-3 mt-3">
            <div className="flex items-center gap-1.5 text-primary mb-1">
              <Icon name="psychology" className="text-[15px]" />
              <span className="label text-primary">
                {hypothesis ? "Core hypothesis" : "Overview"}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap">
              {statement}
            </p>
          </div>
        )}

        {/* Lifecycle progress */}
        <div className="relative mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="label flex items-center gap-1.5">
              <Icon name="alt_route" className="text-[15px] text-secondary" /> Lifecycle progress
            </span>
            <span className={`font-telemetry-val text-label-lg ${a.text}`}>{pct}%</span>
          </div>
          <div className="w-full bg-surface-container-lowest rounded-full h-2 overflow-hidden">
            <div className={`${a.bar} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Export row */}
        <div className="relative flex flex-wrap gap-2 mt-4 pt-4 border-t border-surface-border/70">
          <button className="btn-ghost" onClick={() => exportMarkdown(id)}>
            <Icon name="description" className="text-[16px]" /> Export .md
          </button>
          <button className="btn-ghost" onClick={() => exportJSON(id)}>
            <Icon name="data_object" className="text-[16px]" /> Export .json
          </button>
          <button className="btn-danger ml-auto" onClick={removeProject}>
            <Icon name="delete" className="text-[16px]" /> Delete
          </button>
        </div>
      </header>

      {/* Segmented tabs */}
      <div className="grid grid-cols-2 p-1 panel-2 gap-1">
        <TabButton active={tab === "logs"} onClick={() => setTab("logs")} icon="dynamic_feed">
          Lab Logs ({entries.length})
        </TabButton>
        <TabButton active={tab === "timeline"} onClick={() => setTab("timeline")} icon="timeline">
          Timeline & Reminders
        </TabButton>
      </div>

      {/* Logs tab */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div ref={composerRef}>
            <EntryComposer projectId={id} onSaved={refresh} />
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon="note_stack"
              title="No logs yet."
              hint="Add a note, result, or recording with the composer above."
            />
          ) : (
            grouped.map(([day, items]) => (
              <div key={day}>
                <div className="label mb-2 flex items-center gap-1.5">
                  <Icon name="calendar_today" className="text-[13px]" /> {day}
                </div>
                <div className="space-y-3">
                  {items.map((e) => (
                    <LogCard
                      key={e.id}
                      entry={e}
                      onDelete={async () => {
                        await deleteEntry(e.id);
                        refresh();
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Timeline tab */}
      {tab === "timeline" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <section className="panel p-space-md">
            <h2 className="label mb-3 flex items-center gap-1.5">
              <Icon name="alt_route" className="text-[15px] text-secondary" /> Milestones
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
                className="field-mono"
                value={newMilestone.date ? newMilestone.date.slice(0, 10) : ""}
                onChange={(e) =>
                  setNewMilestone((s) => ({
                    ...s,
                    date: e.target.value ? new Date(e.target.value).toISOString() : "",
                  }))
                }
              />
              <button className="btn-ghost w-full">
                <Icon name="add" className="text-[16px]" /> Add milestone
              </button>
            </form>
          </section>

          <section className="panel p-space-md">
            <h2 className="label mb-3 flex items-center gap-1.5">
              <Icon name="notifications" className="text-[15px] text-tertiary" /> Reminders
            </h2>
            {reminders.length === 0 ? (
              <p className="font-body-sm text-body-sm text-text-muted italic">No reminders.</p>
            ) : (
              <ul className="space-y-2">
                {reminders.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-2 panel-2 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-body-md text-body-md text-on-surface">{r.text}</div>
                      <div className="font-label-sm text-label-sm text-text-muted">
                        {fmtDateTime(r.dueAt)}
                      </div>
                    </div>
                    <button
                      className="text-text-muted hover:text-status-critical transition-colors flex-shrink-0"
                      onClick={async () => {
                        await deleteReminder(r.id);
                        refresh();
                      }}
                    >
                      <Icon name="close" className="text-[16px]" />
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
                className="field-mono"
                value={newReminder.dueAt ? newReminder.dueAt.slice(0, 16) : ""}
                onChange={(e) =>
                  setNewReminder((s) => ({
                    ...s,
                    dueAt: e.target.value ? new Date(e.target.value).toISOString() : "",
                  }))
                }
              />
              <button className="btn-ghost w-full">
                <Icon name="add" className="text-[16px]" /> Add reminder
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Sticky action dock */}
      <div className="sticky bottom-20 md:bottom-4 z-30 flex items-center gap-2 panel bg-surface-overlay/95 backdrop-blur-md p-2 shadow-2xl">
        <button className="btn-primary flex-1" onClick={jumpToComposer}>
          <Icon name="add_circle" className="text-[16px]" /> Add Log
        </button>
        <button
          className="btn-ghost text-secondary"
          onClick={jumpToComposer}
          title="Voice / audio log"
        >
          <Icon name="mic" className="text-[16px]" />
          <span className="hidden xs:inline">Voice</span>
        </button>
        <button
          className="btn-ghost text-tertiary"
          onClick={() => exportMarkdown(id)}
          title="Generate report"
        >
          <Icon name="print" className="text-[16px]" />
          <span className="hidden xs:inline">Report</span>
        </button>
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

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2 px-3 rounded font-label-md text-label-md transition-all ${
        active
          ? "bg-primary text-surface-base shadow-sm"
          : "text-text-muted hover:text-on-surface"
      }`}
    >
      <Icon name={icon} className="text-[18px]" />
      {children}
    </button>
  );
}

function LogCard({ entry, onDelete }) {
  const m = entryMeta(entry.kind);
  const a = accent(m.accent);
  return (
    <article className="panel p-space-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-8 w-8 rounded-lg grid place-items-center ${a.bg} ${a.text} flex-shrink-0`}>
            <Icon name={m.icon} className="text-[18px]" />
          </span>
          <div className="min-w-0">
            {entry.title && (
              <h3 className="font-headline-sm text-body-md text-text-primary truncate">
                {entry.title}
              </h3>
            )}
            <span className="font-label-sm text-label-sm text-text-muted">{m.label}</span>
          </div>
        </div>
        <button
          className="text-text-muted hover:text-status-critical transition-colors flex-shrink-0"
          onClick={onDelete}
          title="Delete entry"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
      {entry.body && (
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 whitespace-pre-wrap">
          {entry.body}
        </p>
      )}
      {entry.mediaId && <MediaPlayer mediaId={entry.mediaId} />}
    </article>
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

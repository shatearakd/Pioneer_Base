import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listIdeas, addIdea, deleteIdea, updateIdea, saveProject } from "../db.js";
import { useApp } from "../store.js";
import VoiceButton from "../components/VoiceButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Icon from "../components/Icon.jsx";
import { fmtDate } from "../lib/ui.js";

const QUICK_TAGS = ["Energy", "Robotics", "Sensors", "Firmware"];

export default function Ideas() {
  const navigate = useNavigate();
  const { bumpData } = useApp();
  const [status, setStatus] = useState("loading");
  const [ideas, setIdeas] = useState([]);
  const [text, setText] = useState("");
  const [voiceSource, setVoiceSource] = useState(false);
  const [draftTags, setDraftTags] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  async function load() {
    setStatus("loading");
    try {
      setIdeas(await listIdeas());
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e?.preventDefault();
    if (!text.trim()) return;
    await addIdea({
      text,
      source: voiceSource ? "voice" : "text",
      tags: draftTags,
    });
    setText("");
    setVoiceSource(false);
    setDraftTags([]);
    load();
  }

  async function promote(idea) {
    const p = await saveProject({
      title: idea.text.slice(0, 60),
      kind: "experiment",
      overview: idea.text,
      tags: idea.tags || [],
    });
    await updateIdea({ ...idea, linkedProjectId: p.id, promotedAt: new Date().toISOString() });
    bumpData();
    load();
    navigate(`/project/${p.id}`);
  }

  const tagsInUse = useMemo(() => {
    const set = new Set(QUICK_TAGS);
    for (const i of ideas) for (const t of i.tags || []) set.add(t);
    return [...set];
  }, [ideas]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = ideas.filter((i) => {
      if (filter !== "all" && !(i.tags || []).includes(filter)) return false;
      if (!q) return true;
      return [i.text, (i.tags || []).join(" ")].join(" ").toLowerCase().includes(q);
    });
    if (sort === "oldest") list = [...list].reverse();
    if (sort === "promoted") {
      list = [...list].sort((a, b) => Number(!!b.linkedProjectId) - Number(!!a.linkedProjectId));
    }
    return list;
  }, [ideas, filter, search, sort]);

  const promoted = ideas.filter((i) => i.linkedProjectId).length;
  const voiceCount = ideas.filter((i) => i.source === "voice").length;

  if (status === "loading") return <LoadingBlock />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-primary/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative flex items-center justify-between">
          <span className="label text-primary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-nominal shadow-[0_0_8px_rgba(0,229,155,0.7)] animate-pulse" />
            Sys // Incubator matrix
          </span>
          <span className="chip chip-amber">
            <Icon name="bolt" className="text-[14px]" /> Batch #{String(ideas.length).padStart(2, "0")}
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-text-primary tracking-tight mt-1">
          Idea Log & Spark Incubator
        </h1>
        <p className="font-body-sm text-body-sm text-text-muted mt-1">
          Rapid concept capture. Promote a spark into the active research vault when it is ready for a bench.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Raw sparks" value={ideas.length} hint="active" color="text-primary" />
        <Stat label="Promoted" value={promoted} hint="in lab" color="text-status-nominal" />
        <Stat label="Voice" value={voiceCount} hint="dictated" color="text-tertiary" />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <TagChip active={filter === "all"} onClick={() => setFilter("all")} icon="apps">
          All sparks ({ideas.length})
        </TagChip>
        {tagsInUse.map((t) => (
          <TagChip key={t} active={filter === t} onClick={() => setFilter(t)}>
            {t} ({ideas.filter((i) => (i.tags || []).includes(t)).length})
          </TagChip>
        ))}
      </div>

      <form onSubmit={add} className="panel bg-surface-overlay p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-text-primary flex items-center gap-1.5">
            <Icon name="lightbulb_circle" className="text-[18px] text-primary" /> Fast spark ingestion
          </span>
          <span className="chip chip-primary">On-device</span>
        </div>
        <textarea
          className="field min-h-[72px]"
          placeholder="e.g. Piezoelectric shoe insoles that charge earbuds while walking…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="label mr-1">Tag:</span>
          {QUICK_TAGS.map((t) => {
            const on = draftTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setDraftTags((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))
                }
                className={`px-2 py-0.5 rounded font-label-sm text-label-sm ${
                  on ? "bg-primary/20 text-primary" : "bg-surface-panel text-on-surface"
                }`}
              >
                #{t}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <VoiceButton
            onFinal={(t) => {
              if (t) {
                setText((prev) => (prev ? `${prev} ${t}` : t));
                setVoiceSource(true);
              }
            }}
          />
          <button type="submit" className="btn-primary flex-1" disabled={!text.trim()}>
            <Icon name="add_circle" className="text-[18px]" /> Log spark idea
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
            <Icon name="search" className="text-[18px]" />
          </span>
          <input
            className="field pl-10"
            placeholder="Filter ideas or tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-1 text-text-muted">
            <Icon name="tune" className="text-[16px]" />
            <span className="font-label-sm text-label-sm">Sort:</span>
            <select
              className="bg-surface-panel text-text-primary font-label-sm text-label-sm rounded px-1.5 py-0.5"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest ingestions</option>
              <option value="oldest">Oldest first</option>
              <option value="promoted">Promoted first</option>
            </select>
          </label>
          <span className="font-label-sm text-label-sm text-primary">{visible.length} showing</span>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="lightbulb"
          title="No sparks yet."
          hint="Capture an idea above. Promote it to the lab when you are ready to run it."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((idea) => (
            <li key={idea.number} className="panel p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="index-tag">#{String(idea.number).padStart(3, "0")}</span>
                    {(idea.tags || []).map((t) => (
                      <span key={t} className="chip chip-amber">
                        #{t}
                      </span>
                    ))}
                    {idea.linkedProjectId && (
                      <span className="chip chip-nominal">Promoted</span>
                    )}
                    {idea.source === "voice" && (
                      <span className="chip chip-primary">
                        <Icon name="mic" className="text-[12px]" /> voice
                      </span>
                    )}
                  </div>
                  <p className="font-headline-sm text-headline-sm text-text-primary leading-tight whitespace-pre-wrap">
                    {idea.text}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-label-sm text-label-sm text-text-muted">
                  {fmtDate(idea.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  {idea.linkedProjectId ? (
                    <button
                      className="btn-ghost !py-1.5"
                      onClick={() => navigate(`/project/${idea.linkedProjectId}`)}
                    >
                      Open lab <Icon name="arrow_forward" className="text-[14px]" />
                    </button>
                  ) : (
                    <button className="btn-primary !py-1.5" onClick={() => promote(idea)}>
                      Promote to lab <Icon name="arrow_forward" className="text-[14px]" />
                    </button>
                  )}
                  <button
                    className="font-label-sm text-label-sm text-text-muted hover:text-status-critical"
                    onClick={async () => {
                      await deleteIdea(idea.number);
                      load();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, hint, color }) {
  return (
    <div className="panel p-2.5">
      <span className="label">{label}</span>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className={`font-telemetry-val text-telemetry-val ${color}`}>
          {String(value).padStart(2, "0")}
        </span>
        <span className="font-label-sm text-label-sm text-text-muted">{hint}</span>
      </div>
    </div>
  );
}

function TagChip({ active, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap ${
        active
          ? "bg-primary text-on-primary shadow-[0_0_10px_rgba(82,216,231,0.3)]"
          : "bg-surface-panel text-on-surface-variant hover:text-text-primary"
      }`}
    >
      {icon && <Icon name={icon} className="text-[14px]" />}
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listIdeas, addIdea, deleteIdea, saveProject } from "../db.js";
import { useApp } from "../store.js";
import VoiceButton from "../components/VoiceButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Icon from "../components/Icon.jsx";
import { fmtDate } from "../lib/ui.js";

export default function Ideas() {
  const navigate = useNavigate();
  const { bumpData } = useApp();
  const [status, setStatus] = useState("loading");
  const [ideas, setIdeas] = useState([]);
  const [text, setText] = useState("");
  const [voiceSource, setVoiceSource] = useState(false);

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
    await addIdea({ text, source: voiceSource ? "voice" : "text" });
    setText("");
    setVoiceSource(false);
    load();
  }

  async function promote(idea) {
    const p = await saveProject({
      title: idea.text.slice(0, 60),
      kind: "project",
      overview: idea.text,
    });
    await deleteIdea(idea.number);
    bumpData();
    navigate(`/project/${p.id}`);
  }

  if (status === "loading") return <LoadingBlock />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg text-text-primary">Idea Vault</h1>
            <span className="chip chip-amber">
              {ideas.length} spark{ideas.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-text-muted mt-1">
            Capture every spark. Each idea gets a number so you can return to it.
          </p>
        </div>
      </header>

      <form onSubmit={add} className="panel p-space-md space-y-3">
        <div className="flex items-center gap-1.5 text-tertiary">
          <Icon name="lightbulb" className="text-[16px]" />
          <span className="label text-tertiary">New spark</span>
        </div>
        <textarea
          className="field min-h-[72px]"
          placeholder="Jot an idea, or dictate it with the mic…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary" disabled={!text.trim()}>
            <Icon name="bolt" className="text-[16px]" /> Save idea
          </button>
          <VoiceButton
            onFinal={(t) => {
              if (t) {
                setText((prev) => (prev ? `${prev} ${t}` : t));
                setVoiceSource(true);
              }
            }}
          />
        </div>
      </form>

      {ideas.length === 0 ? (
        <EmptyState
          icon="lightbulb"
          title="No sparks yet."
          hint="Your captured ideas will be numbered and listed here."
        />
      ) : (
        <ul className="space-y-2.5">
          {ideas.map((idea) => (
            <li key={idea.number} className="panel p-space-md flex items-start gap-3">
              <span className="index-tag shrink-0 pt-0.5 w-12">
                #{String(idea.number).padStart(3, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
                  {idea.text}
                </p>
                <div className="font-label-sm text-label-sm text-text-muted mt-1.5 flex items-center gap-2">
                  <span>{fmtDate(idea.createdAt)}</span>
                  {idea.source === "voice" && (
                    <span className="chip chip-primary">
                      <Icon name="mic" className="text-[12px]" /> voice
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                <button
                  className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1"
                  onClick={() => promote(idea)}
                  title="Turn this idea into a project"
                >
                  <Icon name="rocket_launch" className="text-[14px]" /> Project
                </button>
                <button
                  className="font-label-sm text-label-sm text-text-muted hover:text-status-critical transition-colors"
                  onClick={async () => {
                    await deleteIdea(idea.number);
                    load();
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listIdeas, addIdea, deleteIdea, saveProject } from "../db.js";
import { useApp } from "../store.js";
import VoiceButton from "../components/VoiceButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";

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

  if (status === "loading")
    return <div className="py-20 text-center text-ink/40 font-header">Loading…</div>;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-title text-2xl tracking-wide text-ink">Idea vault</h1>
        <p className="font-header text-ink/50 text-sm mt-1">
          Capture every spark. Each idea gets a number so you can return to it.
        </p>
      </header>

      <form onSubmit={add} className="glass rounded-2xl p-4 space-y-3">
        <textarea
          className="field min-h-[70px]"
          placeholder="Jot an idea, or dictate it with the mic…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary" disabled={!text.trim()}>
            Save idea
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
        <EmptyState title="Nothing yet." hint="Your captured ideas will be numbered and listed here." />
      ) : (
        <ul className="space-y-2">
          {ideas.map((idea) => (
            <li key={idea.number} className="glass rounded-2xl p-4 flex items-start gap-3">
              <span className="font-title text-teal text-sm shrink-0 w-10">
                #{String(idea.number).padStart(3, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-ink whitespace-pre-wrap">{idea.text}</p>
                <div className="text-xs text-ink/40 mt-1 flex items-center gap-2">
                  <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                  {idea.source === "voice" && <span className="chip">voice</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <button
                  className="text-xs text-teal hover:underline"
                  onClick={() => promote(idea)}
                  title="Turn this idea into a project"
                >
                  → Project
                </button>
                <button
                  className="text-xs text-ink/30 hover:text-tangerine"
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

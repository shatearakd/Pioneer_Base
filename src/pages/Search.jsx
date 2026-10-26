import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { search } from "../db.js";
import EmptyState from "../components/EmptyState.jsx";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const query = params.get("q") || "";
    setQ(query);
    if (!query.trim()) {
      setResults(null);
      return;
    }
    let alive = true;
    setBusy(true);
    search(query)
      .then((r) => alive && setResults(r))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [params]);

  function onSubmit(e) {
    e.preventDefault();
    setParams(q.trim() ? { q: q.trim() } : {});
  }

  const total =
    results && results.projects.length + results.entries.length + results.ideas.length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-title text-2xl tracking-wide text-ink">Search</h1>
        <p className="font-header text-ink/50 text-sm mt-1">
          Find projects, log entries, and ideas by keyword.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="field"
          placeholder="Search keywords…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <button className="btn-primary" type="submit">
          Search
        </button>
      </form>

      {busy && <p className="text-ink/40 text-sm">Searching…</p>}

      {results && total === 0 && !busy && (
        <EmptyState title="No matches." hint="Try a different keyword." />
      )}

      {results && total > 0 && (
        <div className="space-y-6">
          {results.projects.length > 0 && (
            <Section title={`Projects (${results.projects.length})`}>
              {results.projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/project/${p.id}`}
                  className="glass rounded-2xl p-3 block hover:border-teal/40 transition"
                >
                  <div className="text-xs text-ink/50">{p.kind}</div>
                  <div className="font-header text-ink">{p.title}</div>
                  {p.overview && <p className="text-sm text-ink/55 line-clamp-1">{p.overview}</p>}
                </Link>
              ))}
            </Section>
          )}

          {results.entries.length > 0 && (
            <Section title={`Log entries (${results.entries.length})`}>
              {results.entries.map((e) => (
                <Link
                  key={e.id}
                  to={`/project/${e.projectId}`}
                  className="glass rounded-2xl p-3 block hover:border-teal/40 transition"
                >
                  <div className="text-xs text-ink/50">{e.kind}</div>
                  <div className="font-header text-ink">{e.title || "(untitled)"}</div>
                  {e.body && <p className="text-sm text-ink/55 line-clamp-2">{e.body}</p>}
                </Link>
              ))}
            </Section>
          )}

          {results.ideas.length > 0 && (
            <Section title={`Ideas (${results.ideas.length})`}>
              {results.ideas.map((i) => (
                <Link
                  key={i.number}
                  to="/ideas"
                  className="glass rounded-2xl p-3 block hover:border-teal/40 transition"
                >
                  <span className="font-title text-teal text-xs mr-2">
                    #{String(i.number).padStart(3, "0")}
                  </span>
                  <span className="text-ink text-sm">{i.text}</span>
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-header text-sm uppercase tracking-widest text-ink/45 mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

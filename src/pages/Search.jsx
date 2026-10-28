import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { search } from "../db.js";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";
import { entryMeta, accent, kindMeta } from "../lib/ui.js";

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
    <div className="space-y-5">
      <header>
        <h1 className="font-headline-lg text-headline-lg text-text-primary">Search</h1>
        <p className="font-body-sm text-body-sm text-text-muted mt-1">
          Find projects, log entries, and ideas by keyword.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
            <Icon name="search" className="text-[18px]" />
          </span>
          <input
            className="field pl-10"
            placeholder="Search keywords…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <button className="btn-primary" type="submit">
          Search
        </button>
      </form>

      {busy && (
        <p className="font-label-md text-label-md text-text-muted flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Searching…
        </p>
      )}

      {results && total === 0 && !busy && (
        <EmptyState icon="search_off" title="No matches." hint="Try a different keyword." />
      )}

      {results && total > 0 && (
        <div className="space-y-6">
          {results.projects.length > 0 && (
            <Section title="Projects" count={results.projects.length}>
              {results.projects.map((p) => {
                const km = kindMeta(p.kind);
                const a = accent(km.accent);
                return (
                  <Link
                    key={p.id}
                    to={`/project/${p.id}`}
                    className="panel-2 p-3 flex items-center gap-3 hover:border-primary/40 transition-colors"
                  >
                    <span className={`h-9 w-9 rounded-lg grid place-items-center ${a.bg} ${a.text} flex-shrink-0`}>
                      <Icon name={km.icon} className="text-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-headline-sm text-body-md text-text-primary truncate">
                        {p.title}
                      </div>
                      {p.overview && (
                        <p className="font-body-sm text-body-sm text-text-muted line-clamp-1">
                          {p.overview}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </Section>
          )}

          {results.entries.length > 0 && (
            <Section title="Log entries" count={results.entries.length}>
              {results.entries.map((e) => {
                const m = entryMeta(e.kind);
                const a = accent(m.accent);
                return (
                  <Link
                    key={e.id}
                    to={`/project/${e.projectId}`}
                    className="panel-2 p-3 flex items-center gap-3 hover:border-primary/40 transition-colors"
                  >
                    <span className={`h-9 w-9 rounded-lg grid place-items-center ${a.bg} ${a.text} flex-shrink-0`}>
                      <Icon name={m.icon} className="text-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-headline-sm text-body-md text-text-primary truncate">
                        {e.title || "(untitled)"}
                      </div>
                      {e.body && (
                        <p className="font-body-sm text-body-sm text-text-muted line-clamp-2">
                          {e.body}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </Section>
          )}

          {results.ideas.length > 0 && (
            <Section title="Ideas" count={results.ideas.length}>
              {results.ideas.map((i) => (
                <Link
                  key={i.number}
                  to="/ideas"
                  className="panel-2 p-3 flex items-center gap-3 hover:border-primary/40 transition-colors"
                >
                  <span className="index-tag w-12 flex-shrink-0">
                    #{String(i.number).padStart(3, "0")}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface truncate">{i.text}</span>
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <section>
      <h2 className="label mb-2">
        {title} ({count})
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

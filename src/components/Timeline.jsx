function fmt(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// Vertical timeline of milestones. onToggle(milestone) flips done state.
export default function Timeline({ milestones = [], onToggle, onDelete }) {
  if (!milestones.length) {
    return (
      <p className="text-ink/45 text-sm italic">No timeline milestones yet.</p>
    );
  }
  const today = new Date().toISOString();
  return (
    <ol className="relative ml-3 border-l border-white/10 space-y-5">
      {milestones.map((m) => {
        const upcoming = !m.done && m.date > today;
        return (
          <li key={m.id} className="ml-5 relative">
            <span
              className={`absolute -left-[26px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                m.done
                  ? "bg-teal border-teal"
                  : upcoming
                  ? "bg-base-900 border-azure"
                  : "bg-base-900 border-tangerine"
              }`}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <button
                  onClick={() => onToggle?.(m)}
                  className={`font-header text-left ${m.done ? "line-through text-ink/45" : "text-ink"}`}
                >
                  {m.title}
                </button>
                <div className="text-xs text-ink/45 mt-0.5">{fmt(m.date)}</div>
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(m)}
                  className="text-ink/30 hover:text-tangerine text-xs"
                  title="Remove milestone"
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

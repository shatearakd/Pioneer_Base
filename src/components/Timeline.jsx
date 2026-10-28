import Icon from "./Icon.jsx";
import { fmtDate } from "../lib/ui.js";

// Vertical lifecycle timeline of milestones. onToggle(milestone) flips done
// state; onDelete(milestone) removes it.
export default function Timeline({ milestones = [], onToggle, onDelete }) {
  if (!milestones.length) {
    return (
      <p className="font-body-sm text-body-sm text-text-muted italic">
        No lifecycle milestones logged yet.
      </p>
    );
  }
  const today = new Date().toISOString();
  return (
    <ol className="relative ml-2 border-l-2 border-dashed border-surface-border space-y-4">
      {milestones.map((m) => {
        const upcoming = !m.done && m.date > today;
        const dot = m.done ? "bg-status-nominal border-status-nominal" : upcoming ? "bg-surface-panel border-secondary" : "bg-surface-panel border-tertiary";
        return (
          <li key={m.id} className="ml-5 relative">
            <span
              className={`absolute -left-[26px] top-1 h-3.5 w-3.5 rounded-full border-2 ${dot}`}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  onClick={() => onToggle?.(m)}
                  className={`font-body-md text-body-md text-left ${
                    m.done ? "line-through text-text-muted" : "text-on-surface"
                  }`}
                >
                  {m.title}
                </button>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-label-sm text-label-sm text-text-muted">{fmtDate(m.date)}</span>
                  <span
                    className={`font-label-sm text-label-sm ${
                      m.done ? "text-status-nominal" : upcoming ? "text-secondary" : "text-tertiary"
                    }`}
                  >
                    {m.done ? "DONE" : upcoming ? "QUEUED" : "PENDING"}
                  </span>
                </div>
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(m)}
                  className="text-text-muted hover:text-status-critical transition-colors"
                  title="Remove milestone"
                >
                  <Icon name="close" className="text-[16px]" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

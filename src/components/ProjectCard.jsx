import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMilestones, listEntries } from "../db.js";
import Icon from "./Icon.jsx";
import { kindMeta, accent, statusMeta, projectCode, progressPct } from "../lib/ui.js";

// Experiment / project folder card. Pulls its own milestone-based progress and
// log count so it can be dropped anywhere (dashboard, folder tree) with real
// data. Styled per the Kinetic Lab Matrix spec: telemetry code, status pill,
// progress meter, and a metadata footer.
export default function ProjectCard({ project, genre, primary = false, compact = false }) {
  const [pct, setPct] = useState(null);
  const [logCount, setLogCount] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [ms, entries] = await Promise.all([
        listMilestones(project.id),
        listEntries(project.id),
      ]);
      if (!alive) return;
      setPct(progressPct(ms));
      setLogCount(entries.length);
    })();
    return () => {
      alive = false;
    };
  }, [project.id]);

  const km = kindMeta(project.kind);
  const a = accent(km.accent);
  const sm = statusMeta(project.status);
  const sa = accent(sm.color);

  return (
    <Link
      to={`/project/${project.id}`}
      className={`block panel p-space-md transition-all hover:border-primary/40 hover:bg-surface-overlay/40 fade-in ${
        primary ? "ring-1 ring-primary/40" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`font-label-sm text-label-sm font-bold ${a.text}`}>
          [{projectCode(project)}]
        </span>
        <span className={`chip ${sa.soft}`}>
          {sm.pulse && <span className={`w-1.5 h-1.5 rounded-full ${sa.bar} animate-pulse`} />}
          {primary ? "Primary" : sm.label}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Icon name={km.icon} className={`text-[18px] ${a.text}`} />
        <h3
          className={`font-headline-sm text-text-primary leading-tight ${
            primary && !compact ? "text-headline-md" : "text-headline-sm"
          }`}
        >
          {project.title}
        </h3>
      </div>

      {genre && (
        <div className="font-label-sm text-label-sm mt-1" style={{ color: genre.color }}>
          {genre.name}
        </div>
      )}

      {project.overview && !compact && (
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 line-clamp-2">
          {project.overview}
        </p>
      )}

      {/* Progress meter */}
      <div className="flex items-center gap-2 mt-3">
        <div className="w-full bg-surface-container-lowest rounded-full h-1.5 overflow-hidden">
          <div
            className={`${a.bar} h-full rounded-full transition-all`}
            style={{ width: `${pct ?? 0}%` }}
          />
        </div>
        <span className={`font-label-sm text-label-sm flex-shrink-0 ${a.text}`}>
          {pct == null ? "…" : `${pct}%`}
        </span>
      </div>

      {/* Metadata footer */}
      <div className="flex items-center justify-between pt-2 font-label-sm text-label-sm text-text-muted">
        <span className="flex items-center gap-1">
          <Icon name="dynamic_feed" className="text-[13px] text-secondary" />
          {logCount == null ? "…" : `${logCount} log${logCount === 1 ? "" : "s"}`}
        </span>
        <span>{km.label}</span>
      </div>
    </Link>
  );
}

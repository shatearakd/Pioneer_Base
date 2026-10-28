// Visual metadata for the "Kinetic Lab Matrix" design system. Keeps styling
// decisions (icons, accent colors, labels) in one place so every screen renders
// projects/entries/statuses consistently.

// Project kinds ---------------------------------------------------------------
export const KIND_META = {
  experiment: { label: "Experiment", code: "EXP", icon: "science", accent: "primary" },
  project: { label: "Project", code: "PRJ", icon: "biotech", accent: "secondary" },
  invention: { label: "Invention", code: "INV", icon: "lightbulb", accent: "tertiary" },
};
export function kindMeta(kind) {
  return KIND_META[kind] || { label: kind || "Item", code: "LAB", icon: "folder", accent: "primary" };
}

// A short, stable telemetry-style code, e.g. "EXP-7A2".
export function projectCode(p) {
  const pre = kindMeta(p?.kind).code;
  const n = (p?.id || "").replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "000";
  return `${pre}-${n}`;
}

// Status --------------------------------------------------------------------
export const STATUS_META = {
  active: { label: "Active Run", color: "status-nominal", pulse: true },
  ideation: { label: "Ideation", color: "tertiary" },
  bench: { label: "Bench Test", color: "secondary" },
  validated: { label: "Validated", color: "status-nominal" },
  archived: { label: "Archived", color: "text-muted" },
};
export function statusMeta(status) {
  return STATUS_META[status] || { label: status || "Active", color: "primary" };
}

// Accent → Tailwind utility fragments. Tokens are in tailwind.config.js.
const ACCENTS = {
  primary: { text: "text-primary", border: "border-primary/40", bg: "bg-primary/10", bar: "bg-primary", soft: "bg-primary/10 text-primary" },
  secondary: { text: "text-secondary", border: "border-secondary/40", bg: "bg-secondary/10", bar: "bg-secondary", soft: "bg-secondary/10 text-secondary" },
  tertiary: { text: "text-tertiary", border: "border-tertiary/40", bg: "bg-tertiary/10", bar: "bg-tertiary", soft: "bg-tertiary/10 text-tertiary" },
  "status-nominal": { text: "text-status-nominal", border: "border-status-nominal/40", bg: "bg-status-nominal/15", bar: "bg-status-nominal", soft: "bg-status-nominal/15 text-status-nominal" },
  "text-muted": { text: "text-text-muted", border: "border-surface-border", bg: "bg-surface-container-high", bar: "bg-outline", soft: "bg-surface-container-high text-text-muted" },
};
export function accent(name) {
  return ACCENTS[name] || ACCENTS.primary;
}

// Log entry kinds -------------------------------------------------------------
export const ENTRY_META = {
  note: { label: "Note", icon: "edit_note", accent: "tertiary" },
  doc: { label: "Document", icon: "description", accent: "secondary" },
  audio: { label: "Audio log", icon: "mic", accent: "primary" },
  video: { label: "Video log", icon: "videocam", accent: "secondary" },
  result: { label: "Result", icon: "analytics", accent: "status-nominal" },
  hypothesis: { label: "Hypothesis", icon: "psychology", accent: "primary" },
  labReport: { label: "Lab report", icon: "lab_profile", accent: "tertiary" },
};
export function entryMeta(kind) {
  return ENTRY_META[kind] || { label: kind || "Entry", icon: "notes", accent: "primary" };
}

// Progress --------------------------------------------------------------------
export function progressPct(milestones = []) {
  if (!milestones.length) return 0;
  const done = milestones.filter((m) => m.done).length;
  return Math.round((done / milestones.length) * 100);
}

// Dates -----------------------------------------------------------------------
export function fmtDate(iso, opts) {
  try {
    return new Date(iso).toLocaleDateString(
      undefined,
      opts || { month: "short", day: "numeric", year: "numeric" }
    );
  } catch {
    return "";
  }
}
export function fmtDay(iso) {
  return fmtDate(iso, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
export function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

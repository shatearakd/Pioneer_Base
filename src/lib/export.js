import {
  getProject,
  getGenre,
  listEntries,
  listMilestones,
  listMedia,
} from "../db.js";
import { zipFiles } from "./zip.js";

// Export a project's log as Markdown, JSON, or a ZIP dossier. Pure local file
// downloads, no network. Media blobs are referenced by name but not embedded.

const KIND_LABEL = {
  note: "Note",
  doc: "Document",
  audio: "Audio log",
  video: "Video log",
  result: "Result",
  hypothesis: "Hypothesis",
  labReport: "Lab report",
};

export async function gather(projectId) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  const genre = project.genreId ? await getGenre(project.genreId) : null;
  const [entries, milestones, media] = await Promise.all([
    listEntries(projectId),
    listMilestones(projectId),
    listMedia(projectId),
  ]);
  return { project, genre, entries, milestones, media };
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

export function slug(s) {
  return (s || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function download(filename, text, type) {
  const blob = text instanceof Blob ? text : new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function toMarkdown(projectId, opts = {}) {
  const { project, genre, entries, milestones, media } = await gather(projectId);
  const report = project.report || {};
  const includeAbstract = opts.includeAbstract !== false;
  const includeLogs = opts.includeLogs !== false;
  const includeMilestones = opts.includeMilestones !== false;
  const includeMedia = opts.includeMedia !== false;
  const includeAttestation = opts.includeAttestation !== false;

  const lines = [];
  lines.push(`# ${project.title}`);
  lines.push("");
  lines.push(`- Type: ${project.kind}`);
  if (genre) lines.push(`- Genre: ${genre.name}`);
  if (project.tags?.length) lines.push(`- Tags: ${project.tags.join(", ")}`);
  lines.push(`- Status: ${project.status}`);
  if (report.lead) lines.push(`- Lead: ${report.lead}`);
  if (report.verdict) lines.push(`- Verdict: ${report.verdict}`);
  if (report.phase) lines.push(`- Phase: ${report.phase}`);
  lines.push(`- Exported: ${fmtDate(new Date().toISOString())}`);
  lines.push("");

  if (includeAbstract) {
    const abstract = report.abstract || project.overview;
    if (abstract) {
      lines.push("## Executive Abstract");
      lines.push(abstract);
      lines.push("");
    }
  }

  if (report.trials?.length) {
    lines.push("## Quantitative Bench Telemetry");
    lines.push("| Trial | Source | Volts | Current | Status |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const t of report.trials) {
      if (!t.trial && !t.source && !t.volts && !t.current) continue;
      lines.push(
        `| ${t.trial || ""} | ${t.source || ""} | ${t.volts || ""} | ${t.current || ""} | ${t.status || ""} |`
      );
    }
    lines.push("");
  }

  if (includeMilestones && milestones.length) {
    lines.push("## Timeline");
    for (const m of milestones) {
      lines.push(`- [${m.done ? "x" : " "}] ${fmtDate(m.date)} — ${m.title}`);
    }
    lines.push("");
  }

  if (includeLogs && entries.length) {
    lines.push("## Log");
    for (const e of entries) {
      lines.push(`### ${KIND_LABEL[e.kind] || e.kind} — ${fmtDate(e.date)}`);
      if (e.title) lines.push(`**${e.title}**`);
      if (e.body) lines.push(e.body);
      if (e.mediaId) lines.push(`_(attachment stored on device)_`);
      lines.push("");
    }
  }

  if (includeMedia && media.length) {
    lines.push("## Artifacts");
    for (const m of media) {
      lines.push(`- ${m.filename || m.id} (${m.mimeType || "file"}, ${m.size || 0} bytes)`);
    }
    lines.push("");
  }

  if (includeAttestation && (report.attestation || report.signer)) {
    lines.push("## Investigator Attestation");
    if (report.attestation) lines.push(report.attestation);
    if (report.signer) lines.push(`Signed: ${report.signer}`);
    lines.push("");
  }

  return lines.join("\n");
}

export async function toJSON(projectId) {
  const data = await gather(projectId);
  const safe = {
    ...data,
    media: (data.media || []).map(({ blob, ...rest }) => rest),
  };
  return JSON.stringify(safe, null, 2);
}

export async function exportMarkdown(projectId, opts) {
  const project = await getProject(projectId);
  download(`${slug(project?.title)}.md`, await toMarkdown(projectId, opts), "text/markdown");
}

export async function exportJSON(projectId) {
  const project = await getProject(projectId);
  download(`${slug(project?.title)}.json`, await toJSON(projectId), "application/json");
}

export async function exportProjectZip(projectId, opts) {
  const project = await getProject(projectId);
  const name = slug(project?.title);
  const blob = await zipFiles([
    { name: `${name}.md`, data: await toMarkdown(projectId, opts) },
    { name: `${name}.json`, data: await toJSON(projectId) },
  ]);
  download(`${name}-dossier.zip`, blob);
  return blob;
}

export async function exportBatch(projectIds, format = "zip", opts = {}) {
  if (!projectIds.length) return;
  if (format === "json") {
    const dossiers = [];
    for (const id of projectIds) dossiers.push(JSON.parse(await toJSON(id)));
    download("pioneer-batch.json", JSON.stringify(dossiers, null, 2), "application/json");
    return;
  }
  if (format === "md") {
    const parts = [];
    for (const id of projectIds) parts.push(await toMarkdown(id, opts));
    download("pioneer-batch.md", parts.join("\n\n---\n\n"), "text/markdown");
    return;
  }
  const files = [];
  for (const id of projectIds) {
    const project = await getProject(id);
    const name = slug(project?.title) || id;
    files.push({ name: `${name}/${name}.md`, data: await toMarkdown(id, opts) });
    files.push({ name: `${name}/${name}.json`, data: await toJSON(id) });
  }
  const blob = await zipFiles(files);
  download("pioneer-batch-dossier.zip", blob);
}

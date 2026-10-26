import { getProject, getGenre, listEntries, listMilestones } from "../db.js";

// Export a project's log as Markdown or JSON. Pure local file downloads, no
// network. Media blobs are referenced by name but not embedded.

const KIND_LABEL = {
  note: "Note",
  doc: "Document",
  audio: "Audio log",
  video: "Video log",
  result: "Result",
  hypothesis: "Hypothesis",
  labReport: "Lab report",
};

async function gather(projectId) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  const genre = project.genreId ? await getGenre(project.genreId) : null;
  const entries = await listEntries(projectId);
  const milestones = await listMilestones(projectId);
  return { project, genre, entries, milestones };
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

export async function toMarkdown(projectId) {
  const { project, genre, entries, milestones } = await gather(projectId);
  const lines = [];
  lines.push(`# ${project.title}`);
  lines.push("");
  lines.push(`- Type: ${project.kind}`);
  if (genre) lines.push(`- Genre: ${genre.name}`);
  if (project.tags?.length) lines.push(`- Tags: ${project.tags.join(", ")}`);
  lines.push(`- Status: ${project.status}`);
  lines.push(`- Exported: ${fmtDate(new Date().toISOString())}`);
  lines.push("");
  if (project.overview) {
    lines.push("## Overview");
    lines.push(project.overview);
    lines.push("");
  }
  if (milestones.length) {
    lines.push("## Timeline");
    for (const m of milestones) {
      lines.push(`- [${m.done ? "x" : " "}] ${fmtDate(m.date)} — ${m.title}`);
    }
    lines.push("");
  }
  if (entries.length) {
    lines.push("## Log");
    for (const e of entries) {
      lines.push(`### ${KIND_LABEL[e.kind] || e.kind} — ${fmtDate(e.date)}`);
      if (e.title) lines.push(`**${e.title}**`);
      if (e.body) lines.push(e.body);
      if (e.mediaId) lines.push(`_(attachment stored on device)_`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

export async function toJSON(projectId) {
  const data = await gather(projectId);
  // Strip blobs; keep metadata only.
  return JSON.stringify(data, null, 2);
}

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function slug(s) {
  return (s || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function exportMarkdown(projectId) {
  const project = await getProject(projectId);
  download(`${slug(project?.title)}.md`, await toMarkdown(projectId), "text/markdown");
}

export async function exportJSON(projectId) {
  const project = await getProject(projectId);
  download(`${slug(project?.title)}.json`, await toJSON(projectId), "application/json");
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject, getGenre, listEntries, listMilestones, listMedia, saveProject } from "../db.js";
import { exportMarkdown, exportJSON } from "../lib/export.js";
import { humanSize } from "../lib/media.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Icon from "../components/Icon.jsx";
import { kindMeta, projectCode, progressPct, fmtDate, entryMeta } from "../lib/ui.js";

const EMPTY_TRIAL = { trial: "", source: "", volts: "", current: "", status: "" };

function emptyReport(project) {
  return {
    lead: "",
    abstract: project?.overview || "",
    verdict: "In progress",
    phase: "",
    trials: [{ ...EMPTY_TRIAL }],
    attestation:
      "I certify that the observations, measurements, and attachments recorded here were made during this experiment.",
    signer: "",
    includeAbstract: true,
    includeTelemetry: true,
    includeLogs: true,
    includeMedia: true,
    includeAttestation: true,
  };
}

export default function Report() {
  const { id } = useParams();
  const [status, setStatus] = useState("loading");
  const [project, setProject] = useState(null);
  const [genre, setGenre] = useState(null);
  const [entries, setEntries] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [media, setMedia] = useState([]);
  const [report, setReport] = useState(emptyReport());
  const [savedAt, setSavedAt] = useState(null);
  const [tab, setTab] = useState("pdf");

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      try {
        const p = await getProject(id);
        if (!alive) return;
        if (!p) {
          setStatus("missing");
          return;
        }
        const [g, e, m, med] = await Promise.all([
          p.genreId ? getGenre(p.genreId) : null,
          listEntries(id),
          listMilestones(id),
          listMedia(id),
        ]);
        if (!alive) return;
        setProject(p);
        setGenre(g);
        setEntries(e);
        setMilestones(m);
        setMedia(med);
        setReport({ ...emptyReport(p), ...(p.report || {}) });
        setStatus("ready");
      } catch (err) {
        console.error(err);
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  function patch(partial) {
    setReport((r) => ({ ...r, ...partial }));
  }
  function patchTrial(i, partial) {
    setReport((r) => {
      const trials = [...(r.trials || [])];
      trials[i] = { ...trials[i], ...partial };
      return { ...r, trials };
    });
  }

  async function persist() {
    const saved = await saveProject({ id, report });
    setProject(saved);
    setSavedAt(new Date());
    return saved;
  }

  async function savePdf() {
    await persist();
    window.print();
  }

  if (status === "loading") return <LoadingBlock />;
  if (status === "error") return <ErrorState />;
  if (status === "missing") {
    return (
      <EmptyState
        icon="search_off"
        title="That project could not be found."
        action={
          <Link className="btn-ghost" to="/">
            Back to dashboard
          </Link>
        }
      />
    );
  }

  const km = kindMeta(project.kind);
  const pct = progressPct(milestones);
  const code = projectCode(project);
  const hypothesis = entries.find((e) => e.kind === "hypothesis");

  const exportOpts = {
    includeAbstract: report.includeAbstract,
    includeLogs: report.includeLogs,
    includeMilestones: report.includeTelemetry,
    includeMedia: report.includeMedia,
    includeAttestation: report.includeAttestation,
  };

  return (
    <div className="space-y-5 report-page">
      <div className="no-print panel p-space-sm space-y-3">
        <div className="flex items-center justify-between">
          <Link
            to={`/project/${id}`}
            className="flex items-center gap-1.5 text-text-muted hover:text-primary"
          >
            <Icon name="arrow_back" className="text-[18px] text-primary" />
            <span className="font-label-sm text-label-sm text-text-primary tracking-wider uppercase font-semibold">
              {code} // Export suite
            </span>
          </Link>
          <span className="chip chip-nominal">Offline ready</span>
        </div>
        <div className="grid grid-cols-3 p-1 bg-surface-container-lowest rounded gap-1">
          <TabBtn active={tab === "pdf"} onClick={() => setTab("pdf")} icon="picture_as_pdf">
            PDF Folio
          </TabBtn>
          <TabBtn
            active={tab === "md"}
            onClick={() => {
              setTab("md");
              exportMarkdown(id, exportOpts);
            }}
            icon="code"
          >
            Raw MD
          </TabBtn>
          <TabBtn
            active={tab === "json"}
            onClick={() => {
              setTab("json");
              exportJSON(id);
            }}
            icon="table_chart"
          >
            JSON
          </TabBtn>
        </div>
      </div>

      {/* Fillable dossier */}
      <div className="panel overflow-hidden print-folio">
        <div className="bg-surface-container-high p-space-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="label text-primary flex items-center gap-1.5">
              <Icon name="verified" className="text-[16px]" /> Pioneer archive // Dossier
            </span>
            <span className="chip">Lab folio</span>
          </div>
          <div className="flex flex-wrap justify-between font-label-sm text-label-sm text-text-muted gap-1">
            <span>
              UID: <strong className="text-text-primary">{code}</strong>
            </span>
            <span>
              TIMESTAMP:{" "}
              <strong className="text-text-primary">{fmtDate(new Date().toISOString())}</strong>
            </span>
          </div>
        </div>

        <div className="p-space-md space-y-5">
          <div>
            <span className="label">Project identifier</span>
            <h1 className="font-headline-md text-headline-md text-text-primary tracking-tight mt-1">
              {code}: {project.title}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="chip">{km.label}</span>
              {genre && <span className="chip chip-primary">{genre.name}</span>}
              <span className="chip">{pct}% lifecycle</span>
            </div>
          </div>

          <Field label="Lead investigator">
            <input
              className="field"
              placeholder="Name / lab / school"
              value={report.lead}
              onChange={(e) => patch({ lead: e.target.value })}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Verdict">
              <select
                className="field"
                value={report.verdict}
                onChange={(e) => patch({ verdict: e.target.value })}
              >
                <option>In progress</option>
                <option>Hypothesis validated</option>
                <option>Inconclusive</option>
                <option>Hypothesis rejected</option>
              </select>
            </Field>
            <Field label="Phase">
              <input
                className="field"
                placeholder="e.g. Phase 3 of 4"
                value={report.phase}
                onChange={(e) => patch({ phase: e.target.value })}
              />
            </Field>
          </div>

          <Field
            label="Executive Abstract"
            hint="Write the summary a reader should see first. Pre-filled from the project overview — edit freely."
          >
            <textarea
              className="field min-h-[120px]"
              placeholder="What was tested, what happened, and what it means…"
              value={report.abstract}
              onChange={(e) => patch({ abstract: e.target.value })}
            />
          </Field>

          {hypothesis?.body && (
            <div className="panel-2 p-3">
              <span className="label text-primary">Logged hypothesis</span>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 whitespace-pre-wrap">
                {hypothesis.body}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label">Quantitative bench telemetry</span>
              <button
                className="btn-ghost !py-1 !px-2"
                onClick={() => patch({ trials: [...(report.trials || []), { ...EMPTY_TRIAL }] })}
              >
                <Icon name="add" className="text-[14px]" /> Trial
              </button>
            </div>
            <div className="space-y-2">
              {(report.trials || []).map((t, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 panel-2 p-2">
                  <input
                    className="field"
                    placeholder="Trial #"
                    value={t.trial}
                    onChange={(e) => patchTrial(i, { trial: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Source"
                    value={t.source}
                    onChange={(e) => patchTrial(i, { source: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Volts"
                    value={t.volts}
                    onChange={(e) => patchTrial(i, { volts: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Current"
                    value={t.current}
                    onChange={(e) => patchTrial(i, { current: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Status"
                    value={t.status}
                    onChange={(e) => patchTrial(i, { status: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          {report.includeLogs && entries.length > 0 && (
            <div>
              <span className="label">Lab log index</span>
              <ul className="mt-2 space-y-1">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between panel-2 px-3 py-2 font-body-sm text-body-sm"
                  >
                    <span className="truncate">
                      {entryMeta(e.kind).label}
                      {e.title ? ` — ${e.title}` : ""}
                    </span>
                    <span className="font-label-sm text-label-sm text-text-muted flex-shrink-0 ml-2">
                      {fmtDate(e.date, { month: "short", day: "numeric" })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.includeMedia && media.length > 0 && (
            <div>
              <span className="label">Included artifacts</span>
              <ul className="mt-2 space-y-1">
                {media.map((m) => (
                  <li key={m.id} className="flex items-center justify-between panel-2 px-3 py-2">
                    <span className="font-label-sm text-label-sm text-text-primary truncate">
                      {m.filename || "Attachment"}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      {humanSize(m.size) || m.mimeType}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Field label="Investigator attestation">
            <textarea
              className="field min-h-[80px]"
              value={report.attestation}
              onChange={(e) => patch({ attestation: e.target.value })}
            />
            <input
              className="field mt-2"
              placeholder="Digital signer name / role"
              value={report.signer}
              onChange={(e) => patch({ signer: e.target.value })}
            />
          </Field>
        </div>
      </div>

      {/* Export configuration */}
      <div className="no-print panel p-space-md space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="tune" className="text-[20px] text-primary" />
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Export configuration</h2>
        </div>
        <div className="panel-2 p-3 space-y-2">
          <Toggle
            checked={report.includeAbstract}
            onChange={(v) => patch({ includeAbstract: v })}
            icon="description"
            label="Hypothesis & executive summary"
          />
          <Toggle
            checked={report.includeTelemetry}
            onChange={(v) => patch({ includeTelemetry: v })}
            icon="show_chart"
            label="Telemetry table & timeline"
          />
          <Toggle
            checked={report.includeLogs}
            onChange={(v) => patch({ includeLogs: v })}
            icon="dynamic_feed"
            label="Lab logs index"
          />
          <Toggle
            checked={report.includeMedia}
            onChange={(v) => patch({ includeMedia: v })}
            icon="perm_media"
            label="Artifact / media index"
          />
          <Toggle
            checked={report.includeAttestation}
            onChange={(v) => patch({ includeAttestation: v })}
            icon="gavel"
            label="Investigator attestation"
          />
        </div>
        {savedAt && (
          <p className="font-label-sm text-label-sm text-status-nominal">
            Draft saved {savedAt.toLocaleTimeString()}.
          </p>
        )}
      </div>

      <div className="no-print sticky bottom-20 md:bottom-4 z-30 space-y-2">
        <button className="btn-primary w-full !py-3" onClick={savePdf}>
          <Icon name="picture_as_pdf" className="text-[20px]" />
          Generate & save lab PDF
        </button>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={persist}>
            <Icon name="save" className="text-[16px]" /> Save draft
          </button>
          <button className="btn-ghost flex-1" onClick={() => exportMarkdown(id, exportOpts)}>
            <Icon name="description" className="text-[16px]" /> Download .md
          </button>
        </div>
        <p className="text-center font-label-sm text-label-sm text-text-muted">
          The PDF button opens the system print dialog — choose “Save as PDF” to keep a local copy.
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <span className="label">{label}</span>
      {hint && <p className="font-body-sm text-body-sm text-text-muted mt-0.5 mb-1">{hint}</p>}
      <div className={hint ? "" : "mt-1.5"}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, icon, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="flex items-center gap-2 font-body-sm text-body-sm text-text-primary">
        <Icon name={icon} className="text-[18px] text-primary" />
        {label}
      </span>
      <input
        type="checkbox"
        className="accent-primary h-4 w-4"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function TabBtn({ active, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded font-label-sm text-label-sm ${
        active ? "bg-primary-container text-on-primary-container" : "text-text-muted hover:text-on-surface"
      }`}
    >
      <Icon name={icon} className="text-[16px]" />
      {children}
    </button>
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

import { Link } from "react-router-dom";

const KIND_COLOR = {
  experiment: "text-teal border-teal/40 bg-teal/10",
  project: "text-azure border-azure/40 bg-azure/10",
  invention: "text-tangerine border-tangerine/40 bg-tangerine/10",
};

// Compact project folder card used in the dashboard and the folder tree.
export default function ProjectCard({ project, genre, primary = false }) {
  return (
    <Link
      to={`/project/${project.id}`}
      className={`block glass rounded-2xl p-4 transition hover:border-teal/40 hover:-translate-y-0.5 fade-in ${
        primary ? "ring-1 ring-teal/40" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`chip border ${KIND_COLOR[project.kind] || "text-ink/70"}`}
        >
          {project.kind}
        </span>
        {primary && <span className="chip border border-teal/40 text-teal">Primary</span>}
      </div>
      <h3 className="font-header text-lg text-ink leading-tight">{project.title}</h3>
      {genre && (
        <div className="text-xs mt-1" style={{ color: genre.color }}>
          {genre.name}
        </div>
      )}
      {project.overview && (
        <p className="text-sm text-ink/60 mt-2 line-clamp-2">{project.overview}</p>
      )}
      {project.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {project.tags.slice(0, 4).map((t) => (
            <span key={t} className="chip">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

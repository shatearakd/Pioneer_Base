export default function EmptyState({ title = "Nothing yet.", hint, action }) {
  return (
    <div className="glass rounded-3xl p-10 text-center fade-in">
      <div className="mx-auto mb-4 h-12 w-12 rounded-2xl grid place-items-center bg-white/5 text-teal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      </div>
      <p className="font-header text-lg text-ink">{title}</p>
      {hint && <p className="text-ink/50 text-sm mt-1">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

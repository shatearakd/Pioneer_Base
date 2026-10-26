export default function ErrorState({
  message = "We seem to be experiencing some delays. Give us a moment.",
  onRetry,
}) {
  return (
    <div className="glass rounded-3xl p-10 text-center fade-in border-tangerine/30">
      <div className="mx-auto mb-4 h-12 w-12 rounded-2xl grid place-items-center bg-tangerine/10 text-tangerine">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <p className="font-header text-lg text-ink">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-5">
          Try again
        </button>
      )}
    </div>
  );
}

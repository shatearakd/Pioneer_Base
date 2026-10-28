import Icon from "./Icon.jsx";

export default function ErrorState({
  message = "We seem to be experiencing some delays. Give us a moment.",
  onRetry,
}) {
  return (
    <div className="panel p-10 text-center fade-in border-status-critical/40 flex flex-col items-center">
      <div className="mb-4 h-14 w-14 rounded-full grid place-items-center bg-status-critical/10 text-status-critical border border-status-critical/30">
        <Icon name="warning" className="text-[28px]" />
      </div>
      <p className="font-headline-sm text-headline-sm text-text-primary">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-5">
          <Icon name="restart_alt" className="text-[18px]" /> Try again
        </button>
      )}
    </div>
  );
}

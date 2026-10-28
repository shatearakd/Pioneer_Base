import Icon from "./Icon.jsx";

export default function EmptyState({ title = "Nothing yet.", hint, action, icon = "science" }) {
  return (
    <div className="panel p-10 text-center fade-in flex flex-col items-center">
      <div className="mb-4 h-14 w-14 rounded-full grid place-items-center bg-surface-container-high text-primary border border-surface-border">
        <Icon name={icon} className="text-[28px]" />
      </div>
      <p className="font-headline-sm text-headline-sm text-text-primary">{title}</p>
      {hint && <p className="font-body-sm text-body-sm text-text-muted mt-1.5 max-w-sm">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

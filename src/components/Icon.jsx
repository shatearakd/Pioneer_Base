// Material Symbols (Outlined) icon. Font is bundled locally via the
// `material-symbols` package so icons render fully offline.
export default function Icon({ name, className = "", fill = false, style }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined${fill ? " fill" : ""} ${className}`}
      style={style}
    >
      {name}
    </span>
  );
}

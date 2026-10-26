import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../store.js";

const I = (paths) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const icons = {
  home: I(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>),
  tree: I(<><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /><path d="M6.5 10v4a3 3 0 0 0 3 3H14" /></>),
  bulb: I(<><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10c.7.7 1 1.3 1 2h6c0-.7.3-1.3 1-2a6 6 0 0 0-4-10z" /></>),
  search: I(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  gear: I(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>),
  lock: I(<><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
};

const nav = [
  { to: "/", label: "Dashboard", icon: icons.home, end: true },
  { to: "/genres", label: "Folders", icon: icons.tree },
  { to: "/ideas", label: "Ideas", icon: icons.bulb },
  { to: "/search", label: "Search", icon: icons.search },
  { to: "/settings", label: "Settings", icon: icons.gear },
];

export default function Shell() {
  const lock = useApp((s) => s.lock);
  const navigate = useNavigate();

  function handleLock() {
    lock();
    navigate("/unlock", { replace: true });
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-60 shrink-0 p-4 gap-2 border-r border-white/10">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="h-9 w-9 rounded-xl grid place-items-center bg-gradient-to-br from-teal to-azure text-base-950 font-title font-bold">
            P
          </div>
          <span className="font-title text-sm tracking-widest">PIONEER_BASE</span>
        </div>
        {nav.map((n) => (
          <NavItem key={n.to} {...n} />
        ))}
        <div className="mt-auto">
          <button onClick={handleLock} className="btn-ghost w-full">
            {icons.lock} Lock
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-24 md:pb-8">
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-white/10 flex justify-around px-2 py-2">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] ${
                isActive ? "text-teal" : "text-ink/55"
              }`
            }
          >
            {n.icon}
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function NavItem({ to, label, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-3 py-2.5 font-header text-sm transition ${
          isActive ? "bg-teal/15 text-teal" : "text-ink/70 hover:bg-white/5"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../store.js";
import Icon from "./Icon.jsx";

const desktopNav = [
  { to: "/", label: "Dashboard", icon: "space_dashboard", end: true },
  { to: "/genres", label: "Research Vault", icon: "account_tree" },
  { to: "/archive", label: "Archive Vault", icon: "inventory_2" },
  { to: "/ideas", label: "Spark Incubator", icon: "lightbulb" },
  { to: "/export", label: "Batch Export", icon: "folder_zip" },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const mobileNav = [
  { to: "/", label: "Dash", icon: "space_dashboard", end: true },
  { to: "/genres", label: "Tree", icon: "account_tree" },
  { to: "/ideas", label: "Ideas", icon: "lightbulb" },
  { to: "/archive", label: "Vault", icon: "inventory_2" },
  { to: "/settings", label: "Config", icon: "settings" },
];

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="h-9 w-9 rounded-lg grid place-items-center bg-primary/10 text-primary border border-primary/30 flex-shrink-0">
        <Icon name="science" className="text-[20px]" />
      </span>
      <div className="flex flex-col min-w-0">
        <span className="font-headline-sm text-headline-sm text-text-primary tracking-tight truncate">
          PIONEER BASE
        </span>
        {!compact && (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-nominal animate-pulse" />
            <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
              Standalone // Offline
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

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
      <aside className="no-print hidden md:flex md:flex-col md:w-64 shrink-0 p-4 gap-1 border-r border-surface-border bg-surface-panel/60 backdrop-blur-xl">
        <div className="px-2 py-3 mb-2">
          <Brand />
        </div>
        {desktopNav.map((n) => (
          <NavItem key={n.to} {...n} />
        ))}
        <div className="mt-auto pt-4">
          <div className="panel-2 p-3 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-nominal animate-pulse" />
              <span className="label">System Nominal</span>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted mt-1">
              All data stored locally on this device.
            </p>
          </div>
          <button onClick={handleLock} className="btn-ghost w-full">
            <Icon name="lock" className="text-[18px]" /> Lock Vault
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="no-print md:hidden sticky top-0 z-40 safe-t bg-surface-panel/85 backdrop-blur-xl border-b border-surface-border">
        <div className="h-14 px-gutter-mobile flex items-center justify-between">
          <Brand compact />
          <button
            onClick={handleLock}
            className="h-10 w-10 grid place-items-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-high transition-colors"
            title="Lock"
          >
            <Icon name="lock" className="text-[20px]" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-28 md:pb-10">
        <div className="mx-auto max-w-5xl px-4 pt-5 md:px-8 md:pt-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 safe-b bg-surface-panel/90 backdrop-blur-xl border-t border-surface-border shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-stretch h-16 px-1">
          {mobileNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-w-[56px] px-2 transition-colors ${
                  isActive ? "text-primary" : "text-text-muted hover:text-on-surface"
                }`
              }
            >
              <Icon name={n.icon} className="text-[22px]" />
              <span className="font-label-sm text-label-sm tracking-tight">{n.label}</span>
            </NavLink>
          ))}
        </div>
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
        `flex items-center gap-3 rounded-lg px-3 py-2.5 font-label-md text-label-md tracking-wide transition-colors ${
          isActive
            ? "bg-primary/10 text-primary border border-primary/30"
            : "text-on-surface-variant border border-transparent hover:bg-surface-container-high hover:text-text-primary"
        }`
      }
    >
      <Icon name={icon} className="text-[20px]" />
      {label}
    </NavLink>
  );
}

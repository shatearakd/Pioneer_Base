import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useApp } from "./store.js";
import Unlock from "./pages/Unlock.jsx";
import Shell from "./components/Shell.jsx";
import Home from "./pages/Home.jsx";
import Project from "./pages/Project.jsx";
import Genres from "./pages/Genres.jsx";
import Ideas from "./pages/Ideas.jsx";
import Search from "./pages/Search.jsx";
import Settings from "./pages/Settings.jsx";

function Gate({ children }) {
  const { ready, unlocked } = useApp();
  const loc = useLocation();
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <div className="font-headline-sm text-headline-sm text-primary tracking-[0.3em] animate-pulse">
            PIONEER BASE
          </div>
        </div>
      </div>
    );
  }
  if (!unlocked) return <Navigate to="/unlock" replace state={{ from: loc }} />;
  return children;
}

export default function App() {
  const boot = useApp((s) => s.boot);
  useEffect(() => {
    boot();
  }, [boot]);

  return (
    <Routes>
      <Route path="/unlock" element={<Unlock />} />
      <Route
        element={
          <Gate>
            <Shell />
          </Gate>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<Project />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

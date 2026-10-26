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
        <div className="font-title text-teal text-lg tracking-widest animate-pulse">
          PIONEER_BASE
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

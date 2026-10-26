import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store.js";
import {
  setPasscode,
  verifyPasscode,
  biometricsSupported,
  biometricsEnrolled,
  enrollBiometrics,
  disableBiometrics,
} from "../lib/auth.js";
import { getDB } from "../db.js";

export default function Settings() {
  const navigate = useNavigate();
  const lock = useApp((s) => s.lock);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [bioSupported, setBioSupported] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [counts, setCounts] = useState(null);
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    (async () => {
      setBioSupported(biometricsSupported());
      setBioOn(await biometricsEnrolled());
      await loadStats();
    })();
  }, []);

  async function loadStats() {
    const db = await getDB();
    const stores = ["projects", "entries", "media", "ideas", "genres"];
    const entries = await Promise.all(
      stores.map(async (s) => [s, await db.count(s)])
    );
    setCounts(Object.fromEntries(entries));
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      setEstimate(est);
    }
  }

  async function changePasscode(e) {
    e.preventDefault();
    setMsg("");
    if (!(await verifyPasscode(current))) {
      setMsg("Current passcode is incorrect.");
      return;
    }
    if (next.length < 4) {
      setMsg("New passcode must be at least 4 characters.");
      return;
    }
    await setPasscode(next);
    setCurrent("");
    setNext("");
    setMsg("Passcode updated.");
  }

  async function toggleBio() {
    try {
      if (bioOn) {
        await disableBiometrics();
        setBioOn(false);
      } else {
        await enrollBiometrics();
        setBioOn(true);
      }
    } catch {
      setMsg("Could not change fingerprint setting.");
    }
  }

  function humanSize(bytes) {
    if (!bytes) return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < u.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(1)} ${u[i]}`;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-title text-2xl tracking-wide text-ink">Settings</h1>
      </header>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-header text-ink mb-4">Security</h2>
        <form onSubmit={changePasscode} className="space-y-3">
          <input
            type="password"
            className="field"
            placeholder="Current passcode"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <input
            type="password"
            className="field"
            placeholder="New passcode"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <button className="btn-primary" type="submit">
            Update passcode
          </button>
          {msg && <p className="text-sm text-teal">{msg}</p>}
        </form>

        {bioSupported && (
          <label className="flex items-center justify-between mt-5 pt-5 border-t border-white/10">
            <span className="text-sm text-ink/80">Unlock with fingerprint / device</span>
            <button
              onClick={toggleBio}
              className={`btn ${bioOn ? "bg-teal text-base-950" : "btn-ghost"}`}
            >
              {bioOn ? "Enabled" : "Enable"}
            </button>
          </label>
        )}
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-header text-ink mb-4">On-device storage</h2>
        {counts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-base-800/70 border border-white/10 p-3">
                <div className="text-ink/50 capitalize">{k}</div>
                <div className="font-title text-lg text-ink">{v}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-ink/40 text-sm">Loading…</p>
        )}
        {estimate && (
          <p className="text-xs text-ink/40 mt-3">
            Using {humanSize(estimate.usage)} of {humanSize(estimate.quota)} available on this
            device.
          </p>
        )}
        <p className="text-xs text-ink/40 mt-2">
          All data lives in this browser on this device. Nothing is uploaded.
        </p>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-header text-ink mb-3">Session</h2>
        <button
          className="btn-ghost"
          onClick={() => {
            lock();
            navigate("/unlock", { replace: true });
          }}
        >
          Lock now
        </button>
      </section>

      <p className="text-center text-ink/30 text-xs font-header tracking-widest">
        PIONEER_BASE · local-first
      </p>
    </div>
  );
}

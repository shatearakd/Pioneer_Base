import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store.js";
import {
  setPasscode,
  verifyPasscode,
  enrollBiometrics,
  biometricsSupported,
  biometricsEnrolled,
  unlockWithBiometrics,
} from "../lib/auth.js";

export default function Unlock() {
  const navigate = useNavigate();
  const { ready, needsSetup, unlock, completeSetup } = useApp();
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [bioOffer, setBioOffer] = useState(false);
  const [hasBio, setHasBio] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [needsSetup]);

  useEffect(() => {
    (async () => {
      setBioOffer(biometricsSupported());
      setHasBio(await biometricsEnrolled());
    })();
  }, []);

  // Auto-try fingerprint on arrival if it's set up.
  useEffect(() => {
    if (ready && !needsSetup && hasBio) {
      tryBiometrics().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, needsSetup, hasBio]);

  async function handleSetup(e) {
    e.preventDefault();
    setError("");
    if (code.length < 4) return setError("Use at least 4 characters.");
    if (code !== confirm) return setError("Passcodes do not match.");
    setBusy(true);
    try {
      await setPasscode(code);
      if (bioOffer) {
        const wantBio = window.confirm(
          "Passcode set. Enable fingerprint / device unlock too?"
        );
        if (wantBio) {
          try {
            await enrollBiometrics();
          } catch {
            /* user can enable later in Settings */
          }
        }
      }
      completeSetup();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not set passcode.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (await verifyPasscode(code)) {
        unlock();
        navigate("/", { replace: true });
      } else {
        setError("Incorrect passcode.");
        setCode("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function tryBiometrics() {
    setError("");
    try {
      if (await unlockWithBiometrics()) {
        unlock();
        navigate("/", { replace: true });
      }
    } catch {
      setError("Fingerprint unlock was cancelled or failed.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm glass rounded-3xl p-8 fade-in">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-teal to-azure text-base-950 font-title text-2xl font-bold">
            P
          </div>
          <h1 className="font-title text-xl tracking-widest text-ink">
            PIONEER_BASE
          </h1>
          <p className="font-header text-ink/60 mt-1 text-sm">
            {needsSetup ? "Create your passcode" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={needsSetup ? handleSetup : handleUnlock} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            inputMode="text"
            autoComplete={needsSetup ? "new-password" : "current-password"}
            placeholder="Passcode"
            className="field text-center tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {needsSetup && (
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm passcode"
              className="field text-center tracking-widest"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}

          {error && <p className="text-tangerine text-sm text-center">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {needsSetup ? "Create passcode" : "Unlock"}
          </button>
        </form>

        {!needsSetup && hasBio && (
          <button
            onClick={tryBiometrics}
            className="btn-ghost w-full mt-3"
            disabled={busy}
          >
            {fingerprintIcon} Use fingerprint
          </button>
        )}

        <p className="text-center text-ink/40 text-xs mt-6 font-body">
          Everything stays on this device. No account, no cloud.
        </p>
      </div>
    </div>
  );
}

const fingerprintIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <path d="M12 11c0 3 0 5-1 7" />
    <path d="M8 10a4 4 0 0 1 8 0c0 3 0 6-1 8" />
    <path d="M4 12a8 8 0 0 1 16 0c0 2 0 4-.5 6" />
    <path d="M12 14c0 2 0 3-.5 4.5" />
  </svg>
);

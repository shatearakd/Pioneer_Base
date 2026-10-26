import { metaGet, metaSet } from "../db.js";

// Local-only auth. No server, no accounts. The passcode is stored only as a
// salted SHA-256 hash in IndexedDB. Optional fingerprint/biometrics use the
// WebAuthn platform authenticator; the resulting credential id is remembered
// locally and re-asserted on unlock.

const enc = new TextEncoder();

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromB64url(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function toB64url(buf) {
  const bin = String.fromCharCode(...new Uint8Array(buf));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hashPasscode(passcode, saltHex) {
  const data = enc.encode(`${saltHex}:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function hasPasscode() {
  const rec = await metaGet("auth");
  return !!rec?.hash;
}

export async function setPasscode(passcode) {
  const saltHex = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPasscode(passcode, saltHex);
  const prev = (await metaGet("auth")) || {};
  await metaSet("auth", { ...prev, saltHex, hash });
  return true;
}

export async function verifyPasscode(passcode) {
  const rec = await metaGet("auth");
  if (!rec?.hash) return false;
  const hash = await hashPasscode(passcode, rec.saltHex);
  return hash === rec.hash;
}

/* --------------------------- WebAuthn (fingerprint) --------------------------- */

export function biometricsSupported() {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials?.create === "function"
  );
}

export async function biometricsEnrolled() {
  const rec = await metaGet("auth");
  return !!rec?.credentialId;
}

// Register a platform authenticator (Windows Hello / Touch ID / fingerprint).
export async function enrollBiometrics() {
  if (!biometricsSupported()) throw new Error("Biometrics not supported on this device.");
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Pioneer_Base", id: location.hostname },
      user: { id: userId, name: "pioneer", displayName: "Pioneer" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
    },
  });
  if (!cred) throw new Error("Enrollment cancelled.");
  const credentialId = toB64url(cred.rawId);
  const prev = (await metaGet("auth")) || {};
  await metaSet("auth", { ...prev, credentialId });
  return true;
}

// Assert the enrolled credential to unlock.
export async function unlockWithBiometrics() {
  const rec = await metaGet("auth");
  if (!rec?.credentialId) throw new Error("No fingerprint enrolled.");
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        { type: "public-key", id: fromB64url(rec.credentialId) },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  });
  return !!assertion;
}

export async function disableBiometrics() {
  const prev = (await metaGet("auth")) || {};
  delete prev.credentialId;
  await metaSet("auth", prev);
}

import { create } from "zustand";
import { hasPasscode } from "./lib/auth.js";
import { seedIfNeeded } from "./lib/seed.js";

// App-wide state. Keeps the auth gate (locked/unlocked), whether a passcode has
// been set up yet, and a counter the pages bump to force data re-reads after
// mutations.
export const useApp = create((set, get) => ({
  ready: false,
  unlocked: false,
  needsSetup: false, // no passcode configured yet -> first-run setup
  dataVersion: 0,

  async boot() {
    try {
      await seedIfNeeded();
      const configured = await hasPasscode();
      set({ ready: true, needsSetup: !configured, unlocked: false });
    } catch (e) {
      console.error("boot failed", e);
      set({ ready: true, needsSetup: false, unlocked: false });
    }
  },

  completeSetup() {
    set({ needsSetup: false, unlocked: true });
  },

  unlock() {
    set({ unlocked: true });
  },

  lock() {
    set({ unlocked: false });
  },

  // Pages subscribe to dataVersion so a single call refreshes their queries.
  bumpData() {
    set({ dataVersion: get().dataVersion + 1 });
  },
}));

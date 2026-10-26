import {
  metaGet,
  metaSet,
  saveGenre,
  saveProject,
  saveEntry,
  saveMilestone,
  addIdea,
  setPrimaryProject,
  now,
} from "../db.js";

// Populates a small, friendly starter set the first time the app runs so the
// dashboard, tree, and timeline have something to show. Everything here is
// just regular user data the person can edit or delete.
//
// A module-level promise makes this single-flight: if boot() is called more
// than once (e.g. React StrictMode double-invokes effects in development) the
// concurrent calls share one run instead of racing and seeding twice.
let _seedPromise = null;
export function seedIfNeeded() {
  if (!_seedPromise) _seedPromise = runSeed();
  return _seedPromise;
}

async function runSeed() {
  const seeded = await metaGet("seeded");
  if (seeded) return;

  const chem = await saveGenre({
    name: "Chemistry",
    color: "#00b0be",
    tags: ["reactions", "materials"],
  });
  const electronics = await saveGenre({
    name: "Electronics",
    color: "#3594cc",
    tags: ["circuits", "sensors"],
  });
  await saveGenre({
    name: "Inventions",
    color: "#ea801c",
    tags: ["prototypes", "patents"],
  });

  const battery = await saveProject({
    genreId: chem.id,
    title: "Saltwater Battery Cell",
    kind: "experiment",
    overview:
      "Testing electrode pairs and electrolyte concentration to maximize voltage from a saltwater cell.",
    tags: ["energy", "electrochemistry"],
  });
  // saveGenre/saveProject return records; use their ids below.
  const batteryId = battery.id;
  await setPrimaryProject(batteryId);

  await saveProject({
    genreId: electronics.id,
    title: "Soil Moisture Logger",
    kind: "invention",
    overview: "A low-power sensor that logs soil moisture and nudges you to water plants.",
    tags: ["sensors", "arduino"],
  });

  await saveEntry({
    projectId: batteryId,
    kind: "hypothesis",
    title: "Hypothesis",
    body:
      "Increasing salt concentration raises conductivity and therefore output voltage, up to a saturation point.",
    date: daysAgo(6),
  });
  await saveEntry({
    projectId: batteryId,
    kind: "result",
    title: "Run 1 results",
    body: "Copper/zinc electrodes, 5% NaCl -> 0.92 V open circuit. Stable for ~8 minutes.",
    date: daysAgo(3),
  });
  await saveEntry({
    projectId: batteryId,
    kind: "note",
    title: "Next steps",
    body: "Try magnesium electrode and sweep concentration 3% -> 15%.",
    date: daysAgo(1),
  });

  await saveMilestone({
    projectId: batteryId,
    title: "Design cell + gather materials",
    date: daysAgo(7),
    done: true,
  });
  await saveMilestone({
    projectId: batteryId,
    title: "First voltage measurements",
    date: daysAgo(3),
    done: true,
  });
  await saveMilestone({
    projectId: batteryId,
    title: "Concentration sweep",
    date: daysAhead(4),
    done: false,
  });

  await addIdea({
    text: "What if the electrolyte were a gel instead of liquid for portability?",
  });
  await addIdea({ text: "Try a flow-through cell design to avoid gas buildup." });

  await metaSet("seeded", now());
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

const STORAGE_KEY = "sos_messages";

console.clear();
console.log("🚀 Starting SOS Chaos Test Engine...");
console.log("====================================");

const USERS = ["9999999999", "8888888888", "7777777777"];
const DEPARTMENTS = ["Police", "Ambulance", "Fire Force"];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomLatLng() {
  return {
    lat: 17 + Math.random(),
    lng: 78 + Math.random(),
  };
}

function randomStatus() {
  const r = Math.random();
  if (r < 0.3) return { acknowledged: false, resolved: false };
  if (r < 0.7) return { acknowledged: true, resolved: false };
  return { acknowledged: true, resolved: true };
}

function randomDepartment() {
  return {
    name: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
    phone: "100",
    location: randomLatLng(),
  };
}

const SOS_TEMPLATES = [
  "Medical emergency reported.",
  "Fire accident reported.",
  "Sexual assault emergency.",
  "Natural disaster situation detected.",
];

function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function logStep(step, msg) {
  console.log(`🧪 [${step}] ${msg}`);
}

function randomUser() {
  return USERS[Math.floor(Math.random() * USERS.length)];
}

function randomTemplate() {
  return SOS_TEMPLATES[Math.floor(Math.random() * SOS_TEMPLATES.length)];
}

/* =========================
   TEST 1: BULK INSERT
========================= */
async function bulkInsert(n = 200) {
  logStep("BULK_INSERT", `Inserting ${n} records...`);
  const existing = load();

  for (let i = 0; i < n; i++) {
    const status = randomStatus();

    const msg = {
      id: crypto.randomUUID(),
      user_mobile: randomUser(),
      message: randomTemplate(),
      optional_message: `Bulk test ${i}`,
      location: randomLatLng(),
      time: new Date().toISOString(),
      acknowledged: status.acknowledged,
      resolved: status.resolved,
      department: status.acknowledged ? randomDepartment() : null,
    };

    existing.unshift(msg);

    if (i % 50 === 0) {
      logStep("BULK_PROGRESS", `Inserted ${i}...`);
      await sleep(50);
    }
  }

  save(existing);
  logStep("BULK_DONE", "Bulk insert completed.");
}

/* =========================
   TEST 2: LIVE STREAM
========================= */
async function liveStream(duration = 5000) {
  logStep("LIVE_STREAM", "Starting live message stream...");

  const start = Date.now();

  while (Date.now() - start < duration) {
    const data = load();

    const msg = {
      id: crypto.randomUUID(),
      user_mobile: randomUser(),
      message: randomTemplate(),
      optional_message: "Live SOS triggered",
      location: randomLatLng(),
      time: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      department: null,
    };

    data.unshift(msg);
    save(data);

    logStep("STREAM", `New SOS from ${msg.user_mobile}`);

    await sleep(300 + Math.random() * 700);
  }

  logStep("LIVE_DONE", "Live stream ended.");
}

/* =========================
   TEST 3: ACK SIMULATION
========================= */
async function simulateAcknowledgements() {
  logStep("ACK_SIM", "Simulating acknowledgements...");

  const data = load();

  data.forEach((m, i) => {
    if (!m.acknowledged && Math.random() > 0.5) {
      m.acknowledged = true;
      m.department = randomDepartment();

      console.log(`✅ ACK: ${m.id}`);
    }
  });

  save(data);
  logStep("ACK_DONE", "Acknowledgements updated.");
}

/* =========================
   TEST 4: RESOLUTION
========================= */
async function simulateResolution() {
  logStep("RESOLVE_SIM", "Resolving some cases...");

  const data = load();

  data.forEach((m) => {
    if (m.acknowledged && !m.resolved && Math.random() > 0.6) {
      m.resolved = true;
      console.log(`🎯 RESOLVED: ${m.id}`);
    }
  });

  save(data);
}

/* =========================
   TEST 5: DATA CORRUPTION
========================= */
async function injectCorruption() {
  logStep("CORRUPT", "Injecting bad data...");

  const data = load();

  data.push({
    id: null,
    user_mobile: null,
    message: undefined,
    location: null,
    time: "invalid-date",
  });

  save(data);

  console.warn("⚠️ Corrupted entry inserted.");
}

/* =========================
   TEST 6: PERFORMANCE READ
========================= */
function performanceTest() {
  logStep("PERF", "Reading all messages...");

  const start = performance.now();
  const data = load();
  const end = performance.now();

  console.log(`📊 Read ${data.length} messages in ${(end - start).toFixed(2)} ms`);
}

/* =========================
   TEST RUNNER
========================= */
async function runTests() {
  console.log("🔥 Running full chaos suite...\n");

  await bulkInsert(300);

  await liveStream(4000);

  await simulateAcknowledgements();

  await simulateResolution();

  await injectCorruption();

  performanceTest();

  console.log("\n✅ ALL TESTS COMPLETED");
}

/* =========================
   START
========================= */

runTests();

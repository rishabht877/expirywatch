import { closeDb, getDb } from "../db/connection.js";
import { ensureIndexes } from "../db/indexes.js";

const DEMO_EMAIL = "demo@expirywatch.dev";
const TARGET_RENEWALS = 1100;
const MIN_EXISTING = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const RENEWED_BY = [
  "Priya Patel",
  "Marcus Chen",
  "Sofia Alvarez",
  "Jordan Lee",
  "Aisha Khan",
  "Daniel Okafor",
  "Emily Novak",
  "Ravi Menon",
  "Hannah Schmidt",
  "Carlos Rivera",
];

// Typical renewal terms in days for each asset type.
const TERMS = {
  ssl_certificate: [90, 365],
  domain: [365, 730],
  api_key: [90, 180, 365],
  license: [365],
  other: [180, 365, 730],
};

const NOTES = {
  ssl_certificate: [
    "Reissued and deployed to the load balancer.",
    "Auto-renewed, verified the new chain.",
    "",
  ],
  domain: ["Renewed with auto-renew turned on.", "Paid by company card.", ""],
  api_key: [
    "Rotated and updated the secrets manager.",
    "Old key revoked after rollout.",
    "",
  ],
  license: ["Finance approved the renewal.", "Seat count reviewed.", ""],
  other: ["Contract signed for another term.", ""],
};

// Small deterministic PRNG so the generated data is the same on every run.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(5610);
const pick = (list) => list[Math.floor(random() * list.length)];

function buildRenewal(ownerId, asset, now) {
  // Spread over the last 365 days.
  const renewedAt = new Date(now - Math.floor(random() * 365 * DAY_MS));
  const termDays = pick(TERMS[asset.type]);
  return {
    ownerId,
    assetName: asset.name,
    type: asset.type,
    newExpiryDate: new Date(renewedAt.getTime() + termDays * DAY_MS),
    renewedBy: pick(RENEWED_BY),
    renewedAt,
    notes: pick(NOTES[asset.type]),
    createdAt: renewedAt,
    updatedAt: renewedAt,
  };
}

async function seedRenewals() {
  const db = await getDb();
  await ensureIndexes(db);

  const user = await db.collection("users").findOne({ email: DEMO_EMAIL });
  if (!user) {
    throw new Error(`Demo user not found. Run "npm run seed" first.`);
  }

  const renewals = db.collection("renewals");
  const existing = await renewals.countDocuments({ ownerId: user._id });
  if (existing >= MIN_EXISTING) {
    console.log(`Demo user already has ${existing} renewals. Nothing to seed.`);
    return;
  }

  // Renewals refer to the demo user's real assets so the data lines up.
  const assets = await db
    .collection("assets")
    .find({ ownerId: user._id }, { projection: { name: 1, type: 1 } })
    .toArray();
  if (assets.length === 0) {
    throw new Error(`Demo user has no assets. Run "npm run seed" first.`);
  }

  const now = Date.now();
  const docs = Array.from({ length: TARGET_RENEWALS - existing }, () =>
    buildRenewal(user._id, pick(assets), now),
  );
  const { insertedCount } = await renewals.insertMany(docs);
  console.log(
    `Inserted ${insertedCount} renewals. Demo user now has ${existing + insertedCount}.`,
  );
}

try {
  await seedRenewals();
  await closeDb();
  process.exit(0);
} catch (err) {
  const message = String(err?.message ?? err).replace(
    /mongodb(\+srv)?:\/\/\S+/gi,
    "<redacted>",
  );
  console.error(`Seed failed: ${err?.name ?? "Error"}: ${message}`);
  await closeDb();
  process.exit(1);
}

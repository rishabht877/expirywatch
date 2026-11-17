import bcrypt from "bcryptjs";
import { closeDb, getDb } from "../db/connection.js";
import { ensureIndexes } from "../db/indexes.js";

const DEMO_EMAIL = "demo@expirywatch.dev";
const TARGET_ASSETS = 1200;
const MIN_EXISTING = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const COMPANIES = [
  "acme",
  "northwind",
  "globex",
  "initech",
  "umbrella",
  "hooli",
  "stark",
  "wayne",
  "tyrell",
  "soylent",
];
const TLDS = ["com", "io", "dev", "net", "app", "co"];
const SUBDOMAINS = ["api", "www", "app", "auth", "cdn", "admin", "status"];
const SERVICES = [
  "billing-service",
  "checkout-api",
  "notifications",
  "search-indexer",
  "user-service",
  "reporting-worker",
  "mobile-backend",
];
const API_PROVIDERS = [
  "Stripe",
  "Twilio",
  "SendGrid",
  "OpenWeather",
  "Mapbox",
  "Algolia",
  "Datadog",
];
const LICENSES = [
  "JetBrains All Products",
  "Adobe Creative Cloud",
  "Microsoft 365 E3",
  "Figma Organization",
  "Slack Business+",
  "Atlassian Jira Cloud",
  "GitHub Enterprise",
];
const OTHER_ITEMS = [
  "Apple Push Notification certificate",
  "Code signing certificate",
  "SAML IdP signing certificate",
  "Cloud support contract",
  "Penetration test attestation",
];
const OWNERS = [
  "Platform Team",
  "Payments Team",
  "Security Team",
  "IT Operations",
  "Mobile Team",
  "Data Team",
  "Priya Patel",
  "Marcus Chen",
  "Sofia Alvarez",
  "Jordan Lee",
];
const ENVIRONMENTS = ["production", "staging", "development"];

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

const random = createRandom(2026);
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => min + Math.floor(random() * (max - min + 1));

function domainName() {
  return `${pick(COMPANIES)}-${pick(["shop", "cloud", "labs", "pay", "hq"])}.${pick(TLDS)}`;
}

function assetDetails() {
  const roll = random();
  if (roll < 0.35) {
    const host = `${pick(SUBDOMAINS)}.${domainName()}`;
    return {
      type: "ssl_certificate",
      name: `${host} TLS certificate`,
      notes: `Issued by ${pick(["Let's Encrypt", "DigiCert", "Sectigo", "GlobalSign"])}.`,
    };
  }
  if (roll < 0.55) {
    return {
      type: "domain",
      name: domainName(),
      notes: `Registered with ${pick(["Namecheap", "Cloudflare", "GoDaddy", "Route 53"])}.`,
    };
  }
  if (roll < 0.75) {
    return {
      type: "api_key",
      name: `${pick(API_PROVIDERS)} key for ${pick(SERVICES)}`,
      notes: "Rotate before expiry and update the secrets manager.",
    };
  }
  if (roll < 0.92) {
    return {
      type: "license",
      name: `${pick(LICENSES)} (${between(5, 200)} seats)`,
      notes: "Renewal requires finance approval.",
    };
  }
  return { type: "other", name: pick(OTHER_ITEMS), notes: "" };
}

// About 8% expired, 12% expiring within 30 days, 80% later.
function expiryDate(now) {
  const roll = random();
  let days;
  if (roll < 0.08) {
    days = -between(1, 365);
  } else if (roll < 0.2) {
    days = between(0, 29);
  } else {
    days = between(31, 730);
  }
  return new Date(now + days * DAY_MS + between(0, DAY_MS - 1));
}

function buildAsset(ownerId, now) {
  const createdAt = new Date(now - between(1, 540) * DAY_MS);
  return {
    ownerId,
    ...assetDetails(),
    environment: pick(ENVIRONMENTS),
    owner: pick(OWNERS),
    expiresAt: expiryDate(now),
    createdAt,
    updatedAt: createdAt,
  };
}

async function findOrCreateDemoUser(users) {
  const existing = await users.findOne({ email: DEMO_EMAIL });
  if (existing) {
    return existing;
  }
  const password = process.env.DEMO_PASSWORD;
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  ) {
    throw new Error("DEMO_PASSWORD must be set and be 8 to 72 characters");
  }
  const user = {
    email: DEMO_EMAIL,
    name: "Demo User",
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date(),
  };
  const { insertedId } = await users.insertOne(user);
  console.log(`Created demo user ${DEMO_EMAIL}`);
  return { ...user, _id: insertedId };
}

async function seed() {
  const db = await getDb();
  await ensureIndexes(db);

  const user = await findOrCreateDemoUser(db.collection("users"));
  const assets = db.collection("assets");
  const existing = await assets.countDocuments({ ownerId: user._id });

  if (existing >= MIN_EXISTING) {
    console.log(`Demo user already has ${existing} assets. Nothing to seed.`);
    return;
  }

  const now = Date.now();
  const docs = Array.from({ length: TARGET_ASSETS - existing }, () =>
    buildAsset(user._id, now),
  );
  const { insertedCount } = await assets.insertMany(docs);
  console.log(
    `Inserted ${insertedCount} assets. Demo user now has ${existing + insertedCount}.`,
  );
}

try {
  await seed();
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

import { getDb, closeDb } from "../db/connection.js";

try {
  const db = await getDb();
  await db.command({ ping: 1 });
  console.log(`Connected to ${db.databaseName}`);
  await closeDb();
  process.exit(0);
} catch (err) {
  const message = String(err?.message ?? err).replace(
    /mongodb(\+srv)?:\/\/\S+/gi,
    "<redacted>",
  );
  console.error(`Database check failed: ${err?.name ?? "Error"}: ${message}`);
  process.exit(1);
}

export async function ensureIndexes(db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("assets").createIndex({ ownerId: 1, expiresAt: 1 }),
    db.collection("renewals").createIndex({ ownerId: 1, renewedAt: -1 }),
  ]);
}

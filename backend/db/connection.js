import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

const { MONGODB_URI, DB_NAME } = process.env;

if (!MONGODB_URI || !DB_NAME) {
  throw new Error("MONGODB_URI and DB_NAME must be set in backend/.env");
}

const client = new MongoClient(MONGODB_URI);
let connectPromise = null;

export async function getClient() {
  if (!connectPromise) {
    connectPromise = client.connect().catch((err) => {
      connectPromise = null;
      throw err;
    });
  }
  return connectPromise;
}

export async function getDb() {
  await getClient();
  return client.db(DB_NAME);
}

export async function closeDb() {
  if (connectPromise) {
    connectPromise = null;
    await client.close();
  }
}

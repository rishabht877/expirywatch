import MongoStore from "connect-mongo";
import express from "express";
import session from "express-session";
import passport, { SESSION_COOKIE_NAME } from "./auth/passport.js";
import { closeDb, getClient, getDb } from "./db/connection.js";
import { ensureIndexes } from "./db/indexes.js";
import assetRoutes from "./routes/assets.js";
import authRoutes from "./routes/auth.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const { SESSION_SECRET, DB_NAME, PORT, NODE_ENV } = process.env;
if (!SESSION_SECRET || !PORT) {
  throw new Error("SESSION_SECRET and PORT must be set in backend/.env");
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));
app.use(
  session({
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      clientPromise: getClient(),
      dbName: DB_NAME,
      collectionName: "sessions",
      ttl: SESSION_TTL_SECONDS,
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
      maxAge: SESSION_TTL_SECONDS * 1000,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
// Dins: mount the renewals router here, e.g.
// app.use("/api/renewals", renewalRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ errors: ["Not found"] });
});

// Express only treats a middleware as an error handler when it takes four arguments.
app.use((err, req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ errors: ["Malformed JSON body"] });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ errors: ["Request body is too large"] });
  }
  console.error(`Unhandled error: ${err.name}`);
  return res.status(500).json({ errors: ["Internal server error"] });
});

await ensureIndexes(await getDb());

const server = app.listen(Number(PORT), () => {
  console.log(`ExpiryWatch API listening on port ${PORT}`);
});

function shutdown() {
  server.close(() => {
    closeDb().finally(() => process.exit(0));
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

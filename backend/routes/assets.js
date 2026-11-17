import { Router } from "express";
import { requireAuth } from "../auth/passport.js";
import { getDb } from "../db/connection.js";
import { parseObjectId } from "../lib/objectId.js";
import { parsePagination } from "../lib/pagination.js";
import {
  ASSET_TYPES,
  ENVIRONMENTS,
  checkEnum,
  checkString,
  rejectUnknownFields,
  validateAsset,
} from "../lib/validation.js";

const EXPIRING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const STATUSES = ["expired", "expiring", "ok"];
const SORTS = {
  expiresAt: { expiresAt: 1, _id: 1 },
  "-expiresAt": { expiresAt: -1, _id: -1 },
  name: { name: 1, _id: 1 },
  "-name": { name: -1, _id: -1 },
  createdAt: { createdAt: 1, _id: 1 },
  "-createdAt": { createdAt: -1, _id: -1 },
};
const LIST_QUERY_FIELDS = [
  "type",
  "environment",
  "owner",
  "q",
  "status",
  "sort",
  "page",
  "limit",
];

const router = Router();
router.use(requireAuth);

function assets(db) {
  return db.collection("assets");
}

function expiryRange(status, now) {
  const soon = new Date(now.getTime() + EXPIRING_WINDOW_MS);
  if (status === "expired") {
    return { $lt: now };
  }
  if (status === "expiring") {
    return { $gte: now, $lt: soon };
  }
  return { $gte: soon };
}

function statusOf(expiresAt, now) {
  if (expiresAt < now) {
    return "expired";
  }
  return expiresAt.getTime() - now.getTime() < EXPIRING_WINDOW_MS
    ? "expiring"
    : "ok";
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toAsset(doc, now = new Date()) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    environment: doc.environment,
    owner: doc.owner,
    expiresAt: doc.expiresAt,
    notes: doc.notes,
    status: statusOf(doc.expiresAt, now),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function badRequest(res, errors) {
  return res.status(400).json({ errors });
}

function notFound(res) {
  return res.status(404).json({ errors: ["Asset not found"] });
}

router.get("/", async (req, res) => {
  const query = req.query;
  const errors = [];
  rejectUnknownFields(query, LIST_QUERY_FIELDS, errors);

  const filter = { ownerId: req.user._id };
  const now = new Date();

  if (query.type !== undefined) {
    filter.type = checkEnum(query.type, "type", ASSET_TYPES, errors);
  }
  if (query.environment !== undefined) {
    filter.environment = checkEnum(
      query.environment,
      "environment",
      ENVIRONMENTS,
      errors,
    );
  }
  if (query.owner !== undefined) {
    const owner = checkString(
      query.owner,
      "owner",
      { min: 1, max: 80 },
      errors,
    );
    if (owner !== undefined) {
      filter.owner = { $regex: `^${escapeRegex(owner)}$`, $options: "i" };
    }
  }
  if (query.q !== undefined) {
    const q = checkString(query.q, "q", { min: 1, max: 100 }, errors);
    if (q !== undefined) {
      filter.name = { $regex: escapeRegex(q), $options: "i" };
    }
  }
  if (query.status !== undefined) {
    const status = checkEnum(query.status, "status", STATUSES, errors);
    if (status !== undefined) {
      filter.expiresAt = expiryRange(status, now);
    }
  }
  const sortKey =
    query.sort === undefined
      ? "expiresAt"
      : checkEnum(query.sort, "sort", Object.keys(SORTS), errors);
  const pagination = parsePagination(query, errors);

  if (errors.length) {
    return badRequest(res, errors);
  }

  const { page, limit, skip } = pagination;
  const db = await getDb();
  const [docs, total] = await Promise.all([
    assets(db)
      .find(filter)
      .sort(SORTS[sortKey])
      .skip(skip)
      .limit(limit)
      .toArray(),
    assets(db).countDocuments(filter),
  ]);

  return res.json({
    items: docs.map((doc) => toAsset(doc, now)),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Must stay above "/:id" so "summary" is not treated as an id.
router.get("/summary", async (req, res) => {
  const ownerId = req.user._id;
  const now = new Date();
  const db = await getDb();
  const [expired, expiring, ok] = await Promise.all(
    STATUSES.map((status) =>
      assets(db).countDocuments({
        ownerId,
        expiresAt: expiryRange(status, now),
      }),
    ),
  );
  return res.json({ expired, expiring, ok, total: expired + expiring + ok });
});

router.get("/:id", async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    return badRequest(res, ["id must be a valid asset id"]);
  }
  const db = await getDb();
  const doc = await assets(db).findOne({ _id: id, ownerId: req.user._id });
  return doc ? res.json({ asset: toAsset(doc) }) : notFound(res);
});

router.post("/", async (req, res) => {
  const { errors, value } = validateAsset(req.body);
  if (errors.length) {
    return badRequest(res, errors);
  }
  const now = new Date();
  const doc = {
    ownerId: req.user._id,
    ...value,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  const { insertedId } = await assets(db).insertOne(doc);
  return res.status(201).json({ asset: toAsset({ ...doc, _id: insertedId }) });
});

// Replaces every editable field. Omitted notes are reset to "".
router.put("/:id", async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    return badRequest(res, ["id must be a valid asset id"]);
  }
  const { errors, value } = validateAsset(req.body);
  if (errors.length) {
    return badRequest(res, errors);
  }
  const db = await getDb();
  const doc = await assets(db).findOneAndUpdate(
    { _id: id, ownerId: req.user._id },
    { $set: { ...value, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? res.json({ asset: toAsset(doc) }) : notFound(res);
});

router.delete("/:id", async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    return badRequest(res, ["id must be a valid asset id"]);
  }
  const db = await getDb();
  const { deletedCount } = await assets(db).deleteOne({
    _id: id,
    ownerId: req.user._id,
  });
  return deletedCount ? res.status(204).end() : notFound(res);
});

export default router;

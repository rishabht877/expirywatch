import { Router } from "express";
import { requireAuth } from "../auth/passport.js";
import { getDb } from "../db/connection.js";
import { parseObjectId } from "../lib/objectId.js";
import { parsePagination } from "../lib/pagination.js";
import { validateRenewal } from "../lib/renewalValidation.js";
import {
  ASSET_TYPES,
  checkDate,
  checkEnum,
  checkString,
  rejectUnknownFields,
} from "../lib/validation.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const NEWEST_FIRST = { renewedAt: -1, _id: -1 };
const LIST_QUERY_FIELDS = [
  "type",
  "renewedBy",
  "from",
  "to",
  "q",
  "page",
  "limit",
];

const router = Router();
router.use(requireAuth);

function renewals(db) {
  return db.collection("renewals");
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toRenewal(doc) {
  return {
    id: doc._id.toString(),
    assetName: doc.assetName,
    type: doc.type,
    newExpiryDate: doc.newExpiryDate,
    renewedBy: doc.renewedBy,
    renewedAt: doc.renewedAt,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function badRequest(res, errors) {
  return res.status(400).json({ errors });
}

function notFound(res) {
  return res.status(404).json({ errors: ["Renewal not found"] });
}

router.get("/", async (req, res) => {
  const query = req.query;
  const errors = [];
  rejectUnknownFields(query, LIST_QUERY_FIELDS, errors);

  const filter = { ownerId: req.user._id };

  if (query.type !== undefined) {
    filter.type = checkEnum(query.type, "type", ASSET_TYPES, errors);
  }
  if (query.renewedBy !== undefined) {
    const renewedBy = checkString(
      query.renewedBy,
      "renewedBy",
      { min: 1, max: 80 },
      errors,
    );
    if (renewedBy !== undefined) {
      filter.renewedBy = {
        $regex: `^${escapeRegex(renewedBy)}$`,
        $options: "i",
      };
    }
  }
  if (query.q !== undefined) {
    const q = checkString(query.q, "q", { min: 1, max: 100 }, errors);
    if (q !== undefined) {
      filter.assetName = { $regex: escapeRegex(q), $options: "i" };
    }
  }

  // from and to are inclusive. A date-only "to" covers that whole day.
  const from =
    query.from === undefined
      ? undefined
      : checkDate(query.from, "from", errors);
  let to =
    query.to === undefined ? undefined : checkDate(query.to, "to", errors);
  if (to && DATE_ONLY.test(query.to)) {
    to = new Date(to.getTime() + DAY_MS - 1);
  }
  if (from && to && from > to) {
    errors.push("from must be on or before to");
  }
  if (from || to) {
    filter.renewedAt = {};
    if (from) filter.renewedAt.$gte = from;
    if (to) filter.renewedAt.$lte = to;
  }

  const pagination = parsePagination(query, errors);

  if (errors.length) {
    return badRequest(res, errors);
  }

  const { page, limit, skip } = pagination;
  const db = await getDb();
  const [docs, total] = await Promise.all([
    renewals(db)
      .find(filter)
      .sort(NEWEST_FIRST)
      .skip(skip)
      .limit(limit)
      .toArray(),
    renewals(db).countDocuments(filter),
  ]);

  return res.json({
    items: docs.map(toRenewal),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/:id", async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    return badRequest(res, ["id must be a valid renewal id"]);
  }
  const db = await getDb();
  const doc = await renewals(db).findOne({ _id: id, ownerId: req.user._id });
  return doc ? res.json({ renewal: toRenewal(doc) }) : notFound(res);
});

router.post("/", async (req, res) => {
  const { errors, value } = validateRenewal(req.body);
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
  const { insertedId } = await renewals(db).insertOne(doc);
  return res
    .status(201)
    .json({ renewal: toRenewal({ ...doc, _id: insertedId }) });
});

// Replaces every editable field. Omitted notes are reset to "".
router.put("/:id", async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    return badRequest(res, ["id must be a valid renewal id"]);
  }
  const { errors, value } = validateRenewal(req.body);
  if (errors.length) {
    return badRequest(res, errors);
  }
  const db = await getDb();
  const doc = await renewals(db).findOneAndUpdate(
    { _id: id, ownerId: req.user._id },
    { $set: { ...value, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? res.json({ renewal: toRenewal(doc) }) : notFound(res);
});

router.delete("/:id", async (req, res) => {
  const id = parseObjectId(req.params.id);
  if (!id) {
    return badRequest(res, ["id must be a valid renewal id"]);
  }
  const db = await getDb();
  const { deletedCount } = await renewals(db).deleteOne({
    _id: id,
    ownerId: req.user._id,
  });
  return deletedCount ? res.status(204).end() : notFound(res);
});

export default router;

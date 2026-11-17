import {
  ASSET_TYPES,
  checkDate,
  checkEnum,
  checkString,
  isPlainObject,
  rejectUnknownFields,
} from "./validation.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const RENEWAL_FIELDS = [
  "assetName",
  "type",
  "newExpiryDate",
  "renewedBy",
  "renewedAt",
  "notes",
];

// Validates a full renewal body (used for both create and replace).
// Returns { errors, value } where value holds only whitelisted, typed fields.
export function validateRenewal(body) {
  const errors = [];
  if (!isPlainObject(body)) {
    return { errors: ["request body must be a JSON object"], value: null };
  }
  rejectUnknownFields(body, RENEWAL_FIELDS, errors);

  const value = {
    assetName: checkString(
      body.assetName,
      "assetName",
      { min: 1, max: 120 },
      errors,
    ),
    type: checkEnum(body.type, "type", ASSET_TYPES, errors),
    newExpiryDate: checkDate(body.newExpiryDate, "newExpiryDate", errors),
    renewedBy: checkString(
      body.renewedBy,
      "renewedBy",
      { min: 1, max: 80 },
      errors,
    ),
    renewedAt: checkDate(body.renewedAt, "renewedAt", errors),
    notes:
      body.notes === undefined
        ? ""
        : checkString(body.notes, "notes", { min: 0, max: 1000 }, errors),
  };

  // A one day allowance covers time zones ahead of UTC.
  if (value.renewedAt && value.renewedAt.getTime() > Date.now() + DAY_MS) {
    errors.push("renewedAt cannot be in the future");
  }
  if (
    value.renewedAt &&
    value.newExpiryDate &&
    value.newExpiryDate <= value.renewedAt
  ) {
    errors.push("newExpiryDate must be after renewedAt");
  }

  return { errors, value: errors.length ? null : value };
}

export const ASSET_TYPES = [
  "ssl_certificate",
  "domain",
  "api_key",
  "license",
  "other",
];
export const ENVIRONMENTS = ["production", "staging", "development"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/;

export function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

// Checks a string field, pushes an error if invalid, and returns the trimmed value.
export function checkString(value, field, { min, max }, errors) {
  if (typeof value !== "string") {
    errors.push(`${field} must be a string`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    errors.push(
      min === 0
        ? `${field} must be at most ${max} characters`
        : `${field} must be between ${min} and ${max} characters`,
    );
    return undefined;
  }
  return trimmed;
}

export function checkEnum(value, field, allowed, errors) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    errors.push(`${field} must be one of: ${allowed.join(", ")}`);
    return undefined;
  }
  return value;
}

export function checkName(value, errors) {
  return checkString(value, "name", { min: 1, max: 80 }, errors);
}

export function checkEmail(value, errors) {
  if (typeof value !== "string") {
    errors.push("email must be a string");
    return undefined;
  }
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push("email must be a valid email address");
    return undefined;
  }
  return email;
}

// Passwords are not trimmed. 72 is the bcrypt input limit.
export function checkPassword(value, errors, field = "password") {
  if (typeof value !== "string") {
    errors.push(`${field} must be a string`);
    return undefined;
  }
  if (value.length < 8 || value.length > 72) {
    errors.push(`${field} must be between 8 and 72 characters`);
    return undefined;
  }
  return value;
}

export function checkDate(value, field, errors) {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
    errors.push(`${field} must be an ISO 8601 date string`);
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors.push(`${field} must be a valid date`);
    return undefined;
  }
  return date;
}

export function rejectUnknownFields(body, allowed, errors) {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) {
      errors.push(`${key} is not an allowed field`);
    }
  }
}

const ASSET_FIELDS = [
  "name",
  "type",
  "environment",
  "owner",
  "expiresAt",
  "notes",
];

// Validates a full asset body (used for both create and replace).
// Returns { errors, value } where value holds only whitelisted, typed fields.
export function validateAsset(body) {
  const errors = [];
  if (!isPlainObject(body)) {
    return { errors: ["request body must be a JSON object"], value: null };
  }
  rejectUnknownFields(body, ASSET_FIELDS, errors);

  const value = {
    name: checkString(body.name, "name", { min: 1, max: 120 }, errors),
    type: checkEnum(body.type, "type", ASSET_TYPES, errors),
    environment: checkEnum(
      body.environment,
      "environment",
      ENVIRONMENTS,
      errors,
    ),
    owner: checkString(body.owner, "owner", { min: 1, max: 80 }, errors),
    expiresAt: checkDate(body.expiresAt, "expiresAt", errors),
    notes:
      body.notes === undefined
        ? ""
        : checkString(body.notes, "notes", { min: 0, max: 1000 }, errors),
  };

  return { errors, value: errors.length ? null : value };
}

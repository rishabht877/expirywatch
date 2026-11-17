const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(raw, field, max, errors) {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    errors.push(`${field} must be a positive integer`);
    return null;
  }
  const value = Number(raw);
  if (value < 1 || value > max) {
    errors.push(`${field} must be between 1 and ${max}`);
    return null;
  }
  return value;
}

export function parsePagination(query, errors) {
  const page =
    query.page === undefined
      ? 1
      : parsePositiveInt(query.page, "page", Number.MAX_SAFE_INTEGER, errors);
  const limit =
    query.limit === undefined
      ? DEFAULT_LIMIT
      : parsePositiveInt(query.limit, "limit", MAX_LIMIT, errors);

  if (page === null || limit === null) {
    return null;
  }
  return { page, limit, skip: (page - 1) * limit };
}

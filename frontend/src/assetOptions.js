// Allowed values and display labels, matching backend/lib/validation.js.

export const ASSET_TYPES = [
  { value: "ssl_certificate", label: "SSL certificate" },
  { value: "domain", label: "Domain" },
  { value: "api_key", label: "API key" },
  { value: "license", label: "License" },
  { value: "other", label: "Other" },
];

export const ENVIRONMENTS = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

export const STATUSES = [
  { value: "expired", label: "Expired" },
  { value: "expiring", label: "Expiring soon" },
  { value: "ok", label: "OK" },
];

export const SORTS = [
  { value: "expiresAt", label: "Soonest expiry" },
  { value: "-expiresAt", label: "Latest expiry" },
  { value: "name", label: "Name A to Z" },
  { value: "-name", label: "Name Z to A" },
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
];

function labelFrom(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export const typeLabel = (value) => labelFrom(ASSET_TYPES, value);
export const environmentLabel = (value) => labelFrom(ENVIRONMENTS, value);

import { ObjectId } from "mongodb";

const HEX_24 = /^[a-f0-9]{24}$/i;

// Returns an ObjectId for a 24-character hex string, or null for anything else.
export function parseObjectId(value) {
  if (typeof value !== "string" || !HEX_24.test(value)) {
    return null;
  }
  return new ObjectId(value);
}

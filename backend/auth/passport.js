import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getDb } from "../db/connection.js";
import { parseObjectId } from "../lib/objectId.js";

export const SESSION_COOKIE_NAME = "expirywatch.sid";

// Fields that are safe to expose on req.user and in API responses.
export const PUBLIC_USER_FIELDS = { email: 1, name: 1, createdAt: 1 };

export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        if (typeof email !== "string" || typeof password !== "string") {
          return done(null, false);
        }
        const db = await getDb();
        const user = await db
          .collection("users")
          .findOne({ email: email.trim().toLowerCase() });
        const matches =
          user !== null && (await bcrypt.compare(password, user.passwordHash));
        return done(null, matches ? user : false);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const userId = parseObjectId(id);
    if (!userId) {
      return done(null, false);
    }
    const db = await getDb();
    const user = await db
      .collection("users")
      .findOne({ _id: userId }, { projection: PUBLIC_USER_FIELDS });
    return done(null, user ?? false);
  } catch (err) {
    return done(err);
  }
});

export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ errors: ["You must be logged in"] });
}

export default passport;

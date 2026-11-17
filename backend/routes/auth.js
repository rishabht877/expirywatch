import bcrypt from "bcryptjs";
import { Router } from "express";
import passport, {
  PUBLIC_USER_FIELDS,
  SESSION_COOKIE_NAME,
  requireAuth,
  toPublicUser,
} from "../auth/passport.js";
import { getDb } from "../db/connection.js";
import {
  checkEmail,
  checkName,
  checkPassword,
  isPlainObject,
  rejectUnknownFields,
} from "../lib/validation.js";

const BCRYPT_ROUNDS = 12;
const DUPLICATE_KEY = 11000;

const router = Router();

function logIn(req, user) {
  return new Promise((resolve, reject) => {
    req.login(user, (err) => (err ? reject(err) : resolve()));
  });
}

function authenticateLocal(req, res) {
  return new Promise((resolve, reject) => {
    passport.authenticate("local", (err, user) =>
      err ? reject(err) : resolve(user),
    )(req, res, reject);
  });
}

// Logs out, removes the session from the store and clears the cookie.
function endSession(req, res) {
  return new Promise((resolve, reject) => {
    req.logout((logoutErr) => {
      if (logoutErr) {
        return reject(logoutErr);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          return reject(destroyErr);
        }
        res.clearCookie(SESSION_COOKIE_NAME);
        resolve();
      });
    });
  });
}

function badRequest(res, errors) {
  return res.status(400).json({ errors });
}

router.post("/register", async (req, res) => {
  const body = req.body;
  if (!isPlainObject(body)) {
    return badRequest(res, ["request body must be a JSON object"]);
  }
  const errors = [];
  rejectUnknownFields(body, ["name", "email", "password"], errors);
  const name = checkName(body.name, errors);
  const email = checkEmail(body.email, errors);
  const password = checkPassword(body.password, errors);
  if (errors.length) {
    return badRequest(res, errors);
  }

  const user = {
    email,
    name,
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    createdAt: new Date(),
  };

  try {
    const db = await getDb();
    const { insertedId } = await db.collection("users").insertOne(user);
    user._id = insertedId;
  } catch (err) {
    if (err.code === DUPLICATE_KEY) {
      return res
        .status(409)
        .json({ errors: ["An account with that email already exists"] });
    }
    throw err;
  }

  await logIn(req, user);
  return res.status(201).json({ user: toPublicUser(user) });
});

router.post("/login", async (req, res) => {
  const body = req.body;
  if (!isPlainObject(body)) {
    return badRequest(res, ["request body must be a JSON object"]);
  }
  const errors = [];
  if (typeof body.email !== "string" || body.email.trim() === "") {
    errors.push("email must be a non-empty string");
  }
  if (typeof body.password !== "string" || body.password === "") {
    errors.push("password must be a non-empty string");
  }
  if (errors.length) {
    return badRequest(res, errors);
  }

  const user = await authenticateLocal(req, res);
  if (!user) {
    return res.status(401).json({ errors: ["Invalid email or password"] });
  }
  await logIn(req, user);
  return res.json({ user: toPublicUser(user) });
});

router.post("/logout", async (req, res) => {
  await endSession(req, res);
  return res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: toPublicUser(req.user) });
});

// Update name and/or password. Changing the password requires currentPassword.
router.put("/me", requireAuth, async (req, res) => {
  const body = req.body;
  if (!isPlainObject(body)) {
    return badRequest(res, ["request body must be a JSON object"]);
  }
  const errors = [];
  rejectUnknownFields(body, ["name", "password", "currentPassword"], errors);
  if (body.name === undefined && body.password === undefined) {
    errors.push("Provide name or password to update");
  }
  const update = {};
  if (body.name !== undefined) {
    update.name = checkName(body.name, errors);
  }
  if (body.password !== undefined) {
    checkPassword(body.password, errors);
    checkPassword(body.currentPassword, errors, "currentPassword");
  }
  if (errors.length) {
    return badRequest(res, errors);
  }

  const db = await getDb();
  const users = db.collection("users");

  if (body.password !== undefined) {
    const stored = await users.findOne(
      { _id: req.user._id },
      { projection: { passwordHash: 1 } },
    );
    if (
      !stored ||
      !(await bcrypt.compare(body.currentPassword, stored.passwordHash))
    ) {
      return badRequest(res, ["currentPassword is incorrect"]);
    }
    update.passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  }

  const updated = await users.findOneAndUpdate(
    { _id: req.user._id },
    { $set: update },
    { returnDocument: "after", projection: PUBLIC_USER_FIELDS },
  );
  if (!updated) {
    return res.status(404).json({ errors: ["User not found"] });
  }
  return res.json({ user: toPublicUser(updated) });
});

// Deletes the account and every asset it owns, then ends the session.
router.delete("/me", requireAuth, async (req, res) => {
  const userId = req.user._id;
  const db = await getDb();
  await db.collection("assets").deleteMany({ ownerId: userId });
  await db.collection("users").deleteOne({ _id: userId });
  await endSession(req, res);
  return res.status(204).end();
});

export default router;

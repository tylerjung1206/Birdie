const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db.js");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "birdie-dev-secret-change-in-production";

app.use(cors({ origin: true }));
app.use(express.json());

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function adminMiddleware(req, res, next) {
  const row = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(req.userId);
  if (!row || !row.is_admin) return res.status(403).json({ error: "Admin required" });
  next();
}

// POST /auth/register
app.post("/auth/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const u = String(username).trim().toLowerCase();
  if (u.length < 2 || u.length > 32) {
    return res.status(400).json({ error: "Username must be 2–32 characters" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
    const info = stmt.run(u, hash);
    const row = db.prepare("SELECT id, username, is_admin, avatar, about_me, fun_fact, favorite_club FROM users WHERE id = ?").get(info.lastInsertRowid);
    const token = jwt.sign(
      { userId: row.id, username: row.username, isAdmin: !!row.is_admin },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({ token, user: toUser(row) });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Username already taken" });
    }
    throw e;
  }
});

// POST /auth/login
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const u = String(username).trim().toLowerCase();
  const row = db.prepare("SELECT id, username, password_hash, is_admin, avatar, about_me, fun_fact, favorite_club FROM users WHERE username = ?").get(u);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const token = jwt.sign(
    { userId: row.id, username: row.username, isAdmin: !!row.is_admin },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
  res.json({ token, user: toUser(row) });
});

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    isAdmin: !!row.is_admin,
    avatar: row.avatar || null,
    aboutMe: row.about_me || null,
    funFact: row.fun_fact || null,
    favoriteClub: row.favorite_club || null
  };
}

// GET /users/search?q=
app.get("/users/search", authMiddleware, (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (q.length < 2) {
    return res.json([]);
  }
  const rows = db
    .prepare(
      "SELECT id, username, created_at FROM users WHERE username LIKE ? AND id != ? LIMIT 20"
    )
    .all(`%${q}%`, req.userId);
  res.json(rows.map((r) => ({ id: r.id, username: r.username })));
});

// GET /users/me
app.get("/users/me", authMiddleware, (req, res) => {
  const row = db.prepare("SELECT id, username, is_admin, avatar, about_me, fun_fact, favorite_club, created_at FROM users WHERE id = ?").get(req.userId);
  if (!row) return res.status(404).json({ error: "User not found" });
  const roundCount = db.prepare("SELECT COUNT(*) as c FROM rounds WHERE user_id = ?").get(req.userId);
  res.json({
    ...toUser(row),
    roundCount: roundCount?.c ?? 0,
    createdAt: row.created_at
  });
});

// PUT /users/me/profile
app.put("/users/me/profile", authMiddleware, (req, res) => {
  const { avatar, aboutMe, funFact, favoriteClub } = req.body || {};
  db.prepare(
    "UPDATE users SET avatar = ?, about_me = ?, fun_fact = ?, favorite_club = ? WHERE id = ?"
  ).run(
    avatar ?? null,
    aboutMe ?? null,
    funFact ?? null,
    favoriteClub ?? null,
    req.userId
  );
  const row = db.prepare("SELECT id, username, is_admin, avatar, about_me, fun_fact, favorite_club FROM users WHERE id = ?").get(req.userId);
  res.json(toUser(row));
});

// GET /users/:id
app.get("/users/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare("SELECT id, username, is_admin, avatar, about_me, fun_fact, favorite_club, created_at FROM users WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "User not found" });
  const roundCount = db.prepare("SELECT COUNT(*) as c FROM rounds WHERE user_id = ?").get(id);
  res.json({
    ...toUser(row),
    roundCount: roundCount?.c ?? 0,
    createdAt: row.created_at
  });
});

// GET /users/:id/rounds
app.get("/users/:id/rounds", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = db
    .prepare(
      `SELECT id, user_id, date, course, score, putts, gir, gir_total, fairways, fairways_total, notes, created_at
       FROM rounds WHERE user_id = ? ORDER BY date DESC LIMIT 100`
    )
    .all(id);
  const rounds = rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    course: r.course ? JSON.parse(r.course) : null,
    score: r.score,
    putts: r.putts,
    gir: r.gir,
    girTotal: r.gir_total,
    fairways: r.fairways,
    fairwaysTotal: r.fairways_total,
    notes: r.notes,
    createdAt: r.created_at
  }));
  res.json(rounds);
});

// GET /rounds (my rounds)
app.get("/rounds", authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, user_id, date, course, score, putts, gir, gir_total, fairways, fairways_total, notes, created_at
       FROM rounds WHERE user_id = ? ORDER BY date DESC`
    )
    .all(req.userId);
  const rounds = rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    course: r.course ? JSON.parse(r.course) : null,
    score: r.score,
    putts: r.putts,
    gir: r.gir,
    girTotal: r.gir_total,
    fairways: r.fairways,
    fairwaysTotal: r.fairways_total,
    notes: r.notes,
    createdAt: r.created_at
  }));
  res.json(rounds);
});

// POST /rounds
app.post("/rounds", authMiddleware, (req, res) => {
  const body = req.body || {};
  const course = body.course ? JSON.stringify(body.course) : null;
  const stmt = db.prepare(
    `INSERT INTO rounds (user_id, date, course, score, putts, gir, gir_total, fairways, fairways_total, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    req.userId,
    body.date || new Date().toISOString().slice(0, 10),
    course,
    body.score ?? null,
    body.putts ?? null,
    body.gir ?? null,
    body.girTotal ?? 18,
    body.fairways ?? null,
    body.fairwaysTotal ?? 14,
    body.notes || null
  );
  const row = db.prepare("SELECT * FROM rounds WHERE id = ?").get(info.lastInsertRowid);
  const r = {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    course: row.course ? JSON.parse(row.course) : null,
    score: row.score,
    putts: row.putts,
    gir: row.gir,
    girTotal: row.gir_total,
    fairways: row.fairways,
    fairwaysTotal: row.fairways_total,
    notes: row.notes,
    createdAt: row.created_at
  };
  res.status(201).json(r);
});

// POST /admin/setup — one-time: make user admin and/or reset password (requires BIRDIE_SETUP_SECRET)
app.post("/admin/setup", (req, res) => {
  const secret = process.env.BIRDIE_SETUP_SECRET;
  if (!secret) {
    return res.status(503).json({ error: "Setup not configured" });
  }
  const { secret: bodySecret, username, password } = req.body || {};
  if (bodySecret !== secret || !username) {
    return res.status(401).json({ error: "Invalid setup" });
  }
  const u = String(username).trim().toLowerCase();
  const row = db.prepare("SELECT id FROM users WHERE username = ?").get(u);
  if (!row) return res.status(404).json({ error: "User not found" });
  db.prepare("UPDATE users SET is_admin = 1 WHERE username = ?").run(u);
  if (password && String(password).length >= 6) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(hash, u);
  }
  res.json({ ok: true, message: `${u} is now admin${password ? ", password reset" : ""}` });
});

// GET /admin/users
app.get("/admin/users", authMiddleware, adminMiddleware, (req, res) => {
  const rows = db.prepare(
    "SELECT u.id, u.username, u.is_admin, u.created_at, COUNT(r.id) as round_count FROM users u LEFT JOIN rounds r ON r.user_id = u.id GROUP BY u.id ORDER BY u.username"
  ).all();
  res.json(rows.map((r) => ({
    id: r.id,
    username: r.username,
    isAdmin: !!r.is_admin,
    roundCount: r.round_count ?? 0,
    createdAt: r.created_at
  })));
});

// POST /admin/users/:id/admin
app.post("/admin/users/:id/admin", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { admin } = req.body || {};
  db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(admin ? 1 : 0, id);
  const row = db.prepare("SELECT id, username, is_admin FROM users WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json({ id: row.id, username: row.username, isAdmin: !!row.is_admin });
});

// GET /admin/stats
app.get("/admin/stats", authMiddleware, adminMiddleware, (req, res) => {
  const users = db.prepare("SELECT COUNT(*) as c FROM users").get();
  const rounds = db.prepare("SELECT COUNT(*) as c FROM rounds").get();
  res.json({ userCount: users?.c ?? 0, roundCount: rounds?.c ?? 0 });
});

// DELETE /rounds/:id
app.delete("/rounds/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare("SELECT user_id FROM rounds WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "Round not found" });
  if (row.user_id !== req.userId) return res.status(403).json({ error: "Forbidden" });
  db.prepare("DELETE FROM rounds WHERE id = ?").run(id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Birdie API running at http://localhost:${PORT}`);
});

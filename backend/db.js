const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.BIRDIE_DB || path.join(__dirname, "birdie.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    avatar TEXT,
    about_me TEXT,
    fun_fact TEXT,
    favorite_club TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`);

try {
  db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
} catch {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT`);
} catch {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN about_me TEXT`);
} catch {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN fun_fact TEXT`);
} catch {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN favorite_club TEXT`);
} catch {}

db.exec(`

  CREATE TABLE IF NOT EXISTS rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    course TEXT,
    score INTEGER,
    putts INTEGER,
    gir INTEGER,
    gir_total INTEGER DEFAULT 18,
    fairways INTEGER,
    fairways_total INTEGER DEFAULT 14,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_rounds_user ON rounds(user_id);
  CREATE INDEX IF NOT EXISTS idx_rounds_date ON rounds(date);
`);

const adminUsername = process.env.BIRDIE_ADMIN_USERNAME?.trim().toLowerCase();
if (adminUsername) {
  try {
    db.prepare("UPDATE users SET is_admin = 1 WHERE username = ?").run(adminUsername);
  } catch {}
} else {
  try {
    db.prepare("UPDATE users SET is_admin = 1 WHERE id = 1").run();
  } catch {}
}

module.exports = db;

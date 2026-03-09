const db = require("../db.js");
const username = process.argv[2]?.trim()?.toLowerCase();
if (!username) {
  console.log("Usage: node scripts/set-admin.js <username>");
  process.exit(1);
}
const r = db.prepare("UPDATE users SET is_admin = 1 WHERE username = ?").run(username);
if (r.changes) {
  console.log(`✓ ${username} is now an admin`);
} else {
  console.log(`User "${username}" not found`);
  process.exit(1);
}

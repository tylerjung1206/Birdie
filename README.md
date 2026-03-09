# Birdie

Golf stat tracker + analytics desktop app. Log rounds, compare with friends, view courses on a map.

---

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm** — comes with Node.js

---

## For end users (share the app)

**Share with others:** Send the DMG (Mac) or exe (Windows) + this URL:

```
https://birdie-production-ec4b.up.railway.app
```

They install the app, enter the URL in **Server URL** on the login screen, register, and start using it. No backend setup needed.

---

## Mac — Build & Install

### 1. Clone

```bash
git clone https://github.com/tylerjung1206/Birdie.git
cd Birdie
```

### 2. Install dependencies

```bash
npm install
cd backend && npm install && cd ..
```

### 3. Build

```bash
npm run dist:mac
```

### 4. Install

1. Open `release/`
2. Double-click `Birdie-0.1.0.dmg`
3. Drag Birdie to Applications
4. Open Birdie

### 5. Backend (for local use)

```bash
cd backend
npm start
```

Leave running. Default Server URL is `http://localhost:3001`.

---

## Windows — Build & Install

### Option A: Build locally

```bash
git clone https://github.com/tylerjung1206/Birdie.git
cd Birdie
npm install
cd backend && npm install && cd ..
npm run dist:win
```

Then run `Birdie Setup 0.1.0.exe` from `release/`.

### Option B: Pre-built (GitHub Actions)

1. [github.com/tylerjung1206/Birdie](https://github.com/tylerjung1206/Birdie) → **Actions**
2. Latest run → **Artifacts** → download `windows-installer`
3. Unzip and run the `.exe`

### Backend (for local use)

```bash
cd backend
npm start
```

---

## Server URL

- **Local:** Leave default `http://localhost:3001` or leave empty
- **Deployed:** Enter the backend URL (e.g. `https://birdie-production-ec4b.up.railway.app`)
- Enter on the **login screen** before registering or logging in
- `https://` is auto-added if you omit it

---

## Backend

### Local

```bash
cd backend
npm start
```

Runs at `http://localhost:3001`. Uses SQLite (`birdie.db`).

### Deploy to Railway

See **DEPLOY-RAILWAY.md** for full steps. Summary:

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select Birdie repo, set **Root Directory** to `backend`
3. Add variables: `JWT_SECRET`, optionally `BIRDIE_ADMIN_USERNAME`
4. Generate domain, copy URL
5. Share URL with users

### Make yourself admin (deployed backend)

**Option 1 — Setup endpoint**

1. In Railway Variables, add `BIRDIE_SETUP_SECRET` = any secret string
2. Redeploy
3. Run:

```bash
curl -X POST https://birdie-production-ec4b.up.railway.app/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SECRET","username":"YOUR_USERNAME","password":"NEW_PASSWORD"}'
```

4. Log in with the new password. Remove `BIRDIE_SETUP_SECRET` after.

**Option 2 — Env var**

Add `BIRDIE_ADMIN_USERNAME=yourusername` in Railway, redeploy, log out and back in.

**Option 3 — Local script**

```bash
cd backend
node scripts/set-admin.js <username>
```

(Only works for local backend.)

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | `birdie-dev-secret...` | **Required in production** |
| `BIRDIE_DB` | `./birdie.db` | SQLite path |
| `BIRDIE_ADMIN_USERNAME` | — | Auto-promote user to admin on startup |
| `BIRDIE_SETUP_SECRET` | — | Enables `/admin/setup` for one-time admin + password reset |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Cannot connect" / "fetch failed" | Backend not running, or wrong Server URL |
| "Invalid username or password" | Wrong credentials, or account exists on different backend (local vs Railway) |
| "Username already taken" | Account exists; use correct password or register with new username |
| "User not found" (setup) | Username doesn't exist on that backend; register first |

---

## Development

```bash
npm run dev
```

Backend auto-starts in dev if port 3001 is free.

---

## Project structure

```
Birdie/
├── backend/          # Node/Express API (SQLite)
├── electron/         # Electron main process & preload
├── src/              # React UI
├── public/           # Static assets (logo)
├── release/          # Built installers
└── DEPLOY-RAILWAY.md # Railway deployment guide
```

---

## Auto-update

The app does **not** auto-update. Users install new versions manually.

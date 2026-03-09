# Birdie

Golf stat tracker + analytics desktop app. Log rounds, compare with friends, view courses on a map.

---

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm** — comes with Node.js

---

## Mac — Install & Setup

### 1. Clone or download the project

```bash
git clone https://github.com/tylerjung1206/Birdie.git
cd Birdie
```

### 2. Install dependencies

```bash
npm install
cd backend && npm install && cd ..
```

### 3. Build the app

```bash
npm run dist:mac
```

### 4. Install Birdie

1. Open the `release/` folder.
2. Double-click `Birdie-0.1.0.dmg`.
3. Drag Birdie into the Applications folder.
4. Open Birdie from Applications or Spotlight.

### 5. Start the backend (required for login)

In a terminal:

```bash
cd Birdie/backend
npm start
```

Leave this running. The backend listens at `http://localhost:3001`.

### 6. First run in the app

1. Open Birdie.
2. Click **Register** and create an account.
3. Log in and start adding rounds.

---

## Windows — Install & Setup

### Option A: Build on your Windows PC

#### 1. Clone or download the project

```bash
git clone https://github.com/tylerjung1206/Birdie.git
cd Birdie
```

#### 2. Install dependencies

```bash
npm install
cd backend
npm install
cd ..
```

#### 3. Build the installer

```bash
npm run dist:win
```

#### 4. Install Birdie

1. Open the `release/` folder.
2. Run `Birdie Setup 0.1.0.exe`.
3. Follow the installer (choose install location if prompted).
4. Launch Birdie from the Start menu.

#### 5. Start the backend (required for login)

In a separate terminal or Command Prompt:

```bash
cd Birdie\backend
npm start
```

Leave this running.

#### 6. First run in the app

1. Open Birdie.
2. Click **Register** and create an account.
3. Log in and start adding rounds.

---

### Option B: Download pre-built Windows installer (GitHub Actions)

1. Go to [github.com/tylerjung1206/Birdie](https://github.com/tylerjung1206/Birdie).
2. Click **Actions**.
3. Open the latest workflow run (e.g. "Build Windows installer").
4. Scroll to **Artifacts**.
5. Download `windows-installer`.
6. Unzip and run the `.exe` installer.
7. Start the backend separately (see Option A, step 5).

---

## Backend — Required for login & sync

The app needs the backend running to log in, sync rounds, and search players.

### Run locally

```bash
cd backend
npm start
```

- Runs at `http://localhost:3001` by default.
- Uses SQLite (`birdie.db` in the backend folder).

### Environment variables (optional)

| Variable | Default | Description |
|---------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | `birdie-dev-secret...` | **Set in production** for security |
| `BIRDIE_DB` | `./birdie.db` | Path to SQLite file |

Example:

```bash
PORT=3001 JWT_SECRET=your-secret-here node server.js
```

### Deploy for multiple users (Railway, Render, Fly.io, etc.)

1. Deploy the `backend/` folder to your host.
2. Set `JWT_SECRET` and optionally `BIRDIE_DB`.
3. In the app, log in as an admin and go to **Admin**.
4. Enter the backend URL (e.g. `https://your-app.railway.app`).
5. Click **Save** and **Test connection**.

---

## Admin setup

To change the API URL or manage users, you need admin access.

### Make a user admin (local backend)

```bash
cd backend
node scripts/set-admin.js <username>
```

Or set when starting the backend:

```bash
BIRDIE_ADMIN_USERNAME=yourusername npm start
```

### First admin

1. Register a normal account in the app.
2. Run `node scripts/set-admin.js <your-username>` in the backend folder.
3. Log out and log back in — you’ll see the Admin tab.

---

## API URL configuration

- **Default:** `http://localhost:3001` (local backend).
- **Change:** Only admins can change it in **Admin**.
- **Format:** Full base URL, no trailing slash (e.g. `https://api.example.com`).

---

## Troubleshooting

### "Cannot connect to the server" / "fetch failed"

- The backend is not running. Start it with `cd backend && npm start`.
- Or the API URL is wrong — check Admin if using a deployed backend.

### Backend won’t start

- Ensure port 3001 is free.
- On Windows, try `set PORT=3001 && npm start` if needed.

### Course search not working

- Course autocomplete uses OpenStreetMap (Overpass API). An internet connection is required.

---

## Development

```bash
npm run dev
```

- Starts Vite + Electron.
- Backend auto-starts in dev if port 3001 is free.

Or run backend manually:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

---

## Project structure

```
Birdie/
├── backend/          # Node/Express API (SQLite)
├── electron/         # Electron main process & preload
├── src/              # React UI
├── public/           # Static assets (logo, etc.)
└── release/          # Built installers (after npm run dist:mac or dist:win)
```

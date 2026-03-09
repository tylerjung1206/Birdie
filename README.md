# Birdie (desktop app)

Golf stat tracker + analytics app, packaged as a Windows installer (`.exe`) via Electron.

## Run locally (dev)

```bash
npm install
npm run dev
```

## Build production UI bundle

```bash
npm run build
```

## Build Windows installer (.exe)

Electron apps are easiest to package for Windows **on a Windows machine**.

On Windows:

```bash
npm install
npm run dist
```

Your installer will be created in `release/` (NSIS target).

## Data storage

Rounds are stored locally using `electron-store` (a JSON file in the OS app data directory).

Current fields captured per round:
- player
- date, course, score, putts
- gir / girTotal
- fairways / fairwaysTotal
- notes


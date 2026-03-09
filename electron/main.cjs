const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");

const isDev = !app.isPackaged;
let backendProcess = null;

function isPortInUse(port) {
  return new Promise((resolve) => {
    const client = net.createConnection(port, "127.0.0.1", () => {
      client.destroy();
      resolve(true);
    });
    client.on("error", () => resolve(false));
  });
}

function waitForPort(port, ms = 10000) {
  const start = Date.now();
  return new Promise((resolve) => {
    function check() {
      const client = net.createConnection(port, "127.0.0.1", () => {
        client.destroy();
        resolve(true);
      });
      client.on("error", () => {
        if (Date.now() - start > ms) resolve(false);
        else setTimeout(check, 200);
      });
    }
    check();
  });
}

async function ensureBackendRunning() {
  const backendDir = path.join(__dirname, "..", "backend");
  const serverPath = path.join(backendDir, "server.js");
  try {
    require("fs").accessSync(serverPath);
  } catch {
    return;
  }
  if (await isPortInUse(3001)) return;
  const isWin = process.platform === "win32";
  backendProcess = spawn(isWin ? "npm.cmd" : "npm", ["run", "start"], {
    cwd: backendDir,
    env: { ...process.env, PORT: "3001" },
    stdio: "ignore",
    shell: true
  });
  backendProcess.on("error", () => {});
  await waitForPort(3001);
}

let store;
let configStore;

async function initStore() {
  if (store) return store;
  const mod = await import("electron-store");
  const Store = mod.default;
  store = new Store({
    name: "golf-data",
    defaults: { rounds: [] }
  });
  return store;
}

async function initConfig() {
  if (configStore) return configStore;
  const mod = await import("electron-store");
  const Store = mod.default;
  configStore = new Store({
    name: "birdie-config",
    defaults: {
      apiUrl: "http://localhost:3001",
      token: null,
      user: null
    }
  });
  return configStore;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    backgroundColor: "#0b1f14",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(async () => {
  const s = await initStore();
  const cfg = await initConfig();
  if (isDev) {
    await ensureBackendRunning();
  }

  ipcMain.handle("config:get", () => ({
    apiUrl: cfg.get("apiUrl"),
    token: cfg.get("token"),
    user: cfg.get("user")
  }));

  ipcMain.handle("config:set", (_evt, { apiUrl, token, user }) => {
    if (apiUrl !== undefined) cfg.set("apiUrl", apiUrl);
    if (token !== undefined) cfg.set("token", token);
    if (user !== undefined) cfg.set("user", user);
  });

  ipcMain.handle("config:logout", () => {
    cfg.set("token", null);
    cfg.set("user", null);
  });

  ipcMain.handle("api:request", async (_evt, { method, path, body, token }) => {
    const base = cfg.get("apiUrl") || "http://localhost:3001";
    const url = `${base.replace(/\/$/, "")}${path}`;
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const err = new Error(data?.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  });

  ipcMain.handle("rounds:list", () => s.get("rounds"));
  ipcMain.handle("rounds:add", (_evt, round) => {
    const rounds = s.get("rounds");
    const next = [
      ...rounds,
      { id: cryptoRandomId(), createdAt: new Date().toISOString(), ...round }
    ];
    s.set("rounds", next);
    return next;
  });
  ipcMain.handle("rounds:delete", (_evt, id) => {
    const rounds = s.get("rounds");
    const next = rounds.filter((r) => r.id !== id);
    s.set("rounds", next);
    return next;
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (process.platform !== "darwin") app.quit();
});

function cryptoRandomId() {
  // avoid importing extra deps; sufficient for local IDs
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}


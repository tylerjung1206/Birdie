const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

let store;

async function initStore() {
  if (store) return store;
  const mod = await import("electron-store");
  const Store = mod.default;
  store = new Store({
    name: "golf-data",
    defaults: {
      rounds: []
    }
  });
  return store;
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
  ipcMain.handle("rounds:list", () => {
    return s.get("rounds");
  });

  ipcMain.handle("rounds:add", (_evt, round) => {
    const rounds = s.get("rounds");
    const next = [
      ...rounds,
      {
        id: cryptoRandomId(),
        createdAt: new Date().toISOString(),
        ...round
      }
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
  if (process.platform !== "darwin") app.quit();
});

function cryptoRandomId() {
  // avoid importing extra deps; sufficient for local IDs
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}


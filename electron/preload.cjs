const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("golfAPI", {
  listRounds: () => ipcRenderer.invoke("rounds:list"),
  addRound: (round) => ipcRenderer.invoke("rounds:add", round),
  deleteRound: (id) => ipcRenderer.invoke("rounds:delete", id)
});

contextBridge.exposeInMainWorld("birdieConfig", {
  get: () => ipcRenderer.invoke("config:get"),
  set: (opts) => ipcRenderer.invoke("config:set", opts),
  logout: () => ipcRenderer.invoke("config:logout")
});

contextBridge.exposeInMainWorld("birdieAPI", {
  request: (opts) => ipcRenderer.invoke("api:request", opts)
});


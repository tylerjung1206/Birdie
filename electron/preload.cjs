const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("golfAPI", {
  listRounds: () => ipcRenderer.invoke("rounds:list"),
  addRound: (round) => ipcRenderer.invoke("rounds:add", round),
  deleteRound: (id) => ipcRenderer.invoke("rounds:delete", id)
});


const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronInfo", {
  isElectron: true,
});

contextBridge.exposeInMainWorld("claudeApi", {
  call: (systemPrompt, userMessage) =>
    ipcRenderer.invoke("claude:call", { systemPrompt, userMessage }),
});

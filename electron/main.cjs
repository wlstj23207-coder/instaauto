const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

ipcMain.handle("claude:call", async (_event, payload = {}) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 필요합니다.");
  }

  const { systemPrompt, userMessage } = payload;
  if (!systemPrompt || !userMessage) {
    throw new Error("systemPrompt와 userMessage가 필요합니다.");
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Anthropic API 호출 실패");
  }

  return data?.content?.[0]?.text || "";
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

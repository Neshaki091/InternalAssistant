require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initStorage } = require("./src/storage");
const chatRouter = require("./src/routes/chat");
const ingestRouter = require("./src/routes/ingest");
const logsRouter = require("./src/routes/logs");
const voiceRouter = require("./src/routes/voice");

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───
app.use(cors());
app.use(express.json());

// Serve Widget SDK (agent.js, etc.)
const noCache = { 
    etag: false, 
    lastModified: false, 
    setHeaders: (res) => res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate") 
};
app.use("/sdk", express.static(path.join(__dirname, "sdk"), noCache));

// ─── Assistant API Routes ───
app.use("/api/chat", chatRouter);
app.use("/api/ingest", ingestRouter); // Backend for loading client policies
app.use("/api/voice", voiceRouter);   // Voice to Voice engine

app.get("/", (_req, res) => {
    res.json({ message: "InternalAssistant Backend is running.", sdk: "/sdk/agent.js" });
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
    console.error("[Assistant Engine Error]", err);
    res.status(500).json({ error: "Lỗi động cơ Trợ lý", details: err.message });
});

// ─── Start Assistant Engine ───
(async function start() {
  try {
    await initStorage();
    app.listen(PORT, () => {
      console.log("");
      console.log("⚡ InternalAssistant Backend Engine ⚡");
      console.log("-----------------------------------------");
      console.log("   SDK Embed: http://localhost:" + PORT + "/sdk/agent.js");
      console.log("   API Chat:  http://localhost:" + PORT + "/api/chat");
      console.log("   API Ingest: http://localhost:" + PORT + "/api/ingest");
      console.log("-----------------------------------------");
      console.log("Assistant is ready to be embedded. Ready for Hackathon!");
      console.log("");
    });
  } catch (e) {
    console.error("Failed to start Assistant:", e);
  }
})();

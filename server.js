require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initStorage } = require("./src/storage");
const chatRouter = require("./src/routes/chat");
const ingestRouter = require("./src/routes/ingest");
const logsRouter = require("./src/routes/logs");

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───
app.use(cors());
app.use(express.json());

// Serve Static Folders
app.use("/sdk", express.static(path.join(__dirname, "sdk")));
app.use("/example", express.static(path.join(__dirname, "example")));
app.use("/portal", express.static(path.join(__dirname, "portal")));

app.get("/dashboard", (_req, res) => {
    res.sendFile(path.join(__dirname, "portal", "index.html"));
});

app.get("/", (_req, res) => {
    res.redirect("/dashboard");
});

app.get("/portal", (_req, res) => {
    res.redirect("/dashboard");
});

app.use("/api/chat", chatRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/logs", logsRouter);

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
    console.error("[Server Error]", err);
    res.status(500).json({ error: "Lỗi hệ thống", details: err.message });
});

// ─── Start ───
(async function start() {
  try {
    await initStorage();
    app.listen(PORT, () => {
      console.log("");
      console.log("🤖 InternalAssistant SaaS running 🤖");
      console.log("   --- API ---");
      console.log("   Health:   http://localhost:" + PORT + "/api/health");
      console.log("   --- SDK & PORTAL ---");
      console.log("   Dashboard: http://localhost:" + PORT + "/dashboard");
      console.log("   Example:  http://localhost:" + PORT + "/example (Widget test)");
      console.log("   SDK:      http://localhost:" + PORT + "/sdk/agent.js");
      console.log("");
    });
  } catch (e) {
    console.error("Failed to start server:", e);
  }
})();

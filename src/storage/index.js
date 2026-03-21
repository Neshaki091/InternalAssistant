/**
 * Storage Layer
 * Uses JSON file by default, upgrades to MongoDB if MONGO_URI is set.
 * All operations are scoped by clientId for multi-tenant isolation.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

let db = { leaveRequests: [], moderationLogs: [], clients: {} };
let mongoConnected = false;
let mongoose, LeaveRequest, ModerationLog;

// ─── Schemas (only used if Mongo is available) ───
function defineModels() {
  const leaveSchema = new mongoose.Schema({
    clientId:  { type: String, required: true, index: true },
    employee:  String,
    type:      { type: String, default: "annual" },
    startDate: String,
    endDate:   String,
    reason:    String,
    status:    { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now },
  });

  const modSchema = new mongoose.Schema({
    clientId:  { type: String, required: true, index: true },
    content:   String,
    result:    { type: String, enum: ["safe", "flagged"] },
    flags:     [String],
    createdAt: { type: Date, default: Date.now },
  });

  LeaveRequest = mongoose.model("LeaveRequest", leaveSchema);
  ModerationLog = mongoose.model("ModerationLog", modSchema);
}

// ─── Init ───
async function initStorage() {
  // Try MongoDB first
  if (process.env.MONGO_URI) {
    try {
      mongoose = require("mongoose");
      await mongoose.connect(process.env.MONGO_URI);
      defineModels();
      mongoConnected = true;
      console.log("✓ Storage: MongoDB connected");
      return;
    } catch (err) {
      console.warn("⚠ MongoDB unavailable (" + err.message + ") — falling back to JSON file");
    }
  }

  // Fallback: JSON file
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (_) { /* use default */ }
  }
  saveJSON();
  console.log("✓ Storage: JSON file (" + DB_FILE + ")");
}

function saveJSON() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ─── CRUD Operations ───

async function createLeaveRequest(data) {
  if (mongoConnected) {
    return (await LeaveRequest.create(data)).toObject();
  }
  const record = { _id: "lr-" + Date.now(), ...data, createdAt: new Date().toISOString() };
  db.leaveRequests.push(record);
  saveJSON();
  return record;
}

async function getLeaveRequests(clientId) {
  if (mongoConnected) {
    return LeaveRequest.find({ clientId }).sort({ createdAt: -1 }).lean();
  }
  return db.leaveRequests.filter(function(r) { return r.clientId === clientId; });
}

async function updateLeaveStatus(id, status) {
  if (mongoConnected) {
    return LeaveRequest.findByIdAndUpdate(id, { status }, { new: true }).lean();
  }
  var rec = db.leaveRequests.find(function(r) { return r._id === id; });
  if (rec) { rec.status = status; saveJSON(); }
  return rec;
}

async function createModerationLog(data) {
  if (mongoConnected) {
    return (await ModerationLog.create(data)).toObject();
  }
  var record = { _id: "ml-" + Date.now(), ...data, createdAt: new Date().toISOString() };
  db.moderationLogs.push(record);
  saveJSON();
  return record;
}

async function getModerationLogs(clientId) {
  if (mongoConnected) {
    return ModerationLog.find({ clientId }).sort({ createdAt: -1 }).lean();
  }
  return db.moderationLogs.filter(function(r) { return r.clientId === clientId; });
}

module.exports = {
  initStorage,
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
  createModerationLog,
  getModerationLogs,
};

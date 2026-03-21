var express = require("express");
var { clientMiddleware } = require("../clients");
var storage = require("../storage");

var router = express.Router();

/**
 * GET /api/logs
 * Fetches leave requests and moderation logs for the client.
 */
router.get("/", clientMiddleware, async function(req, res) {
  try {
    const clientId = req.clientId;
    
    const [leaveRequests, moderationLogs] = await Promise.all([
      storage.getLeaveRequests(clientId),
      storage.getModerationLogs(clientId)
    ]);

    res.json({
      success: true,
      data: {
        leaveRequests,
        moderationLogs
      }
    });
  } catch (err) {
    console.error("[/api/logs] Error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;

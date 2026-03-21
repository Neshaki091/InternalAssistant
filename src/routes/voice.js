const express = require("express");
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require("agora-token");

/**
 * Generate Agora Rtc Token
 * GET /api/voice/token?channelName=...&uid=...
 */
router.get("/token", (req, res) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channelName = req.query.channelName || "internal-assistant";
    const uid = parseInt(req.query.uid) || 0;
    const role = RtcRole.PUBLISHER;

    if (!appId || !appCertificate) {
        return res.status(500).json({ error: "AGORA_APP_ID or AGORA_APP_CERTIFICATE missing in .env" });
    }

    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs
    );

    res.json({ token, appId, channelName, uid });
});

module.exports = router;

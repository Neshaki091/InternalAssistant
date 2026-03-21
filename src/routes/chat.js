/**
 * POST /api/chat
 *
 * Multi-turn flow with Bilingual Support (EN/VI)
 */
var express = require("express");
var { clientMiddleware } = require("../clients");
var { parseIntent } = require("../intentParser");
var { runWorkflow } = require("../workflowEngine");
var session = require("../sessionManager");
var n8n = require("../n8nService");
var { detectLang, T } = require("../language");

var router = express.Router();

router.post("/", clientMiddleware, async function(req, res) {
  try {
    var message = req.body.message;
    var sessionId = req.body.sessionId || "default";

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Missing 'message'" });
    }

    message = message.trim();
    var clientId = req.clientId;
    var lang = detectLang(message);
    var strings = T[lang];

    // ─── Step 1: Check if session is waiting for confirmation ───
    if (session.isWaitingConfirmation(sessionId)) {
      var sess = session.getSession(sessionId);
      var currentLang = sess.lang || lang; // Use session lang if available
      var strings = T[currentLang];
      var action = session.parseConfirmation(message);

      if (action === "create_leave" || action === "tao_don_nghi") {
        var data = session.getSession(sessionId).pendingData;
        data.spreadsheetId = req.clientConfig.spreadsheetId;
        data.status = "Approve";
        session.clearSession(sessionId);

        var result = await n8n.createLeaveRequest(data, currentLang);
        if (result.success) {
          return res.json({
            output: strings.confirm_approved,
            intent: "confirmation",
            data: result.data,
          });
        } else {
          return res.json({
            output: (currentLang === "vi" ? "⚠️ Không thể gửi đơn: " : "⚠️ Failed to send: ") + (result.error || "Unknown error"),
            intent: "error",
          });
        }
      }

      if (action === "create_email" || action === "soan_email") {
        var data2 = session.getSession(sessionId).pendingData;
        data2.spreadsheetId = req.clientConfig.spreadsheetId;
        data2.status = data2.isViolation ? "Pending" : "Approve";
        session.clearSession(sessionId);

        var result2 = await n8n.createEmail(data2, currentLang);
        if (result2.success) {
          let emailContent = result2.emailContent || "";
          if (!emailContent) {
            emailContent = `Dear Management,\n\nMy name is ${data2.employee}, requesting leave from ${data2.startDate} to ${data2.endDate}.\nReason: ${data2.reason}\n\nBest regards,\n${data2.employee}`;
          }

          let subject = encodeURIComponent((currentLang === "vi" ? "Đơn xin nghỉ phép - " : "Leave Request - ") + data2.employee);
          let body = encodeURIComponent(emailContent);
          let targetEmail = req.clientConfig.companyEmail || "";
          let gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}&su=${subject}&body=${body}`;

          return res.json({
            output: strings.confirm_email_success.replace("{link}", gmailLink),
            intent: "confirmation",
            data: result2.data,
          });
        } else {
          return res.json({
            output: (currentLang === "vi" ? "⚠️ Không thể tạo email: " : "⚠️ Failed to draft: ") + (result2.error || "Unknown error"),
            intent: "error",
          });
        }
      }

      if (action === "cancel" || action === "huy_bo") {
        session.clearSession(sessionId);
        return res.json({
          output: currentLang === "vi" ? "Đã hủy. Bạn cần hỗ trợ gì khác không? 😊" : "Cancelled. How else can I help? 😊",
          intent: "cancel",
        });
      }

      // Re-ask
      return res.json({
        output: lang === "vi" ? "Vui lòng chọn một hành động bên dưới, hoặc gõ \"không\" để hủy." : "Please choose an action below, or type \"no\" to cancel.",
        intent: "waiting",
        actions: [
          { label: strings.btn_create_leave.replace("{rem}", ""), value: "create_leave" },
          { label: strings.btn_create_email, value: "create_email" },
          { label: strings.btn_cancel, value: "cancel" },
        ],
      });
    }

    // ─── Step 2: Intent Analysis ───
    var parsed = await n8n.analyzeContext(message, clientId);
    if (!parsed || !parsed.intent) {
      parsed = await parseIntent(message);
    }

    var result3 = await runWorkflow(parsed.intent, parsed.entities, clientId, sessionId, message);

    return res.json({
      output: result3.output,
      intent: parsed.intent,
      confidence: parsed.confidence,
      actions: result3.actions || null,
      data: result3.data || null,
    });
  } catch (err) {
    console.error("[/api/chat]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

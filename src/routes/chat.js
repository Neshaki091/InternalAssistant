/**
 * POST /api/chat
 *
 * Multi-turn flow:
 *   1. Check session — if waiting_confirmation, handle confirm/cancel
 *   2. Otherwise, parse intent → run workflow
 *
 * Body: { clientId, message, sessionId }
 * Response: { output, intent, actions?, data? }
 */
var express = require("express");
var { clientMiddleware } = require("../clients");
var { parseIntent } = require("../intentParser");
var { runWorkflow } = require("../workflowEngine");
var session = require("../sessionManager");
var n8n = require("../n8nService");

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

    // ─── Step 1: Check if session is waiting for confirmation ───
    if (session.isWaitingConfirmation(sessionId)) {
      var action = session.parseConfirmation(message);

      if (action === "create_leave") {
        var data = session.getSession(sessionId).pendingData;
        data.spreadsheetId = req.clientConfig.spreadsheetId; // Inject from config
        session.clearSession(sessionId);

        var result = await n8n.createLeaveRequest(data);
        if (result.success) {
          return res.json({
            output: "✅ **Đã gửi đơn xin nghỉ thành công!**\n\n" +
              "Đơn của bạn đã được gửi qua hệ thống n8n đến quản lý.\n" +
              "Bạn sẽ nhận thông báo khi đơn được phê duyệt.",
            intent: "confirmation",
            data: result.data,
          });
        } else {
          return res.json({
            output: "⚠️ Không thể gửi đơn lúc này: " + (result.error || "Lỗi không xác định") + "\nVui lòng thử lại sau.",
            intent: "error",
          });
        }
      }

      if (action === "create_email") {
        var data2 = session.getSession(sessionId).pendingData;
        data2.spreadsheetId = req.clientConfig.spreadsheetId; // Inject from config
        session.clearSession(sessionId);

        var result2 = await n8n.createEmail(data2);
        if (result2.success) {
          // Extract the generated email content from n8n (usually in .text, .output, or first item's text)
          let emailContent = "";
          if (result2.data && typeof result2.data === "string") emailContent = result2.data;
          else if (result2.data && result2.data.text) emailContent = result2.data.text;
          else if (result2.data && result2.data.output) emailContent = result2.data.output;
          else if (Array.isArray(result2.data) && result2.data[0]) emailContent = result2.data[0].text || result2.data[0].output || JSON.stringify(result2.data[0]);
          
          // Fallback content if n8n doesn't return the text
          if (!emailContent) {
            emailContent = `Kính gửi Quản lý,\n\nTôi tên là ${data2.employee}, xin phép được nghỉ phép từ ngày ${data2.startDate} đến ngày ${data2.endDate}.\nLý do: ${data2.reason}\n\nRất mong được xem xét và phê duyệt.\n\nTrân trọng,\n${data2.employee}`;
          }

          // Build Gmail compose URL
          let subject = encodeURIComponent(`Đơn xin nghỉ phép - ${data2.employee}`);
          let body = encodeURIComponent(emailContent);
          let targetEmail = req.clientConfig.companyEmail || "";
          let gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}&su=${subject}&body=${body}`;

          return res.json({
            output: "✅ **Đã soạn email thành công!**\n\nNội dung email đã được AI tự động viết dựa trên yêu cầu của bạn.\n\n👉 **[Bấm vào đây để mở Gmail và Gửi ngay]("+gmailLink+")**",
            intent: "confirmation",
            data: result2.data,
          });
        } else {
          return res.json({
            output: "⚠️ Không thể tạo email lúc này: " + (result2.error || "Lỗi không xác định") + "\nVui lòng thử lại sau.",
            intent: "error",
          });
        }
      }

      if (action === "cancel") {
        session.clearSession(sessionId);
        return res.json({
          output: "Đã hủy. Bạn cần hỗ trợ gì khác không? 😊",
          intent: "cancel",
        });
      }

      // User said something else while waiting — re-ask
      return res.json({
        output: "Vui lòng chọn một hành động bên dưới, hoặc gõ \"không\" để hủy.",
        intent: "waiting",
        actions: [
          { label: "📄 Tạo đơn nghỉ", value: "create_leave" },
          { label: "✉️ Tạo email", value: "create_email" },
          { label: "❌ Không, cảm ơn", value: "cancel" },
        ],
      });
    }

    // ─── Step 2: Parse intent & run workflow ───
    var parsed = await parseIntent(message);

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

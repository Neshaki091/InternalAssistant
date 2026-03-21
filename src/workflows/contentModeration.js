/**
 * Content Moderation Workflow
 * Flow: auto-check → flag/safe → log → (human fallback if flagged)
 */
var storage = require("../storage");

var BLOCKED = [
  "spam", "scam", "abuse", "hack", "phishing", "malware",
  "inappropriate", "offensive", "hate speech", "violence",
  "lừa đảo", "bạo lực", "xúc phạm", "thù ghét",
  "nội dung xấu", "quấy rối", "đe dọa",
];

async function contentModerationWorkflow(entities, clientId) {
  var content = entities.content || "";
  var lower = content.toLowerCase();

  // Auto-check
  var flags = BLOCKED.filter(function(word) { return lower.includes(word); });
  var result = flags.length > 0 ? "flagged" : "safe";

  // Log
  var log = await storage.createModerationLog({
    clientId: clientId,
    content: content,
    result: result,
    flags: flags,
  });

  // Trigger n8n for further processing (AI classify / Log to Sheets)
  var n8n = require("../n8nService");
  try {
    var { CLIENTS } = require("../clients");
    var clientConfig = CLIENTS[clientId] || {};

    await fetch(process.env.N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_content",
        clientId: clientId,
        spreadsheetId: clientConfig.spreadsheetId || "",
        content: content,
        autoResult: result,
        flags: flags
      })
    });
  } catch (e) {
    console.warn("[Moderation] n8n trigger failed:", e.message);
  }

  if (result === "flagged") {
    var flagList = flags.map(function(f) { return "`" + f + "`"; }).join(", ");
    return {
      output: [
        "🚩 **Nội dung bị đánh dấu không phù hợp**",
        "",
        "⚠️ Vi phạm phát hiện: " + flagList,
        "",
        "📝 Nội dung đã được ghi log (ID: " + log._id + ")",
        "👤 Đã chuyển đến bộ phận kiểm duyệt thủ công để xem xét.",
      ].join("\n"),
      data: log,
      actions: [
        { label: "✉️ Khiếu nại (Gửi Email)", value: "create_email" },
        { label: "❌ Đóng", value: "cancel" }
      ]
    };
  }

  return {
    output: [
      "✅ **Nội dung an toàn**",
      "",
      "Không phát hiện vi phạm. Nội dung đã được phê duyệt tự động.",
      "📝 Log ID: " + log._id,
    ].join("\n"),
    data: log,
  };
}

module.exports = contentModerationWorkflow;

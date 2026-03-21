var { queryRAG } = require("../ragService");
var session = require("../sessionManager");
var storage = require("../storage");
var n8n = require("../n8nService");
var { CLIENTS } = require("../clients");

async function leaveRequestWorkflow(entities, clientId, sessionId, message) {
  // Build RAG query from user's leave context
  var queryParts = ["quy định nghỉ phép"];
  if (entities.type === "sick") queryParts.push("nghỉ ốm");
  if (entities.type === "personal") queryParts.push("nghỉ việc riêng");
  if (entities.reason) queryParts.push(entities.reason);
  var ragQuery = queryParts.join(" ");

  // Call RAG: search policy + OpenAI summarize (filtered by clientId)
  var policySummary;
  try {
    policySummary = await queryRAG(ragQuery, clientId);
  } catch (err) {
    console.error("[LeaveWorkflow] RAG error:", err.message);
    policySummary = "Không thể truy xuất quy định lúc này. Vui lòng thử lại.";
  }

  // Save leave data to session for later confirmation
  var leaveData = {
    clientId: clientId,
    employee: entities.employee || "Nhân viên",
    type: entities.type || "annual",
    startDate: entities.startDate || entities.start_date || "Chưa xác định",
    endDate: entities.endDate || entities.end_date || "Chưa xác định",
    reason: entities.reason || "",
  };

  if (sessionId) {
    session.setWaitingConfirmation(sessionId, leaveData);
  }

  // Also save to storage
  await storage.createLeaveRequest(Object.assign({}, leaveData, { status: "draft" }));

  // --- Auto Policy Enforcement ---
  var config = CLIENTS[clientId] || {};
  var spreadsheetId = config.spreadsheetId || "";
  
  // Real-time API check via n8n webhook
  var balanceRes = await n8n.checkLeaveBalance(spreadsheetId, leaveData.employee);
  var usedDays = balanceRes.usedDays || 0;

  // Calculate days if dates are present
  var totalDays = 0;
  function parseDateString(dateStr) {
    if (!dateStr || String(dateStr).includes("Chưa xác định")) return null;
    var parts = dateStr.split("/");
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return null;
  }

  var startD = parseDateString(leaveData.startDate);
  var endD = parseDateString(leaveData.endDate);
  
  if (startD && endD && endD >= startD) {
    var diffTime = endD.getTime() - startD.getTime();
    totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  }

  var actionButtons = [];
  var policyWarning = "";
  var totalRequested = usedDays + totalDays;

  if (totalRequested > 12) {
    // Policy Violation: Exceeded annual quota
    policyWarning = "\n🚨 **CẢNH BÁO QUỸ PHÉP NĂM:**\nAPI Hệ thống ghi nhận bạn đã sử dụng **" + usedDays + " ngày** phép. Nếu duyệt thêm **" + totalDays + " ngày** này, tổng số sẽ là **" + totalRequested + "/12 ngày** (Vượt hạn mức quy định). Hệ thống từ chối tạo đơn nghỉ phép có lương tự động.";
    actionButtons = [
      { label: "✉️ Xin nghỉ Không Lương (Gửi Email)", value: "create_email" },
      { label: "❌ Hủy đơn", value: "cancel" },
    ];
  } else if (totalDays > 5) {
    // Policy Violation: Block standard creation for > 5 days contiguous
    policyWarning = "\n⚠️ **CẢNH BÁO QUY TRÌNH BAO GỒM:**\nBạn đang xin nghỉ **" + totalDays + " ngày** liên tục, vượt hạn mức liền kề. Phải có sự phê duyệt trực tiếp bằng Email từ Giám đốc. Hệ thống tự động khóa tính năng nộp đơn nhanh.";
    actionButtons = [
      { label: "✉️ Soạn Email gửi Giám đốc", value: "create_email" },
      { label: "❌ Hủy đơn", value: "cancel" },
    ];
  } else {
    // Normal flow
    actionButtons = [
      { label: "📄 Tạo đơn nghỉ (Quỹ còn lại: " + (12 - totalRequested) + ")", value: "create_leave" },
      { label: "✉️ Tạo email", value: "create_email" },
      { label: "❌ Không, cảm ơn", value: "cancel" },
    ];
  }

  // Return policy summary + action buttons
  return {
    output: [
      "📋 **Thông tin quy định nghỉ phép:**",
      "",
      policySummary,
      "",
      "---",
      "",
      "📝 **Thông tin đơn của bạn:**",
      "• Mã Data: `Fetch Data từ ID: " + spreadsheetId.substring(0,8) + "...`",
      "• Đã nghỉ: **" + usedDays + " ngày**",
      "• Từ ngày: " + leaveData.startDate,
      "• Đến ngày: " + leaveData.endDate,
      totalDays > 0 ? "• Xin nghỉ thêm: **" + totalDays + " ngày**" : "",
      leaveData.reason ? "• Lý do: " + leaveData.reason : "",
      policyWarning,
      "",
      "**Bạn muốn hệ thống xử lý tiếp như thế nào?**",
    ].filter(Boolean).join("\n"),
    actions: actionButtons,
    data: leaveData,
  };
}

module.exports = leaveRequestWorkflow;

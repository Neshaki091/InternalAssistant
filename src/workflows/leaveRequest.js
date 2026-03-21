var { queryRAG } = require("../ragService");
var session = require("../sessionManager");
var n8n = require("../n8nService");
var { CLIENTS } = require("../clients");
var { T } = require("../language");

async function leaveRequestWorkflow(entities, clientId, sessionId, message, lang) {
  var strings = T[lang || "vi"];
  
  // Build RAG query from user's leave context
  var queryParts = ["quy định nghỉ phép"];
  if (entities.type === "sick") queryParts.push("nghỉ ốm");
  if (entities.type === "personal") queryParts.push("nghỉ việc riêng");
  if (entities.reason) queryParts.push(entities.reason);
  var ragQuery = queryParts.join(" ");

  // Call RAG: search policy + AI summarize
  var policySummary = "";
  var isDirect = (entities.is_direct_action === true || entities.is_direct_action === "true");

  if (isDirect) {
    console.log("[LeaveWorkflow] Direct action detected, skipping detailed RAG summary.");
    policySummary = lang === "vi" ? "✅ **Xác nhận yêu cầu nghỉ phép của bạn:**" : "✅ **Confirming your leave request:**";
  } else {
    try {
      policySummary = await queryRAG(ragQuery, clientId, lang);
    } catch (err) {
      console.error("[LeaveWorkflow] RAG error:", err.message);
      policySummary = strings.leave_policy_title;
    }
  }

  // Safety: Extract name from message if entity is default/missing
  var employeeName = entities.employee;
  if (!employeeName || employeeName === "Nhân viên" || employeeName === "Employee") {
     var nameMatch = message.match(/(?:tên(?: là)?|nhân viên|my name is|i am)\s+([a-zà-ỹ\s]{3,40})/i);
     if (nameMatch) employeeName = nameMatch[1].trim().split(/\s*(?:id|mã|số|xin|nghỉ|từ|đến|ngày|vì|for|request|from|at|$)/i)[0].trim();
  }

  // Safety: Extract reason if missing
  var leaveReason = entities.reason;
  if (!leaveReason) {
     var rMatch = message.match(/(?:vì lý do|lý do là|do|lý do:|for|reason:)\s+([^,.\n?!|]+)/i);
     if (rMatch) leaveReason = rMatch[1].trim();
  }

  // Save leave data to session for later confirmation
  var leaveData = {
    clientId: clientId,
    employee: employeeName || (lang === "vi" ? "Nhân viên" : "Employee"),
    employeeId: entities.employeeId || null,
    type: entities.type || "annual",
    startDate: entities.startDate || entities.start_date || (lang === "vi" ? "Chưa xác định" : "Not specified"),
    endDate: entities.endDate || entities.end_date || (lang === "vi" ? "Chưa xác định" : "Not specified"),
    reason: leaveReason || "",
    query: entities.query || message || ""
  };

  var config = CLIENTS[clientId] || {};
  var spreadsheetId = config.spreadsheetId || "";
  
  // Real-time API check
  var balanceRes = await n8n.checkLeaveBalance(spreadsheetId, leaveData.employee, leaveData.employeeId);
  var usedDays = balanceRes.usedDays || 0;

  // Calculate days
  function parseDateString(dateStr) {
    if (!dateStr || String(dateStr).includes("Chưa xác định") || String(dateStr).includes("Not specified")) return null;
    var parts = dateStr.split("/");
    if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
    return null;
  }

  var startD = parseDateString(leaveData.startDate);
  var endD = parseDateString(leaveData.endDate);
  var totalDays = 0;
  if (startD && endD && endD >= startD) {
    var diffTime = endD.getTime() - startD.getTime();
    totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  var totalRequested = usedDays + totalDays;
  var isViolation = (totalRequested > 12 || totalDays > 5);
  leaveData.days = totalDays;
  leaveData.usedDays = usedDays;
  leaveData.isViolation = isViolation;

  // Build the output parts
  var lines = [
    strings.leave_policy_title,
    "",
    policySummary,
  ];

  if (isDirect) {
    if (sessionId) session.setWaitingConfirmation(sessionId, leaveData, lang);
    
    var actionButtons = [];
    var policyWarning = "";

    if (totalRequested > 12) {
      policyWarning = strings.leave_quota_warning
        .replace("{used}", usedDays).replace("{requested}", totalDays).replace("{total}", totalRequested);
      actionButtons = [
        { label: strings.btn_create_email, value: strings.val_create_email },
        { label: strings.btn_cancel, value: strings.val_cancel },
      ];
    } else if (totalDays > 5) {
      policyWarning = strings.leave_contiguous_warning.replace("{days}", totalDays);
      actionButtons = [
        { label: strings.btn_email_gm, value: strings.val_create_email },
        { label: strings.btn_cancel, value: strings.val_cancel },
      ];
    } else {
      var rem = 12 - totalRequested;
      actionButtons = [
        { label: strings.btn_create_leave.replace("{rem}", rem), value: strings.val_create_leave },
        { label: strings.btn_create_email, value: strings.val_create_email },
        { label: strings.btn_cancel, value: strings.val_cancel },
      ];
    }

    lines.push(
      "",
      "---",
      "",
      strings.leave_request_title,
      strings.leave_data_id + (spreadsheetId.substring(0,8) || "Demo") + "...`",
      strings.leave_used.replace("{days}", usedDays),
      strings.leave_start + leaveData.startDate,
      strings.leave_end + leaveData.endDate,
      totalDays > 0 ? strings.leave_requested.replace("{days}", totalDays) : "",
      leaveData.reason ? strings.leave_reason + leaveData.reason : "",
      policyWarning,
      "",
      strings.leave_next
    );

    return {
      output: lines.filter(val => val !== undefined && val !== null).join("\n"),
      actions: actionButtons,
      data: leaveData,
    };
  }

  return {
    output: lines.filter(val => val !== undefined && val !== null).join("\n"),
    actions: isDirect ? actionButtons : [
      { label: lang === "vi" ? "📄 Tôi muốn xin nghỉ" : "📄 I want to request leave", value: message + " (direct_request)" }
    ],
    data: leaveData,
  };
}

module.exports = leaveRequestWorkflow;

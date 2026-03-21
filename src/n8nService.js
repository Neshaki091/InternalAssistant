/**
 * n8n Service — call n8n webhooks to execute actions.
 */

var N8N_WEBHOOK = process.env.N8N_WEBHOOK || "https://neshaki.app.n8n.cloud/webhook-test/ai-agent";

/**
 * Call n8n to create a leave request
 */
async function createLeaveRequest(data) {
  console.log("[n8n] Creating leave request...", data);
  var res = await fetch(N8N_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_leave",
      employee: data.employee || "Nhân viên",
      type: data.type || "annual",
      startDate: data.startDate || "Chưa xác định",
      endDate: data.endDate || "Chưa xác định",
      reason: data.reason || "",
      clientId: data.clientId || "",
      spreadsheetId: data.spreadsheetId || "",
    }),
  });

  if (!res.ok) {
    var errText = await res.text();
    console.error("[n8n] Leave request error:", res.status, errText);
    return { success: false, error: errText };
  }

  var result = await res.json().catch(function() { return { success: true }; });
  console.log("[n8n] Leave request result:", result);
  return { success: true, data: result };
}

/**
 * Call n8n to draft an email for leave request
 */
async function createEmail(data) {
  console.log("[n8n] Creating email...", data);
  var res = await fetch(N8N_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_email",
      employee: data.employee || "Nhân viên",
      type: data.type || "annual",
      startDate: data.startDate || "Chưa xác định",
      endDate: data.endDate || "Chưa xác định",
      reason: data.reason || "",
      clientId: data.clientId || "",
      spreadsheetId: data.spreadsheetId || "",
      chatInput: `Hãy viết một email xin phép nghỉ cho ${data.employee || "Nhân viên"} từ ngày ${data.startDate} đến ngày ${data.endDate}. Lý do: ${data.reason}`,
      body: {
        chatInput: `Hãy viết một email xin phép nghỉ cho ${data.employee || "Nhân viên"} từ ngày ${data.startDate} đến ngày ${data.endDate}. Lý do: ${data.reason}`
      }
    }),
  });

  if (!res.ok) {
    var errText = await res.text();
    console.error("[n8n] Email error:", res.status, errText);
    return { success: false, error: errText };
  }

  var result = await res.json().catch(function() { return { success: true }; });
  console.log("[n8n] Email result:", result);
  return { success: true, data: result };
}

var N8N_WEBHOOK_CHECK_LEAVE = process.env.N8N_WEBHOOK_CHECK_LEAVE || "https://neshaki.app.n8n.cloud/webhook-test/check-leave";

/**
 * Call n8n to get total leave days already taken by employee
 */
async function checkLeaveBalance(spreadsheetId, employee) {
  console.log(`[n8n] Checking leave balance for ${employee}...`);
  try {
    var url = new URL(N8N_WEBHOOK_CHECK_LEAVE);
    url.searchParams.append("spreadsheetId", spreadsheetId || "");
    url.searchParams.append("employee", employee || "Nhân viên");

    var res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      console.warn("[n8n] Check leave balance failed API side");
      return { success: false, usedDays: 0 };
    }
    
    var result = await res.json();
    return { success: true, usedDays: result.usedDays || 0 };
  } catch (err) {
    console.warn("[n8n] Check leave webhook not reachable yet, mocking 0 days.");
    return { success: false, usedDays: 0 };
  }
}

module.exports = { createLeaveRequest, createEmail, checkLeaveBalance };

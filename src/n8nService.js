/**
 * n8n Service — call n8n webhooks to execute actions.
 */
// Native fetch available in Node v24+

var N8N_WEBHOOK = process.env.N8N_WEBHOOK || "https://neshaki.app.n8n.cloud/webhook-test/ai-agent";

/**
 * Call n8n to create a leave request
 */
async function createLeaveRequest(data, lang) {
  lang = lang || "vi";
  console.log("[n8n] Creating leave request... Lang: " + lang);
  
  var chatInput = lang === "vi"
    ? `Dựa trên thông tin sau: Nhân viên ${data.employee || "Nhân viên"} xin nghỉ từ ngày ${data.startDate} đến ngày ${data.endDate}. Lý do: ${data.reason}. Hãy sinh ra câu trả lời ngắn gọn báo cáo rằng đơn xin nghỉ chờ n8n duyệt.`
    : `Based on the following data: Employee ${data.employee || "Employee"} requested leave from ${data.startDate} to ${data.endDate}. Reason: ${data.reason}. Please generate a concise confirmation message that the request is pending manager approval.`;

  var res = await fetch(N8N_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_leave",
      employee: data.employee || (lang === "vi" ? "Nhân viên" : "Employee"),
      employeeId: data.employeeId || null,
      type: data.type || "annual",
      startDate: data.startDate || "Chưa xác định",
      endDate: data.endDate || "Chưa xác định",
      reason: data.reason || "",
      days: data.days || 0,
      usedDays: data.usedDays || 0,
      status: data.status || "Approve",
      clientId: data.clientId || "",
      spreadsheetId: data.spreadsheetId || "",
      chatInput: chatInput
    }),
  });

  if (!res.ok) {
    var errText = await res.text();
    console.error("[n8n] Leave request error:", res.status, errText);
    return { success: false, error: errText };
  }

  var result = await res.json().catch(function () { return { success: true }; });
  console.log("[n8n] Leave request result:", result);
  return { success: true, data: result };
}

/**
 * Local helper to generate email draft using TinyFish
 */
async function generateEmailWithTinyFish(data, lang) {
  if (!process.env.TINYFISH_API_KEY) return null;

  var sysPrompt = lang === "en" 
    ? `You are an AI assistant drafting a leave request email FOR AN EMPLOYEE to send TO THEIR MANAGER.
       IMPORTANT: 
       1. SENDER: "${data.employee}" (ID: "${data.employeeId}"). 
       2. RECIPIENT: The Manager.
       3. DATES: Use EXACTLY "${data.startDate}" and "${data.endDate}".
       4. SIGN OFF with the employee name: "${data.employee}". 
       5. DO NOT use placeholders like [Your Name] or [Manager Name].
       6. Return ONLY the email content. No preamble.
       7. Language: EXCLUSIVELY English.`
    : `Bạn là trợ lý AI đang soạn email xin nghỉ phép THAY MẶT NHÂN VIÊN gửi cho QUẢN LÝ. 
       QUAN TRỌNG: 
       1. NGƯỜI GỬI: "${data.employee}" (Mã NV: "${data.employeeId}").
       2. NGƯỜI NHẬN: Quản lý.
       3. NGÀY: Sử dụng CHÍNH XÁC "${data.startDate}" và "${data.endDate}".
       4. KÝ TÊN bằng chính xác tên nhân viên: "${data.employee}".
       5. TUYỆT ĐỐI KHÔNG để lại các phần trong ngoặc vuông như [Tên của bạn].
       6. Chỉ trả về nội dung email.
       7. Ngôn ngữ: EXCLUSIVELY Tiếng Việt.`;

  var userPrompt = lang === "en"
    ? `Employee: ${data.employee}, ID: ${data.employeeId}, Leave from ${data.startDate} to ${data.endDate}, Reason: ${data.reason}.`
    : `Nhân viên: ${data.employee}, Mã NV: ${data.employeeId}, Nghỉ từ ${data.startDate} đến ${data.endDate}, Lý do: ${data.reason}.`;

  try {
    var url = process.env.TINYFISH_API_URL || "https://agent.tinyfish.ai/v1/automation/run-sse";
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": process.env.TINYFISH_API_KEY },
      body: JSON.stringify({
        url: "https://www.google.com",
        goal: "IMPORTANT: ONLY RETURN EMAIL CONTENT. NO WEB SEARCH. \n\n" + sysPrompt + "\n\n" + userPrompt
      })
    });

    if (!res.ok) return null;

    var rawText = await res.text();
    var fullText = "";
    var lines = rawText.split("\n");
    for (var line of lines) {
      if (line.trim().startsWith("data: ")) {
        var dataStr = line.trim().slice(6);
        if (dataStr === "[DONE]") continue;
        try {
          var parsed = JSON.parse(dataStr);
          fullText += (parsed.text || parsed.content || "");
        } catch (e) {
          fullText += dataStr;
        }
      }
    }
    return fullText.trim();
  } catch (err) {
    console.error("[TinyFish Email] Local gen failed:", err.message);
    return null;
  }
}

/**
 * Local helper to generate email draft using Gemini
 */
async function generateEmailWithGemini(data, lang) {
  if (!process.env.GEMINI_API_KEY) return null;

  var sysPrompt = lang === "en"
    ? `You are an AI assistant drafting a leave request email FOR AN EMPLOYEE to send TO THEIR MANAGER.
       IMPORTANT: 
       - SENDER: "${data.employee}" (ID: "${data.employeeId}").
       - RECIPIENT: The Manager.
       - DATES: Use EXACTLY "${data.startDate}" and "${data.endDate}". 
       - SIGN OFF with the employee name: "${data.employee}".
       - NO placeholders like [Your Name] or [Manager Name]. 
       - Respond ONLY with the email text.
       - Language: English.`
    : `Bạn là trợ lý AI đang soạn email xin nghỉ phép THAY MẶT NHÂN VIÊN gửi cho QUẢN LÝ.
       QUAN TRỌNG: 
       - NGƯỜI GỬI: "${data.employee}" (Mã NV: "${data.employeeId}").
       - NGƯỜI NHẬN: Quản lý.
       - NGÀY: Sử dụng CHÍNH XÁC "${data.startDate}" và "${data.endDate}".
       - KÝ TÊN bằng chính xác tên nhân viên: "${data.employee}".
       - KHÔNG dùng các placeholder như [Tên của bạn]. 
       - Chỉ trả về nội dung email hoàn chỉnh.
       - Ngôn ngữ: Tiếng Việt.`;

  var userPrompt = `Data: Name: ${data.employee}, ID: ${data.employeeId}, Range: ${data.startDate} to ${data.endDate}, Reason: ${data.reason}.`;

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY;
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: sysPrompt + "\n\n" + userPrompt }] }] })
    });

    var jsonRes = await res.json();
    if (!res.ok) return null;
    return jsonRes.candidates[0].content.parts[0].text;
  } catch (err) {
    console.warn("[Gemini Email] Local fallback failed:", err.message);
    return null;
  }
}

/**
 * Call n8n to draft an email for leave request
 */
async function createEmail(data, lang) {
  lang = lang || "vi";
  console.log("[n8n] Generating email locally first (Gemini Primary)... Lang: " + lang);

  // 1. Try Gemini first
  var generatedText = await generateEmailWithGemini(data, lang);

  // 2. Fallback to TinyFish
  if (!generatedText) {
    console.log("[n8n] Gemini failed, trying TinyFish fallback...");
    generatedText = await generateEmailWithTinyFish(data, lang);
  }

  // 3. Last fallback (Hardcoded)
  if (!generatedText) {
    generatedText = lang === "en"
      ? `Dear Management,\n\nI am ${data.employee}, requesting leave from ${data.startDate} to ${data.endDate}.\nReason: ${data.reason}\n\nBest regards.`
      : `Kính gửi Quản lý,\n\nTôi tên là ${data.employee}, xin nghỉ phép từ ${data.startDate} đến ${data.endDate}.\nLý do: ${data.reason}\n\nTrân trọng.`;
  }

  var payload = {
    action: "create_email",
    employeeId: data.employeeId || null,
    days: data.days || 0,
    usedDays: data.usedDays || 0,
    status: data.status || "Approve",
    spreadsheetId: data.spreadsheetId || "",
    query: data.query || "",
    emailContent: generatedText || "",
    chatInput: data.chatInput || ""
  };

  try {
    var res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { success: true, emailContent: generatedText };
    } else {
      return { success: true, emailContent: generatedText, warning: "n8n_sync_failed" };
    }
  } catch (err) {
    return { success: true, emailContent: generatedText };
  }
}

var N8N_WEBHOOK_CHECK_LEAVE = process.env.N8N_WEBHOOK_CHECK_LEAVE;

/**
 * Call n8n to get total leave days already taken by employee
 */
async function checkLeaveBalance(spreadsheetId, employee, employeeId) {
  console.log(`[n8n] Checking leave balance for ${employee} (ID: ${employeeId})...`);
  try {
    var res = await fetch(N8N_WEBHOOK_CHECK_LEAVE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spreadsheetId: spreadsheetId || "",
        employee: employee || "",
        employeeId: employeeId || ""
      })
    });

    if (!res.ok) {
      console.warn("[n8n] Check leave balance failed API side, assuming 0 days check Sheet.");
      return { success: true, usedDays: 0, warning: "n8n_offline" };
    }

    var result = await res.json();
    return { success: true, usedDays: result.usedDays || 0 };
  } catch (err) {
    console.warn("[n8n] Check leave balance failed (Unreachable), mocking 0 days.");
    return { success: true, usedDays: 0 };
  }
}

var N8N_WEBHOOK_INTENT = process.env.N8N_WEBHOOK_INTENT || "https://neshaki.app.n8n.cloud/webhook-test/process-intent";

/**
 * Call n8n to analyze context/intent using TinyFish (n8n side)
 */
async function analyzeContext(message, clientId) {
  console.log(`[n8n] Analyzing context via n8n for ${clientId}...`);
  try {
    var res = await fetch(N8N_WEBHOOK_INTENT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, clientId }),
    });

    if (!res.ok) {
      console.warn("[n8n] Context analysis failed on n8n side");
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("[n8n] analyzeContext error:", err.message);
    return null;
  }
}

module.exports = { createLeaveRequest, createEmail, checkLeaveBalance, analyzeContext };

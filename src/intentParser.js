/**
 * Intent Parser — TinyFish AI Agent + Gemini 2.5 Flash fallback
 *
 * Core AI Prompt: Extracts structured actions from user input.
 * Supported actions: request_leave, submit_content
 *
 * Strategy:
 *   1. TINYFISH_API_KEY set → call TinyFish AI Agent (SSE)
 *   2. GEMINI_API_KEY set → call Gemini 2.5 Flash
 *   3. Fallback → keyword-based matching
 */

// ─── Core AI Prompt (dùng cho cả Gemini và TinyFish) ───
var AI_PROMPT =
  "You are an AI that extracts structured actions from user input in Vietnamese or English.\n\n" +
  "CRITICAL: If the user wants to QUIT, RESIGN or LEAVE PERMANENTLY (e.g., 'nghỉ việc', 'nghỉ luôn', 'thôi việc', 'nghỉ hẳn'), classify as 'general'.\n" +
  "Only 'request_leave' is for temporary leave (annual, sick, personal) with intention to return.\n\n" +
  "Supported actions:\n" +
  "1. request_leave\n" +
  "2. submit_content\n" +
  "3. general\n\n" +
  "Return JSON only in this exact format:\n" +
  "{\n" +
  '  "action": "request_leave | submit_content | general",\n' +
  '  "employee": "Full name (e.g. Tran Van A)",\n' +
  '  "employee_id": "Exact ID number",\n' +
  '  "leave_type": "annual | sick | personal",\n' +
  '  "start_date": "Ngày bắt đầu định dạng DD/MM/YYYY (tự suy luận năm hiện tại nếu thiếu, vd: 21 tháng 3 -> 21/03/2026)",\n' +
  '  "end_date": "Ngày kết thúc định dạng DD/MM/YYYY",\n' +
  '  "reason": "Lý do xin nghỉ (giữ nguyên văn càng tốt)",\n' +
  '  "query": "Toàn bộ câu hỏi gốc của user",\n' +
  '  "is_direct_action": "true nếu user muốn THỰC HIỆN hành động (ví dụ: muốn nghỉ, muốn gửi khiếu nại, có ngày tháng cụ thể), false nếu user chỉ đang HỎI thông tin (ví dụ: quy định thế nào, xem chính sách)" \n' +
  "}\n\n" +
  "Examples:\n" +
  "1. 'Tôi muốn nghỉ phép ngày mai' -> is_direct_action: true, action: request_leave\n" +
  "2. 'Quy trình nghỉ phép như thế nào?' -> is_direct_action: false, action: request_leave\n" +
  "3. 'Cho tôi nghỉ từ 25 đến 26/03' -> is_direct_action: true, action: request_leave\n" +
  "4. 'I want to take tomorrow off' -> is_direct_action: true, action: request_leave\n" +
  "5. 'How many leave days do I have?' -> is_direct_action: false, action: request_leave\n" +
  "6. 'Request leave from 22/3 to 23/3' -> is_direct_action: true, action: request_leave\n" +
  "7. 'I am resigning from the company' -> is_direct_action: true, action: general\n\n" +
  "If the action is not request_leave or submit_content, return action: general.\n";

// ─── TinyFish AI Agent (SSE) ───
async function parseWithTinyFish(message) {
  var apiKey = process.env.TINYFISH_API_KEY;
  var apiUrl = process.env.TINYFISH_API_URL || "https://agent.tinyfish.ai/v1/automation/run-sse";

  try {
    var res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://internal-assistant.local/parse",
        goal: AI_PROMPT + '"' + message + '"',
      }),
    });

    if (!res.ok) {
      console.error("[TinyFish AI] Error:", res.status, await res.text());
      
      return null;
    }

    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var fullText = "";

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      var text = decoder.decode(chunk.value, { stream: true });
      var lines = text.split("\n");
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith("data: ")) {
          var data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            var parsed = JSON.parse(data);
            if (parsed.text) fullText += parsed.text;
            else if (parsed.content) fullText += parsed.content;
            else if (parsed.output) fullText += parsed.output;
            else if (parsed.result) fullText += (typeof parsed.result === "string" ? parsed.result : JSON.stringify(parsed.result));
          } catch (_) { fullText += data; }
        }
      }
    }

    fullText = fullText.trim();
    try { return normalizeResult(JSON.parse(fullText)); } catch (_) {}
    var jsonMatch = fullText.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) {
      try { return normalizeResult(JSON.parse(jsonMatch[0])); } catch (_) {}
    }
    
    // If we reach here, TinyFish returned non-JSON text (maybe an error or out of credits)
    if (fullText.length > 0) {
      console.warn("[TinyFish AI] Returned non-JSON response:", fullText);
    } else {
      console.warn("[TinyFish AI] Returned empty response. Please check API Credits or Endpoint.");
    }
    return null;
  } catch (err) {
    console.warn("[TinyFish AI] Error:", err.message);
    return null;
  }
}

// ─── Gemini 2.5 Flash Parser ───
async function parseWithGemini(message) {
  if (!process.env.GEMINI_API_KEY) return null;
  
  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-1b-it:generateContent?key=" + process.env.GEMINI_API_KEY;
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: AI_PROMPT + "\n\nInput message:\n" + message }] }]
      })
    });
    
    var jsonRes = await res.json();
    if (!res.ok) throw new Error(jsonRes.error ? jsonRes.error.message : "Gemini fetch failed");

    var rawText = jsonRes.candidates[0].content.parts[0].text;
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    var data = JSON.parse(rawText);
    data.query = message;
    return normalizeResult(data);
  } catch (err) {
    console.warn("[Gemini Parser] Error:", err.message);
    return null;
  }
}

// Normalize AI response → internal format
function normalizeResult(result) {
  var actionMap = {
    "request_leave": "leave_request",
    "submit_content": "content_moderation",
  };

  return {
    intent: actionMap[result.action] || result.action || "general",
    entities: {
      employee: result.employee || null,
      employeeId: result.employee_id || null,
      type: result.leave_type || "annual",
      startDate: result.start_date || null,
      endDate: result.end_date || null,
      reason: result.reason || null,
      content: result.content || null,
      query: result.query || null,
      is_direct_action: result.is_direct_action ?? false,
    },
    confidence: result.confidence || 0.9,
  };
}

// ─── Keyword fallback ───
function parseWithKeywords(message) {
  var lower = message.toLowerCase();
  var leaveKeywords = ["nghỉ phép", "xin nghỉ", "muốn nghỉ", "nghỉ từ", "nghỉ đến", "đăng ký nghỉ", "nghỉ ốm", "leave", "off", "vacation", "absent", "day off"];
  var ignoreKeywords = ["nghỉ việc", "nghỉ luôn", "nghỉ hẳn", "thôi việc", "nghỉ ngang", "resign", "quit"];
  
  var hasLeave = leaveKeywords.some(function(k) { return lower.includes(k); });
  var hasIgnore = ignoreKeywords.some(function(k) { return lower.includes(k); });

  if (hasLeave && !hasIgnore) {
    // ID: 2251120223
    var idMatch = message.match(/\d{5,12}/); 
    var id = idMatch ? idMatch[0] : null;

    // Names: "Tôi tên A" or "My name is A" or "I am A"
    var nameMatch = message.match(/(?:tên(?: là)?|nhân viên|my name is|i am)\s+([a-zà-ỹ\s]{3,40})/i);
    var name = null;
    if (nameMatch) {
       name = nameMatch[1].trim().split(/\s*(?:id|mã|số|xin|nghỉ|từ|đến|ngày|vì|for|request|reason|at|$)/i)[0].trim();
    }

    // Dates
    var dateMatches = message.match(/(\d{1,2})[\/\-](\d{1,2})/g);
    var currentYear = "2026"; 
    var startDate = "Chưa xác định";
    var endDate = "Chưa xác định";
    if (dateMatches && dateMatches.length >= 1) {
      startDate = dateMatches[0].replace("-", "/") + "/" + currentYear;
      if (dateMatches.length >= 2) {
        endDate = dateMatches[1].replace("-", "/") + "/" + currentYear;
      }
    }

    // Reason
    var reasonMatch = message.match(/(?:vì lý do|lý do là|do|lý do:|for|reason:)\s+([^,.\n?!|]+)/i);
    var reason = reasonMatch ? reasonMatch[1].trim() : null;

    // Only set is_direct_action: true if there are multiple dates OR command keywords
    var hasCommand = ["muốn", "xin", "đăng ký", "cho tôi", "want", "request", "apply", "take"].some(function(k) { return lower.includes(k); });
    var isDirect = hasCommand || (dateMatches && dateMatches.length >= 2);

    return {
      intent: "leave_request",
      entities: { 
        type: "annual", 
        query: message,
        employee: name,
        employeeId: id,
        startDate: startDate,
        endDate: endDate,
        reason: reason,
        is_direct_action: isDirect 
      },
      confidence: 0.5,
    };
  }
  return { intent: "general", entities: { query: message }, confidence: 1 };
}

// ─── Main Dispatcher ───
async function parseIntent(message) {
  // 1. Priority: TinyFish AI Agent (Primary - Agentic Brain)
  if (process.env.TINYFISH_API_KEY) {
    console.log("[IntentParser] Calling TinyFish (Primary - Agentic)...");
    var tfResult = await parseWithTinyFish(message);
    if (tfResult && tfResult.intent) {
      console.log("[TinyFish AI] Extracted Intent:", tfResult.intent);
      // Hybrid safety: if AI says general but keywords say leave -> trust keywords
      if (tfResult.intent === "general") {
         var keywordBackSet = parseWithKeywords(message);
         if (keywordBackSet.intent === "leave_request") {
            console.log("[IntentParser] Overriding general -> leave_request via keywords");
            return keywordBackSet;
         }
      }
      return tfResult;
    }
  }

  // 2. Secondary: Gemini (Fallback)
  if (process.env.GEMINI_API_KEY) {
    console.log("[IntentParser] Falling back to Gemini...");
    var resGemini = await parseWithGemini(message);
    if (resGemini && resGemini.intent) {
      console.log("[Gemini AI] Extracted Intent:", resGemini.intent);
      if (resGemini.intent === "general") {
         var kwBackFallback = parseWithKeywords(message);
         if (kwBackFallback.intent === "leave_request") {
            console.log("[IntentParser] Overriding general -> leave_request via keywords");
            return kwBackFallback;
         }
      }
      return resGemini;
    }
  }

  // 3. Fallback: Keywords
  console.log("[IntentParser] All AI failed, using Keyword fallback...");
  return parseWithKeywords(message);
}

module.exports = { parseIntent };

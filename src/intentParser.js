/**
 * Intent Parser — TinyFish AI Agent + keyword fallback
 *
 * Core AI Prompt: Extracts structured actions from user input.
 * Supported actions: request_leave, submit_content
 *
 * Strategy:
 *   1. TINYFISH_API_KEY set → call TinyFish AI Agent (SSE)
 *   2. Fallback → keyword-based matching
 */

// ─── Core AI Prompt (dùng mọi nơi) ───
var AI_PROMPT =
  "You are an AI that extracts structured actions from user input.\n\n" +
  "Supported actions:\n" +
  "1. request_leave\n" +
  "2. submit_content\n\n" +
  "Return JSON only.\n\n" +
  "Examples:\n\n" +
  'Input: "Tôi xin nghỉ từ 1/4 đến 3/4 vì bị ốm"\n' +
  "Output:\n" +
  '{\n  "action": "request_leave",\n  "start_date": "2026-04-01",\n  "end_date": "2026-04-03",\n  "reason": "bị ốm"\n}\n\n' +
  'Input: "Đăng nội dung này giúp tôi: abc xyz"\n' +
  "Output:\n" +
  '{\n  "action": "submit_content",\n  "content": "abc xyz"\n}\n\n' +
  "Now process this input:\n";

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
      console.warn("[TinyFish AI] HTTP " + res.status);
      return null;
    }

    // Read SSE stream
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
          } catch (_) {
            fullText += data;
          }
        }
      }
    }

    fullText = fullText.trim();

    // Try direct JSON parse
    try { return normalizeResult(JSON.parse(fullText)); } catch (_) {}

    // Try to extract JSON block from text
    var jsonMatch = fullText.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) {
      try { return normalizeResult(JSON.parse(jsonMatch[0])); } catch (_) {}
    }

    console.warn("[TinyFish AI] Could not parse:", fullText.slice(0, 200));
    return null;

  } catch (err) {
    console.warn("[TinyFish AI] Error:", err.message);
    return null;
  }
}
var OpenAI = require("openai");

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
      type: result.leave_type || "annual",
      startDate: result.start_date || null,
      endDate: result.end_date || null,
      reason: result.reason || null,
      content: result.content || null,
      query: result.query || null,
    },
    confidence: result.confidence || 0.9,
  };
}

// ─── Gemini Intent Parser (JSON Mode) ───
async function parseWithGemini(message) {
  if (!process.env.GEMINI_API_KEY) return null;
  
  var sysPrompt = 
    "You are an AI that extracts structured actions from user input in Vietnamese.\n\n" +
    "Supported actions:\n" +
    "1. request_leave\n" +
    "2. submit_content\n" +
    "3. general\n\n" +
    "Return JSON only in this exact format:\n" +
    "{\n" +
    '  "action": "request_leave | submit_content | general",\n' +
    '  "employee": "Tên và ID nhân viên nếu có (vd: Huỳnh Công Luyện - ID: 123), nếu không có thì null",\n' +
    '  "leave_type": "annual | sick | personal",\n' +
    '  "start_date": "Ngày bắt đầu định dạng DD/MM/YYYY (tự suy luận năm hiện tại nếu thiếu, vd: 21 tháng 3 -> 21/03/2026)",\n' +
    '  "end_date": "Ngày kết thúc định dạng DD/MM/YYYY",\n' +
    '  "reason": "Lý do xin nghỉ (giữ nguyên văn càng tốt)",\n' +
    '  "query": "Toàn bộ câu hỏi gốc của user"\n' +
    "}\n\n" +
    "If the action is not request_leave or submit_content, return action: general.\n";

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY;
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });
    
    var jsonRes = await res.json();
    if (!res.ok) throw new Error(jsonRes.error ? jsonRes.error.message : "Fetch failed");

    var rawText = jsonRes.candidates[0].content.parts[0].text;
    var data = JSON.parse(rawText);
    
    // Ensure query is carried over for general QA
    data.query = message;
    return normalizeResult(data);
  } catch (err) {
    console.warn("[Gemini Parser] Error:", err.message);
    return null;
  }
}

// ─── Keyword fallback ───

var LEAVE_KW = [
  "nghỉ phép", "xin nghỉ", "leave", "day off", "time off", "vacation",
  "sick leave", "nghỉ ốm", "personal leave", "nghỉ việc riêng",
  "annual leave", "take leave", "request leave", "xin phép"
];

var CONTENT_KW = [
  "kiểm duyệt", "moderat", "review content", "check content",
  "đăng nội dung", "submit content", "nội dung", "đăng bài",
  "scan", "filter", "flag", "spam", "offensive",
];

function parseWithKeywords(message) {
  var lower = message.toLowerCase();

  var leaveHits = LEAVE_KW.filter(function(kw) { return lower.includes(kw); });
  if (leaveHits.length > 0) {
    var dates = message.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4})/g) || [];
    var type = "annual";
    if (lower.includes("ốm") || lower.includes("sick")) type = "sick";
    else if (lower.includes("việc riêng") || lower.includes("personal")) type = "personal";

    return {
      intent: "leave_request",
      entities: { type: type, startDate: dates[0] || null, endDate: dates[1] || null, reason: message, query: message },
      confidence: Math.min(leaveHits.length / 2, 1),
    };
  }

  var contentHits = CONTENT_KW.filter(function(kw) { return lower.includes(kw); });
  if (contentHits.length > 0) {
    var colonMatch = message.match(/[:：]\s*(.+)/);
    var quoteMatch = message.match(/"([^"]+)"|'([^']+)'/);
    var content = colonMatch ? colonMatch[1].trim() : (quoteMatch ? (quoteMatch[1] || quoteMatch[2]) : message);

    return {
      intent: "content_moderation",
      entities: { content: content, query: message },
      confidence: Math.min(contentHits.length / 2, 1),
    };
  }

  return { intent: "general", entities: { query: message }, confidence: 1 };
}

// ─── Main ───

async function parseIntent(message) {
  // Try Gemini API if key exists
  if (process.env.GEMINI_API_KEY) {
    console.log("[IntentParser] Calling Gemini 1.5 Flash...");
    var resultGemini = await parseWithGemini(message);
    if (resultGemini && resultGemini.intent) {
      console.log("[IntentParser] Gemini result:", JSON.stringify(resultGemini));
      return resultGemini;
    }
  }

  // Fallback
  console.log("[IntentParser] Keyword fallback");
  return parseWithKeywords(message);
}

module.exports = { parseIntent, AI_PROMPT };

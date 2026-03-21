/**
 * RAG Service — Supabase pgvector + Gemini API
 *
 * 1. Embed user query with Gemini (text-embedding-004, 768 dims)
 * 2. Vector search in Supabase (filtered by clientId)
 * 3. Summarize results with Gemini chat
 */
var { createClient } = require("@supabase/supabase-js");

var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Embed text → vector using Gemini
 */
async function embedText(text) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  
  var url = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=" + process.env.GEMINI_API_KEY;
  var res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/embedding-001",
      content: { parts: [{ text: text }] }
    })
  });

  var jsonRes = await res.json();
  if (!res.ok) throw new Error(jsonRes.error ? jsonRes.error.message : "Embedding fetch failed");
  
  return jsonRes.embedding.values;
}

/**
 * Search relevant policy chunks from Supabase pgvector
 */
async function searchPolicy(query, clientId, topK) {
  topK = topK || 5;
  clientId = clientId || "default";

  var queryEmbedding = await embedText(query);

  // Use Supabase RPC to do vector similarity search with clientId filter
  var { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: 0.1, // Lower threshold for broad queries like "summarize"
    match_count: topK,
    p_client_id: clientId, // Filter by customer
  });

  if (error) {
    console.error("[RAG] Supabase search error:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Summarize policy chunks for the user's specific question
 */
async function summarizePolicy(query, chunks) {
  if (!chunks || chunks.length === 0) {
    return "Xin lỗi, tôi không tìm thấy thông tin liên quan trong quy định của công ty bạn.";
  }

  if (!process.env.GEMINI_API_KEY) return "Vui lòng cấu hình GEMINI_API_KEY để AI hoạt động.";

  var context = chunks.map(function(c) { return c.content; }).join("\n\n---\n\n");
  var sysPrompt = 
    "Bạn là trợ lý HR của công ty. " +
    "Dựa trên quy định công ty bên dưới, hãy trả lời câu hỏi của nhân viên bằng tiếng Việt. " +
    "Trả lời ngắn gọn, rõ ràng, dùng bullet points. " +
    "Chỉ trích dẫn thông tin có trong quy định, không bịa thêm.";
  
  var userPrompt = "QUY ĐỊNH CÔNG TY:\n\n" + context + "\n\n---\n\nCâu hỏi nhân viên: " + query;

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY;
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    });

    var jsonRes = await res.json();
    if (!res.ok) throw new Error(jsonRes.error ? jsonRes.error.message : "Generate content fetch failed");
    
    return jsonRes.candidates[0].content.parts[0].text;
  } catch (err) {
    console.warn("[Gemini RAG] Summarize error:", err.message);
    return "Tuyệt vời, nhưng hệ thống xử lý ngôn ngữ đang bận. Vui lòng thử lại sau.";
  }
}

/**
 * Full RAG pipeline: query → search → summarize
 */
async function queryRAG(question, clientId) {
  console.log("[RAG] Searching for [" + clientId + "]:", question);
  var chunks = await searchPolicy(question, clientId);
  console.log("[RAG] Found " + chunks.length + " chunks for " + clientId);
  var summary = await summarizePolicy(question, chunks);
  return summary;
}

module.exports = { embedText, searchPolicy, summarizePolicy, queryRAG };

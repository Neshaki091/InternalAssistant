
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

  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" + process.env.GEMINI_API_KEY;
  var res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text: text }] },
      outputDimensionality: 1536
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
 * Summarize using TinyFish (SSE) - Automation Run format
 */

var { detectLang, T } = require("./language");

/**
 * Summarize policy chunks for the user's specific question
 */
async function summarizePolicy(query, chunks, lang) {
  lang = lang || detectLang(query);
  var strings = T[lang];

  if (!chunks || chunks.length === 0) {
    return strings.rag_not_found;
  }

  var context = chunks.map(function (c) { return c.content; }).join("\n\n---\n\n");
  var sysPrompt = strings.rag_sys_prompt.replace("{lang}", lang === "vi" ? "Tiếng Việt" : "English");

  var userPrompt = "QUY ĐỊNH CÔNG TY (POLICIES):\n\n" + context + "\n\n---\n\nQuestion: " + query;

  // 1. Priority: Gemini (Primary - Faster)
  if (!process.env.GEMINI_API_KEY) return "Settings missing GEMINI_API_KEY.";
  
  console.log("[RAG] Summarizing with Gemini (Primary)... Lang: " + lang);
  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-1b-it:generateContent?key=" + process.env.GEMINI_API_KEY;
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: sysPrompt + "\n\n" + userPrompt }] }]
      })
    });

    var jsonRes = await res.json();
    if (!res.ok) throw new Error(jsonRes.error ? jsonRes.error.message : "Generate content fetch failed");

    return jsonRes.candidates[0].content.parts[0].text;
  } catch (err) {
    console.warn("[Gemini RAG] Summarize error:", err.message);
    return lang === "vi" 
      ? "Hệ thống đang bận. Vui lòng thử lại sau."
      : "The system is busy. Please try again later.";
  }
}

/**
 * Full RAG pipeline: query → search → summarize
 */
async function queryRAG(question, clientId, lang) {
  console.log("[RAG] Searching for [" + clientId + "]:", question);
  var chunks = await searchPolicy(question, clientId);
  console.log("[RAG] Found " + chunks.length + " chunks for " + clientId);
  var summary = await summarizePolicy(question, chunks, lang);
  return summary;
}

module.exports = { embedText, searchPolicy, summarizePolicy, queryRAG };

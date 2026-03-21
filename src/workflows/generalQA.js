/**
 * General Q&A Workflow using RAG
 */
var { queryRAG } = require("../ragService");

async function generalQAWorkflow(entities, clientId, sessionId, message, lang) {
  // Use the raw message for RAG search
  var ragQuery = message || entities.query || "thông tin";
  
  var answer;
  try {
    answer = await queryRAG(ragQuery, clientId, lang);
  } catch (err) {
    console.error("[GeneralQA] RAG error:", err.message);
    answer = lang === "vi" 
      ? "Hệ thống tra cứu đang bận. Vui lòng thử lại sau."
      : "The query system is busy. Please try again later.";
  }

  // If the policy doesn't exist or OpenAI explicitly says it can't find it
  return {
    output: answer,
    intent: "general",
  };
}

module.exports = generalQAWorkflow;

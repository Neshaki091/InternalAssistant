/**
 * Ingestor Utility — Core logic for chunking, embedding, and storing in Supabase.
 * Shared by CLI script and Admin API.
 */
require("dotenv").config();
var mammoth = require("mammoth");
var { createClient } = require("@supabase/supabase-js");

// Use the newly migrated Gemini embedText function
var { embedText } = require("../ragService");

var supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Split text into chunks (~500 chars)
 */
function chunkText(text, metadata) {
  var chunks = [];
  var words = text.split(/\s+/);
  var currentChunkData = [];
  var currentCharCount = 0;

  for (var i = 0; i < words.length; i++) {
    currentChunkData.push(words[i]);
    currentCharCount += words[i].length + 1;

    if (currentCharCount > 500 || i === words.length - 1) {
      chunks.push({
        content: currentChunkData.join(" ").trim(),
        metadata: Object.assign({}, metadata, { chunk_index: chunks.length }),
      });
      currentChunkData = [];
      currentCharCount = 0;
    }
  }

  return chunks;
}

/**
 * Extract text from .docx buffer or path
 */
async function extractTextFromDocx(source) {
  var mammothOptions = typeof source === "string" ? { path: source } : { buffer: source };
  var result = await mammoth.extractRawText(mammothOptions);
  return result.value;
}

/**
 * Main logic to process a policy (from text, .md, or .docx)
 */
async function processPolicy(options) {
  var clientId = options.clientId || "default";
  var sourceName = options.sourceName || "unknown";
  var text = options.text || "";

  if (options.docxBuffer) {
    text = await extractTextFromDocx(options.docxBuffer);
  } else if (options.docxPath) {
    text = await extractTextFromDocx(options.docxPath);
  }

  if (!text.trim()) {
    throw new Error("Empty policy content!");
  }

  var chunks = chunkText(text, { source: sourceName, clientId: clientId });
  console.log(`[Ingestor] Processing ${chunks.length} chunks for ${clientId}...`);

  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i];
    
    // 1. Embed with Gemini
    var embedding = await embedText(chunk.content);

    // 2. Insert into Supabase
    var { error } = await supabase.from("documents").insert({
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: embedding,
      client_id: clientId,
    });

    if (error) {
      console.error(`[Ingestor] Chunk ${i} error:`, error.message);
    }
  }

  return { success: true, chunksProcessed: chunks.length };
}

module.exports = { processPolicy, chunkText };

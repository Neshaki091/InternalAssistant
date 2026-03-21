/**
 * POST /api/ingest
 * 
 * Multipart/form-data:
 *   - clientId: string
 *   - policyFile: .docx file
 * 
 * Flow: 
 *   - Accept upload via multer
 *   - Call ingestor utility to process
 */
var express = require("express");
var multer = require("multer");
var { processPolicy } = require("../utils/ingestor");

var router = express.Router();

// Setup multer (in-memory storage for hackathon speed)
var storage = multer.memoryStorage();
var upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post("/", upload.single("policyFile"), async function(req, res) {
  try {
    var clientId = req.body.clientId;
    var spreadsheetId = req.body.spreadsheetId;
    var file = req.file;

    if (!clientId) {
      return res.status(400).json({ error: "Missing clientId!" });
    }
    if (!spreadsheetId) {
      return res.status(400).json({ error: "Missing spreadsheetId!" });
    }
    if (!file) {
      return res.status(400).json({ error: "No .docx file uploaded!" });
    }

    // Save to Supabase clients table
    var { createClient } = require("@supabase/supabase-js");
    var supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    // We don't have user_id here (it's called from dashboard which has auth), 
    // but we can upsert by slug. In a real app, we'd check auth permissions.
    await supabase.from("clients").upsert({
      slug: clientId,
      name: clientId, // Default name to slug if not provided
      spreadsheet_id: spreadsheetId
    }, { onConflict: 'slug' });

    console.log(`[/api/ingest] Persistent config saved for: ${clientId}`);

    // Call shared ingestor utility
    var result = await processPolicy({
      clientId: clientId,
      sourceName: file.originalname,
      docxBuffer: file.buffer
    });

    return res.json({
      success: true,
      message: `Đã kích hoạt Chatbot cho ${clientId}!`,
      chunks: result.chunksProcessed,
      embedCode: `<script src="http://localhost:4000/sdk/agent.js" data-client-id="${clientId}" data-api="http://localhost:4000/api/chat"></script>`
    });

  } catch (err) {
    console.error("[/api/ingest] Error:", err.message);
    return res.status(500).json({ 
      error: "Lỗi xử lý file!", 
      details: err.message 
    });
  }
});

module.exports = router;

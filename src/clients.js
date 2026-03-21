/**
 * Client Registry — simplified multi-tenant config.
 * Each clientId has a config object. In production, store in DB.
 */

var { createClient } = require("@supabase/supabase-js");

var supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// In-memory cache for speed (optional, for hackathon keep it simple)
var CLIENT_CACHE = {};

/**
 * Middleware: validate clientId and attach config to req.
 * Now ASYNC to fetch from Supabase.
 */
async function clientMiddleware(req, res, next) {
  var clientId = req.body.clientId || req.query.clientId;
  if (!clientId) {
    return res.status(400).json({ error: "Missing clientId" });
  }

  // 1. Check cache
  if (CLIENT_CACHE[clientId]) {
    req.clientId = clientId;
    req.clientConfig = CLIENT_CACHE[clientId];
    return next();
  }

  // 2. Fetch from Supabase by slug
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", clientId)
    .single();

  if (data) {
    var config = {
      name: data.name,
      spreadsheetId: data.spreadsheet_id,
      companyEmail: data.company_email || "",
      workflows: ["leave_request", "content_moderation"]
    };
    CLIENT_CACHE[clientId] = config;
    req.clientId = clientId;
    req.clientConfig = config;
    return next();
  }

  // 3. Auto-fallback for demo speed
  console.log(`[Clients] Client ${clientId} not found in DB, using fallback.`);
  var fallback = {
    name: "Client " + clientId,
    spreadsheetId: "",
    companyEmail: "",
    workflows: ["leave_request", "content_moderation"]
  };
  req.clientId = clientId;
  req.clientConfig = fallback;
  next();
}

module.exports = { clientMiddleware, CLIENTS: CLIENT_CACHE };

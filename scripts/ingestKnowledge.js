/**
 * CLI Ingest Knowledge Base
 *
 * Scans /knowledge folder and uses the shared ingestor utility.
 * Usage: npm run ingest
 */
require("dotenv").config();
var fs = require("fs");
var path = require("path");
var { processPolicy } = require("../src/utils/ingestor");

var KNOWLEDGE_DIR = path.join(__dirname, "..", "knowledge");

async function run() {
  const args = process.argv.slice(2);
  const targetFile = args[0];
  const targetClient = args[1];

  if (targetFile && targetClient) {
    console.log(`📂 CLI Ingestion: Processing specific file ${targetFile} for client ${targetClient}`);
    try {
      await processPolicy({
        clientId: targetClient,
        sourceName: path.basename(targetFile),
        docxPath: targetFile.endsWith(".docx") ? targetFile : null,
        text: targetFile.endsWith(".md") || targetFile.endsWith(".txt") ? fs.readFileSync(targetFile, "utf-8") : null
      });
      console.log("\n✅ Single File Ingestion complete.");
      return;
    } catch (e) {
      console.error(`  ✗ Error processing ${targetFile}:`, e.message);
      return;
    }
  }

  // Fallback to bulk scan if no args
  console.log("📂 CLI Ingestion: Scanning", KNOWLEDGE_DIR);

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.log("⚠ Knowledge directory missing. Creating...");
    fs.mkdirSync(KNOWLEDGE_DIR);
    return;
  }

  var items = fs.readdirSync(KNOWLEDGE_DIR);
  
  for (var i = 0; i < items.length; i++) {
    var itemPath = path.join(KNOWLEDGE_DIR, items[i]);
    var stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      var clientId = items[i];
      var files = fs.readdirSync(itemPath);
      for (var file of files) {
        if (file.endsWith(".md") || file.endsWith(".docx") || file.endsWith(".txt")) {
          console.log(`  Processing [${clientId}] ${file}...`);
          try {
            await processPolicy({
              clientId: clientId,
              sourceName: file,
              docxPath: file.endsWith(".docx") ? path.join(itemPath, file) : null,
              text: file.endsWith(".md") || file.endsWith(".txt") ? fs.readFileSync(path.join(itemPath, file), "utf-8") : null
            });
          } catch (e) {
            console.error(`  ✗ Error processing ${file}:`, e.message);
          }
        }
      }
    } else if (items[i].endsWith(".md") || items[i].endsWith(".docx") || items[i].endsWith(".txt")) {
      console.log(`  Processing [default] ${items[i]}...`);
      try {
        await processPolicy({
          clientId: "default",
          sourceName: items[i],
          docxPath: items[i].endsWith(".docx") ? itemPath : null,
          text: items[i].endsWith(".md") || items[i].endsWith(".txt") ? fs.readFileSync(itemPath, "utf-8") : null
        });
      } catch (e) {
        console.error(`  ✗ Error processing ${items[i]}:`, e.message);
      }
    }
  }

  console.log("\n✅ CLI Ingestion complete.");
}

run().catch(console.error);

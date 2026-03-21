/**
 * Workflow Engine
 * Dispatches intents to workflow handlers.
 * Now passes sessionId for multi-turn support.
 */
var leaveWorkflow = require("./workflows/leaveRequest");
var moderationWorkflow = require("./workflows/contentModeration");
var generalQaWorkflow = require("./workflows/generalQA");

var handlers = {
  leave_request: leaveWorkflow,
  content_moderation: moderationWorkflow,
  general: generalQaWorkflow,
};

async function runWorkflow(intent, entities, clientId, sessionId, message) {
  var handler = handlers[intent];

  if (!handler) {
    handler = handlers["general"];
  }

  return handler(entities, clientId, sessionId, message);
}

module.exports = { runWorkflow };

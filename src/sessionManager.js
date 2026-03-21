/**
 * Session Manager — in-memory multi-turn conversation state.
 *
 * States:
 *   idle                → user sends a new message
 *   waiting_confirmation → bot asked "tạo đơn / email?" and waits for answer
 */

var sessions = {};

function getSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      state: "idle",
      lang: "vi",
      pendingAction: null,   // "create_leave" | "create_email"
      pendingData: null,     // { startDate, endDate, reason, ... }
      history: [],
    };
  }
  return sessions[sessionId];
}

function setWaitingConfirmation(sessionId, data, lang) {
  var session = getSession(sessionId);
  session.state = "waiting_confirmation";
  session.pendingData = data;
  if (lang) session.lang = lang;
}

function clearSession(sessionId) {
  var session = getSession(sessionId);
  session.state = "idle";
  session.pendingAction = null;
  session.pendingData = null;
}

function isWaitingConfirmation(sessionId) {
  var session = getSession(sessionId);
  return session.state === "waiting_confirmation";
}

/**
 * Check if user message is a confirmation action
 * Returns: "create_leave" | "create_email" | "cancel" | null
 */
function parseConfirmation(message) {
  var lower = message.toLowerCase().trim();

  // Canonical & Localized Action button values
  if (lower === "create_leave" || lower === "tao_don_nghi" || lower === "tạo đơn nghỉ") return "create_leave";
  if (lower === "create_email" || lower === "soan_email" || lower === "tạo email") return "create_email";
  if (lower === "cancel" || lower === "huy_bo" || lower === "không" || lower === "không, cảm ơn" || lower === "hủy") return "cancel";

  // Natural language
  if (lower.includes("tạo đơn") || lower.includes("đơn nghỉ") || lower.includes("gửi đơn")) return "create_leave";
  if (lower.includes("tạo email") || lower.includes("soạn email") || lower.includes("gửi email") || lower.includes("email")) return "create_email";
  if (lower.includes("không") || lower.includes("thôi") || lower.includes("cancel") || lower.includes("hủy")) return "cancel";

  // Yes/OK
  if (lower === "yes" || lower === "ok" || lower === "có" || lower === "đồng ý" || lower === "ừ") return "create_leave";

  return null;
}

module.exports = { getSession, setWaitingConfirmation, clearSession, isWaitingConfirmation, parseConfirmation };

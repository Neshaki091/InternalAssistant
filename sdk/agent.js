/**
 * InternalAssistant Agent SDK — Embeddable Chat Widget
 *
 * Embed with:
 *   <script
 *     src="http://localhost:4000/sdk/agent.js"
 *     data-client-id="demo-001"
 *     data-api="http://localhost:4000/api/chat"
 *   ></script>
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var CLIENT_ID = (script && script.getAttribute("data-client-id")) || "demo-001";
  var API = (script && script.getAttribute("data-api")) || "/api/chat";
  var BRAND = (script && script.getAttribute("data-color")) || "#FF5733";
  var BOT = (script && script.getAttribute("data-name")) || "InternalAssistant";

  var sid = "s-" + Math.random().toString(36).slice(2, 8);

  // Inject CSS
  (function () {
    var src = (script && script.src) || "";
    var css = src.replace(/agent\.js(\?.*)?$/, "agent.css");
    if (css && css !== src) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = css;
      document.head.appendChild(link);
    }
    document.documentElement.style.setProperty("--ta-brand", BRAND);
  })();

  // Icons
  var ICO = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  };

  // Build UI
  function build() {
    var root = document.createElement("div");
    root.className = "ta-root";

    // Bubble
    var bbl = document.createElement("button");
    bbl.className = "ta-bbl";
    bbl.innerHTML = ICO.chat;

    // Window
    var win = document.createElement("div");
    win.className = "ta-win";
    win.innerHTML =
      '<div class="ta-hdr">' +
        '<div class="ta-hdr-info"><div class="ta-av">🤖</div><div><div class="ta-name">' + BOT + '</div><div class="ta-status">Online</div></div></div>' +
        '<button class="ta-cls">' + ICO.x + '</button>' +
      '</div>' +
      '<div class="ta-msgs" id="ta-msgs">' +
        '<div class="ta-welcome">' +
          '<div class="ta-wicon">🤖</div>' +
          '<div class="ta-wtitle">Chào mừng bạn!</div>' +
          '<div class="ta-wsub">Tôi có thể giúp bạn xin nghỉ phép, kiểm duyệt nội dung, và nhiều hơn nữa.</div>' +
          '<div class="ta-chips">' +
            '<button class="ta-chip" data-msg="Tôi muốn xin nghỉ phép">📋 Xin nghỉ phép</button>' +
            '<button class="ta-chip" data-msg="Kiểm duyệt nội dung: test spam content">🛡️ Kiểm duyệt</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ta-bar">' +
        '<input type="text" class="ta-inp" placeholder="Nhập tin nhắn..." autocomplete="off"/>' +
        '<button class="ta-snd" disabled>' + ICO.send + '</button>' +
      '</div>';

    root.appendChild(bbl);
    root.appendChild(win);
    document.body.appendChild(root);
    return { bbl: bbl, win: win };
  }

  // Messages
  function addMsg(box, text, who) {
    var w = box.querySelector(".ta-welcome");
    if (w) w.remove();

    var m = document.createElement("div");
    m.className = "ta-m ta-" + who;
    m.innerHTML = text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
    box.appendChild(m);
    box.scrollTop = box.scrollHeight;
  }

  function typing(box, show) {
    var existing = document.getElementById("ta-typing");
    if (existing) existing.remove();
    if (!show) return;
    var d = document.createElement("div");
    d.className = "ta-typing";
    d.id = "ta-typing";
    d.innerHTML = "<span></span><span></span><span></span>";
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
  }

  function addActions(box, actions) {
    var wrapper = document.createElement("div");
    wrapper.className = "ta-actions";
    for (var i = 0; i < actions.length; i++) {
      var btn = document.createElement("button");
      btn.className = "ta-action";
      btn.textContent = actions[i].label;
      btn.setAttribute("data-value", actions[i].value);
      wrapper.appendChild(btn);
    }
    box.appendChild(wrapper);
    box.scrollTop = box.scrollHeight;
  }

  function send(text, box) {
    if (!text.trim()) return Promise.resolve();
    addMsg(box, text, "u");
    // Remove any existing action buttons
    var oldActions = box.querySelectorAll(".ta-actions");
    for (var i = 0; i < oldActions.length; i++) oldActions[i].remove();
    typing(box, true);

    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: CLIENT_ID, message: text, sessionId: sid }),
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      typing(box, false);
      addMsg(box, d.output || d.error || "Không có phản hồi.", "b");
      // Render action buttons if present
      if (d.actions && d.actions.length > 0) {
        addActions(box, d.actions);
      }
    })
    .catch(function (e) {
      typing(box, false);
      addMsg(box, "⚠️ Không thể kết nối server.", "b");
      console.error("[Agent SDK]", e);
    });
  }

  // Events
  function wire(refs) {
    var bbl = refs.bbl, win = refs.win;
    var box = win.querySelector(".ta-msgs");
    var inp = win.querySelector(".ta-inp");
    var snd = win.querySelector(".ta-snd");

    bbl.addEventListener("click", function () {
      var open = win.classList.toggle("ta-open");
      bbl.innerHTML = open ? ICO.x : ICO.chat;
      bbl.classList.toggle("ta-active", open);
      if (open) inp.focus();
    });

    win.querySelector(".ta-cls").addEventListener("click", function () {
      win.classList.remove("ta-open");
      bbl.classList.remove("ta-active");
      bbl.innerHTML = ICO.chat;
    });

    var doSend = function () {
      var t = inp.value.trim();
      if (!t) return;
      inp.value = "";
      snd.disabled = true;
      send(t, box).then(function () { inp.focus(); });
    };

    snd.addEventListener("click", doSend);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
    inp.addEventListener("input", function () { snd.disabled = !inp.value.trim(); });

    // Quick-action chips + action buttons
    win.addEventListener("click", function (e) {
      var chip = e.target.closest(".ta-chip");
      if (chip) {
        var msg = chip.getAttribute("data-msg");
        if (msg) { inp.value = msg; doSend(); }
      }
      var action = e.target.closest(".ta-action");
      if (action) {
        var val = action.getAttribute("data-value");
        if (val) { inp.value = val; doSend(); }
      }
    });
  }

  // Init
  function init() {
    var refs = build();
    wire(refs);
    console.log("[InternalAssistant Agent] Ready | client=" + CLIENT_ID + " api=" + API);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

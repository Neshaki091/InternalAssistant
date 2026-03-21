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
  var STATE_KEY = "ia-state-" + CLIENT_ID;

  var sid = "s-" + Math.random().toString(36).slice(2, 8);
  var state = { open: false, msgs: [], sid: sid };
  
  // Load State
  try {
    var savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
      var parsed = JSON.parse(savedState);
      state = parsed;
      sid = state.sid || sid;
    }
  } catch(e) {}

  function persist() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e) {}
  }

  var recognition = null;
  var agora = { client: null, localAudio: null, isJoined: false };
  
  // Settings Config
  var cfg = { lang: 'vi-VN', speak: true };
  try {
    var savedCfg = localStorage.getItem("ta-cfg");
    if (savedCfg) cfg = JSON.parse(savedCfg);
  } catch(e) {}

  function speak(text) {
    if (!cfg.speak || !('speechSynthesis' in window)) return;
    var cleanText = text.replace(/[*#`]/g, "").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
    var msg = new SpeechSynthesisUtterance(cleanText);
    msg.lang = cfg.lang; 
    window.speechSynthesis.speak(msg);
  }

  // Inject Agora SDK
  (function() {
    var s = document.createElement("script");
    s.src = "https://download.agora.io/sdk/release/AgoraRTC_N.js";
    s.onload = function() { console.log("[Agent SDK] Agora SDK Loaded"); };
    document.head.appendChild(s);
  })();
  
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
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  };

  // Build UI
  function build() {
    var root = document.createElement("div");
    root.className = "ta-root";

    // Bubble
    var bbl = document.createElement("button");
    bbl.className = "ta-bbl";
    if (state.open) {
      bbl.innerHTML = ICO.x;
      bbl.classList.add("ta-active");
    } else {
      bbl.innerHTML = ICO.chat;
    }

    // Window
    var win = document.createElement("div");
    win.className = "ta-win";
    if (state.open) win.classList.add("ta-open");
    
    win.innerHTML =
      '<div class="ta-hdr">' +
        '<div class="ta-hdr-info"><div class="ta-av">🤖</div><div><div class="ta-name">' + BOT + '</div><div class="ta-status">Online</div></div></div>' +
        '<div style="display:flex;align-items:center;">' +
          '<button class="ta-set-btn" title="Cài đặt">' + ICO.settings + '</button>' +
          '<button class="ta-cls">' + ICO.x + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="ta-set-pan">' +
        '<div class="ta-set-hdr">Cài đặt Trợ lý</div>' +
        '<div class="ta-set-row">' +
          '<div><div class="ta-set-label">Ngôn ngữ</div><div class="ta-set-desc">Áp dụng cho cả STT & TTS</div></div>' +
          '<div class="ta-set-opts">' +
            '<button class="ta-set-opt ' + (cfg.lang==='vi-VN'?'ta-active':'') + '" data-lang="vi-VN">VI</button>' +
            '<button class="ta-set-opt ' + (cfg.lang==='en-US'?'ta-active':'') + '" data-lang="en-US">EN</button>' +
          '</div>' +
        '</div>' +
        '<div class="ta-set-row">' +
          '<div><div class="ta-set-label">Giọng nói (TTS)</div><div class="ta-set-desc">Cho phép bot tự động đọc</div></div>' +
          '<div class="ta-set-sw ' + (cfg.speak?'ta-active':'') + '" id="ta-speak-sw"></div>' +
        '</div>' +
        '<div class="ta-set-row" style="margin-top:20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:10px;">' +
           '<button class="ta-clear-btn" style="width:100%; padding:8px; background:rgba(255,0,0,0.1); border:1px solid rgba(255,0,0,0.2); color:#ff4444; border-radius:8px; cursor:pointer; font-size:12px;">Xóa lịch sử trò chuyện</button>' +
        '</div>' +
      '</div>' +
      '<div class="ta-msgs" id="ta-msgs"></div>' +
      '<div class="ta-bar">' +
        '<button class="ta-mic" title="Voice to Voice">' + ICO.mic + '</button>' +
        '<input type="text" class="ta-inp" placeholder="Nhập tin nhắn..." autocomplete="off"/>' +
        '<button class="ta-snd" disabled>' + ICO.send + '</button>' +
      '</div>';

    var box = win.querySelector(".ta-msgs");
    
    // Restore Messages
    if (state.msgs.length === 0) {
      box.innerHTML = 
        '<div class="ta-welcome">' +
          '<div class="ta-wicon">🤖</div>' +
          '<div class="ta-wtitle">Chào mừng bạn!</div>' +
          '<div class="ta-wsub">Tôi có thể giúp bạn xin nghỉ phép, kiểm duyệt nội dung, và nhiều hơn nữa.</div>' +
          '<div class="ta-chips">' +
            '<button class="ta-chip" data-msg="Tôi muốn xin nghỉ phép">📋 Xin nghỉ phép</button>' +
            '<button class="ta-chip" data-msg="Kiểm duyệt nội dung: test spam content">🛡️ Kiểm duyệt</button>' +
          '</div>' +
        '</div>';
    } else {
      state.msgs.forEach(function(m) {
        addMsg(box, m.text, m.who, true);
        if (m.actions) addActions(box, m.actions, true);
      });
    }

    root.appendChild(bbl);
    root.appendChild(win);
    document.body.appendChild(root);
    return { bbl: bbl, win: win };
  }

  // Messages
  function addMsg(box, text, who, skipPersist) {
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

    if (!skipPersist) {
      state.msgs.push({ text: text, who: who });
      persist();
    }
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

  function addActions(box, actions, skipPersist) {
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

    if (!skipPersist && state.msgs.length > 0) {
      state.msgs[state.msgs.length - 1].actions = actions;
      persist();
    }
  }

  function send(text, box) {
    if (!text.trim()) return Promise.resolve();
    addMsg(box, text, "u");
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
      var output = d.output || d.error || "Không có phản hồi.";
      addMsg(box, output, "b");
      if (d.actions && d.actions.length > 0) addActions(box, d.actions);
      speak(output);
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
    var mic = win.querySelector(".ta-mic");

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'vi-VN';

      recognition.onstart = function() {
        mic.classList.add("ta-recording");
        inp.placeholder = "Đang lắng nghe...";
      };

      recognition.onresult = function(event) {
        var text = event.results[0][0].transcript;
        inp.value = text;
        mic.classList.remove("ta-recording");
        inp.placeholder = "Nhập tin nhắn...";
        doSend();
      };

      recognition.onerror = function() {
        mic.classList.remove("ta-recording");
        inp.placeholder = "Lỗi microphone...";
      };

      recognition.onend = function() {
        mic.classList.remove("ta-recording");
        inp.placeholder = "Nhập tin nhắn...";
      };
    }

    bbl.addEventListener("click", function () {
      var open = win.classList.toggle("ta-open");
      bbl.innerHTML = open ? ICO.x : ICO.chat;
      bbl.classList.toggle("ta-active", open);
      state.open = open;
      persist();
      if (open) {
        inp.focus();
        box.scrollTop = box.scrollHeight;
      }
    });

    win.querySelector(".ta-cls").addEventListener("click", function () {
      win.classList.remove("ta-open");
      bbl.classList.remove("ta-active");
      bbl.innerHTML = ICO.chat;
      state.open = false;
      persist();
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

    async function joinAgora() {
      if (!window.AgoraRTC) return;
      if (agora.isJoined) return;
      try {
        if (!agora.client) agora.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        var tokenRes = await fetch("/api/voice/token?channelName=internal-assistant&uid=0");
        var tokenData = await tokenRes.json();
        await agora.client.join(tokenData.appId, tokenData.channelName, tokenData.token, null);
        agora.localAudio = await AgoraRTC.createMicrophoneAudioTrack();
        await agora.client.publish([agora.localAudio]);
        agora.isJoined = true;
      } catch (e) { console.error("[Agent SDK] Agora Error:", e); }
    }

    async function leaveAgora() {
      if (!agora.isJoined) return;
      try {
        if (agora.localAudio) { agora.localAudio.close(); agora.localAudio = null; }
        if (agora.client) await agora.client.leave();
        agora.isJoined = false;
      } catch (e) { console.error("[Agent SDK] Agora Leave Error:", e); }
    }

    mic.addEventListener("click", function () {
      if (!recognition) { alert("Trình duyệt không hỗ trợ nhận diện giọng nói."); return; }
      if (mic.classList.contains("ta-recording")) { recognition.stop(); leaveAgora(); }
      else { recognition.start(); joinAgora(); }
    });

    var setBtn = win.querySelector(".ta-set-btn");
    var setPan = win.querySelector(".ta-set-pan");
    setBtn.addEventListener("click", function() { setPan.classList.toggle("ta-open"); });

    setPan.addEventListener("click", function(e) {
      var opt = e.target.closest(".ta-set-opt");
      if (opt) {
        var l = opt.getAttribute("data-lang");
        cfg.lang = l;
        setPan.querySelectorAll(".ta-set-opt").forEach(function(b) { b.classList.remove("ta-active"); });
        opt.classList.add("ta-active");
        if (recognition) recognition.lang = l;
        localStorage.setItem("ta-cfg", JSON.stringify(cfg));
      }
      var sw = e.target.closest(".ta-set-sw");
      if (sw) {
        cfg.speak = !cfg.speak;
        sw.classList.toggle("ta-active", cfg.speak);
        localStorage.setItem("ta-cfg", JSON.stringify(cfg));
      }
      var clr = e.target.closest(".ta-clear-btn");
      if (clr) {
        if (confirm("Xóa lịch sử trò chuyện?")) {
          state.msgs = [];
          persist();
          location.reload();
        }
      }
    });

    if (recognition) recognition.lang = cfg.lang;

    win.addEventListener("click", function (e) {
      var chip = e.target.closest(".ta-chip");
      if (chip) { var msg = chip.getAttribute("data-msg"); if (msg) { inp.value = msg; doSend(); } }
      var action = e.target.closest(".ta-action");
      if (action) { var val = action.getAttribute("data-value"); if (val) { inp.value = val; doSend(); } }
    });
  }

  function init() {
    var refs = build();
    wire(refs);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

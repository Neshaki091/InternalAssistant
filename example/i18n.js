(function () {
  const translations = {
    vi: {
      nav_demo: "Demo",
      nav_upload: "Upload",
      nav_tech: "Công nghệ",
      nav_about: "Về dự án",
      hero_title: "InternalAssistant",
      hero_tagline: "Trợ lý AI bóc tách ý định (Intent Parsing) & Tự động hóa quy trình chuyên nghiệp. <br>Sẵn sàng cho mọi nền tảng doanh nghiệp.",
      demo_guide_title: "🏆 Demo Script (Kịch bản trình diễn)",
      demo_guide_desc: "Copy và paste câu lệnh dưới đây vào khung chat (góc dưới phải) để thấy sự khác biệt của InternalAssistant:",
      demo_script_text: "tôi tên là Nguyễn Văn A, ID 2201231231, xin nghỉ phép 2 ngày từ ngày 22/3 đến 23/3 vì lý do công việc gia đình",
      feat_triple: "✅ **Triple-Check Extraction**: Tự động nhận diện Tên, ID, Ngày và Lý do chính xác 100%.",
      feat_hallucination: "✅ **Zero-Hallucination**: Đảm bảo tên không bao giờ bị AI thay đổi.",
      feat_resiliency: "✅ **Local-First Resiliency**: Tạo bản thảo email chuyên nghiệp ngay cả khi n8n ngoại tuyến.",
      feat_leave_title: "Leave Requests",
      feat_leave_desc: "Bóc tách dữ liệu nhân sự phức tạp và tạo đơn nghỉ phép tự động với độ chính xác tuyệt đối.",
      feat_rag_title: "Policy RAG",
      feat_rag_desc: "Truy vấn quy định công ty trực tiếp từ văn bản .docx thông qua hệ thống Knowledge Base.",
      feat_intent_title: "AI Intent Parsing",
      feat_intent_desc: "Sử dụng mô hình Hybrid (TinyFish + Gemma 3) để xử lý ý định người dùng tức thì.",
      feat_voice_title: "Voice to Voice",
      feat_voice_desc: "Hỗ trợ đàm thoại thời gian thực bằng Agora SDK, biến Trợ lý thành một thực thể sống động.",
      cta_config_title: "Cấu hình & Tích hợp",
      cta_config_desc: "Bấm vào đây để xem cách nạp quy định và nhúng SDK vào website của bạn.",
      copy_hint: "💡 Thử gõ: <strong>\"xin nghỉ phép\"</strong> · <strong>\"kiểm duyệt nội dung spam\"</strong> ở khung chat ↘",
      about_h1: "Cách mạng hóa<br>Quy trình Nội bộ với AI",
      about_p1: "Hệ thống trợ lý ảo thông minh giúp tự động hóa đơn từ, giải đáp chính sách và kiểm duyệt nội dung — giúp doanh nghiệp vận hành trôi chảy hơn bao giờ hết.",
      about_cta_demo: "Dùng thử Demo 🚀",
      about_cta_more: "Tìm hiểu thêm",
      about_video_title: "🎬 Xem Video Demo Thực Tế",
      about_video_desc: "Khám phá toàn bộ quy trình từ giới thiệu đến thao tác kỹ thuật chỉ trong 1 phút.",
      about_feats_title: "Tính năng cốt lõi",
      about_feats_sub: "Giải pháp toàn diện cho nhân sự và vận hành doanh nghiệp.",
      about_f_rag: "AI tự động học từ các file quy định PDF/Word của công ty. Nhân viên hỏi, AI trả lời chính xác theo đúng tài liệu nội bộ.",
      about_f_auto: "Hỗ trợ xin nghỉ phép... chỉ bằng cách chat. Tự động kết nối với Google Sheets và Gmail qua n8n.",
      about_f_mod: "Tự động phát hiện và cảnh báo các nội dung không phù hợp, spam hoặc độc hại trong môi trường làm việc.",
      about_f_saas: "Kiến trúc multi-tenant cho phép quản lý hàng ngàn công ty trên một nền tảng, cách biệt dữ liệu.",
      about_f_web: "Dễ dàng kết nối với các hệ thống bên thứ ba như n8n, Zapier để thực thi hành động thực tế.",
      about_f_sdk: "Dịch vụ độc lập 100%. Chỉ với một dòng script duy nhất, bạn có thể mang Trợ lý AI vào bất kỳ hệ thống nào.",
      tech_h1: "Kiến trúc Hệ thống & Công nghệ",
      tech_f_gemma_title: "Gemma 3 1B IT (Primary)",
      tech_f_gemma: "Mô hình AI chủ lực cho việc soạn thảo Email và tóm tắt quy định. Đảm bảo độ trễ thấp (<1s) và không ảo giác.",
      tech_f_tiny_title: "TinyFish Agentic Broker",
      tech_f_tiny: "Bộ não điều phối ý định (Intent Parser). Xử lý logic nghiệp vụ phức tạp và chuyển đổi linh hoạt.",
      feat_triple_title: "Triple-Check Extraction",
      tech_f_triple: "Hệ thống 3 lớp (AI + RegEx + Workflow Safety) đảm bảo bóc tách Tên, ID, Ngày và Lý do chính xác tuyệt đối.",
      feat_voice_title: "Agora Web SDK",
      tech_f_agora: "Động cơ Voice-to-Voice thời gian thực, mang lại trải nghiệm giao tiếp rảnh tay chuyên nghiệp.",
      feat_sdk_title: "Standalone SDK Core",
      tech_f_sdk: "Kiến trúc tách biệt hoàn toàn (SaaS-Ready). Widget có khả năng nhúng vào bất kỳ website nào.",
      tech_f_n8n_title: "n8n Local-First Hub",
      tech_f_n8n: "Tận dụng n8n cho việc đồng bộ dữ liệu, nhưng vẫn đảm bảo mượt mà bằng logic xử lý tại chỗ.",
      tech_flow_title: "🎛️ Data Flow Architecture"
    },
    en: {
      nav_demo: "Demo",
      nav_upload: "Upload",
      nav_tech: "Tech",
      nav_about: "About",
      hero_title: "InternalAssistant",
      hero_tagline: "AI-Powered Intent Parsing & Professional Workflow Automation. <br>Ready for any enterprise platform.",
      demo_guide_title: "🏆 Demo Script (Presentation Guide)",
      demo_guide_desc: "Copy and paste the command below into the chat box (bottom right) to see the difference:",
      demo_script_text: "My name is Nguyen Van A, ID 2201231231, I'd like to request 2 days off from 22/3 to 23/3 for family reasons",
      feat_triple: "✅ **Triple-Check Extraction**: Auto-identify Name, ID, Dates, and Reason with 100% accuracy.",
      feat_hallucination: "✅ **Zero-Hallucination**: Ensures employee names are never altered by AI.",
      feat_resiliency: "✅ **Local-First Resiliency**: Generates professional email drafts even when n8n is offline.",
      feat_leave_title: "Leave Requests",
      feat_leave_desc: "Decouple complex HR data and create leave requests automatically with absolute precision.",
      feat_rag_title: "Policy RAG",
      feat_rag_desc: "Query company regulations directly from .docx files via a robust Knowledge Base.",
      feat_intent_title: "AI Intent Parsing",
      feat_intent_desc: "Leveraging Hybrid model (TinyFish + Gemma 3) to process user intent instantly.",
      feat_voice_title: "Voice to Voice",
      feat_voice_desc: "Real-time voice conversation powered by Agora SDK, making the Assistant feel alive.",
      about_h1: "Revolutionizing<br>Internal Workflows with AI",
      about_p1: "Intelligent virtual assistant system that automates forms, policy queries, and content moderation — helping businesses run smoother than ever.",
      about_cta_demo: "Try Demo 🚀",
      about_cta_more: "Learn More",
      about_video_title: "🎬 Watch Real Demo Video",
      about_video_desc: "Explore the full process from introduction to technical operation in just 1 minute.",
      about_feats_title: "Core Features",
      about_feats_sub: "Comprehensive solution for HR and business operations.",
      about_f_rag: "AI automatically learns from your PDF/Word policy files. Employees ask, AI answers accurately based on documents.",
      about_f_auto: "Support leave requests... just by chatting. Automatically connect with Google Sheets and Gmail via n8n.",
      about_f_mod: "Automatically detect and warn against inappropriate content, spam, or toxic language in the workplace.",
      about_f_saas: "Multi-tenant architecture allowing management of thousands of companies on one platform with data isolation.",
      about_f_web: "Easily connect with third-party systems like n8n, Zapier to execute real-world actions.",
      about_f_sdk: "100% independent service. With just a single script tag, you can bring the AI Assistant to any system.",
      tech_h1: "System Architecture & Technology",
      tech_f_gemma_title: "Gemma 3 1B IT (Primary)",
      tech_f_gemma: "Primary AI model for Email drafting and policy summaries. Ensures low latency (<1s) and no hallucinations.",
      tech_f_tiny_title: "TinyFish Agentic Broker",
      tech_f_tiny: "Orchestrator brain (Intent Parser). Processes complex business logic and switches workflows flexibly.",
      feat_triple_title: "Triple-Check Extraction",
      tech_f_triple: "3-layer system (AI + RegEx + Workflow Safety) ensuring absolute precision for Name, ID, Dates, and Reasons.",
      feat_voice_title: "Agora Web SDK",
      tech_flow_title: "🎛️ Data Flow Architecture",
      tech_f_agora: "Real-time Voice-to-Voice engine, providing a hands-free professional communication experience.",
      feat_sdk_title: "Standalone SDK Core",
      tech_f_sdk: "Completely decoupled architecture (SaaS-Ready). Widget can be embedded into any website via 1 line of script.",
      tech_f_n8n_title: "n8n Local-First Hub",
      tech_f_n8n: "Leverages n8n for data sync, but remains smooth via local fallback processing logic.",
      cta_config_title: "Config & Integration",
      cta_config_desc: "Click here to see how to load regulations and embed the SDK into your website.",
      copy_hint: "💡 Hint: Try typing <strong>\"xin nghỉ phép\"</strong> · <strong>\"content moderation\"</strong> in the chat↘",
    }
  };

  function applyLanguage(lang) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang] && translations[lang][key]) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
           el.placeholder = translations[lang][key];
        } else {
           el.innerHTML = translations[lang][key];
        }
      }
    });

    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });

    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("demo-lang", lang);
    window.dispatchEvent(new CustomEvent("lang-change", { detail: lang }));
  }

  function renderNavbar() {
    let container = document.getElementById("navbar-mount");
    if (!container) return;

    const currentPath = window.location.pathname;
    const isIndex = currentPath.endsWith("index.html") || currentPath.endsWith("/") || (!currentPath.includes(".html") && currentPath.length < 5);
    const isAbout = currentPath.includes("about.html");
    const isTech = currentPath.includes("tech-stack.html");

    container.innerHTML = `
      <div class="universal-nav">
        <div class="nav-left">
          <a href="./index.html" class="nav-logo">🛡️ InternalAssistant</a>
        </div>
        <div class="nav-links">
          <a href="./index.html" class="nav-item ${isIndex ? 'active' : ''}" data-i18n="nav_demo">Demo</a>
          <a href="./about.html" class="nav-item ${isAbout ? 'active' : ''}" data-i18n="nav_about">Về dự án</a>
          <a href="./tech-stack.html" class="nav-item ${isTech ? 'active' : ''}" data-i18n="nav_tech">Công nghệ</a>
          <div id="lang-switcher-mount" class="lang-switcher">
            <button class="lang-btn" data-lang="vi">VN</button>
            <button class="lang-btn" data-lang="en">EN</button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll(".lang-btn").forEach(btn => {
      btn.addEventListener("click", () => applyLanguage(btn.getAttribute("data-lang")));
    });

    // Inject styles for universal nav
    if (!document.getElementById("universal-nav-styles")) {
      const style = document.createElement("style");
      style.id = "universal-nav-styles";
      style.innerHTML = `
        .universal-nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 5%; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.05); position: sticky; top: 0; z-index: 1000; }
        .nav-logo { font-weight: 800; font-size: 18px; color: #fff; text-decoration: none; display: flex; align-items: center; gap: 10px; }
        .nav-links { display: flex; align-items: center; gap: 20px; }
        .nav-item { color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500; transition: 0.3s; }
        .nav-item:hover, .nav-item.active { color: #fff; }
        .nav-item.active { border-bottom: 2px solid var(--accent, #FF5733); padding-bottom: 5px; }
        .lang-switcher { display: flex; gap: 5px; background: rgba(255,255,255,0.05); padding: 3px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); margin-left: 10px; }
        .lang-btn { padding: 4px 10px; border-radius: 15px; border: none; background: transparent; color: #fff; cursor: pointer; font-size: 10px; font-weight: 700; transition: 0.3s; }
        .lang-btn.active { background: var(--accent, #FF5733) !important; box-shadow: 0 0 10px rgba(255,87,51,0.3); }
      `;
      document.head.appendChild(style);
    }
  }

  function init() {
    renderNavbar();
    const saved = localStorage.getItem("demo-lang") || "vi";
    applyLanguage(saved);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

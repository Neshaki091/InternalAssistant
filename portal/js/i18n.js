export const translations = {
  vi: {
    auth_welcome: "Chào mừng trở lại",
    auth_oauth_sep: "HOẶC DÙNG EMAIL",
    auth_label_company: "Tên công ty",
    auth_label_slug: "Company ID (Slug - Viết liền không dấu)",
    auth_label_email: "Email đăng nhập",
    auth_label_password: "Mật khẩu",
    auth_btn_continue: "Tiếp tục 🚀",
    auth_toggle_no_account: "Chưa có tài khoản?",
    auth_toggle_register: "Đăng ký ngay",
    auth_toggle_has_account: "Đã có tài khoản?",
    auth_toggle_login: "Đăng nhập",
    
    dash_header_title: "InternalAssistant Dashboard",
    dash_logout: "Đăng xuất",
    
    tab_general: "🏢 Cấu hình Company",
    tab_knowledge: "📚 Tài liệu Policy",
    tab_logs: "📜 Lịch sử hoạt động",
    tab_embed: "🔌 Mã nhúng Widget",
    
    cfg_title: "Cấu hình công ty",
    cfg_welcome: "Chào mừng! Vui lòng hoàn tất đăng ký thông tin công ty bên dưới để kích hoạt tài khoản.",
    cfg_label_name: "Tên công ty",
    cfg_label_slug: "Company ID (Slug - Tên miền duy nhất)",
    cfg_label_email: "Email Công ty / Quản lý (Nhận đơn xin nghỉ phép qua Gmail)",
    cfg_label_sheet: "Google Spreadsheet ID (Dành cho ghi log n8n)",
    cfg_btn_save: "Lưu cấu hình 💾",
    cfg_template_title: "📂 File Google Sheet mẫu",
    cfg_template_desc: "Để n8n và AI có thể đọc đúng dữ liệu (ID nhân viên, Số ngày nghỉ), bạn cần đặt tên cột ở Hàng 1 chính xác.",
    cfg_template_download: "📥 Tải File mẫu (.CSV)",
    cfg_template_columns: "Cột yêu cầu: <code>EmployeeId, Employee, Days, ...</code>",
    
    kb_title: "Quản lý Tài liệu (Knowledge Base)",
    kb_desc: "Tải lên các file Policy (Hỗ trợ .docx, .txt). AI sẽ tự học trong tích tắc.",
    kb_label_file: "Tệp tài liệu cần nạp:",
    kb_btn_upload: "Upload & Huấn luyện AI 🚀",
    kb_active_docs: "Tài liệu đang kích hoạt:",
    
    logs_title: "Lịch sử hoạt động",
    logs_desc: "Giám sát toàn bộ tương tác và yêu cầu từ nhân viên thông qua Chatbot.",
    logs_leave_title: "📄 Đơn nghỉ phép (Gửi qua n8n)",
    logs_mod_title: "🛡️ Kiểm duyệt nội dung (AI Moderation)",
    logs_th_employee: "Nhân viên",
    logs_th_type: "Loại",
    logs_th_start: "Ngày bắt đầu",
    logs_th_status: "Trạng thái",
    logs_th_content: "Nội dung vi phạm / Cảnh báo",
    logs_th_result: "Kết quả",
    logs_th_details: "Chi tiết Flags",
    logs_empty_leave: "Chưa có đơn nghỉ phép",
    logs_empty_mod: "Chưa có vi phạm",
    logs_error: "Lỗi tải dữ liệu",
    
    embed_title: "Mã nhúng SDK",
    embed_desc: "Copy đoạn mã script này và dán vào trước thẻ <code>&lt;/body&gt;</code> trong website của công ty bạn.",
    embed_copy_btn: "Copy",
    embed_copied: "Đã copy!",
    
    loader_loading: "Đang tải hệ thống...",
    loader_processing: "Đang xử lý...",
    loader_saving: "Lưu cấu hình...",
    loader_ingesting: "AI đang nạp tài liệu...",
    
    msg_update_success: "✅ Đã cập nhật thành công!",
    msg_ingest_success: "✅ Đã nạp kiến thức thành công!",
    msg_cfg_required: "Vui lòng lưu cấu hình công ty trước!",
    msg_no_docs: "Chưa có tài liệu nào."
  },
  en: {
    auth_welcome: "Welcome Back",
    auth_oauth_sep: "OR USE EMAIL",
    auth_label_company: "Company Name",
    auth_label_slug: "Company ID (Slug - No spaces/accents)",
    auth_label_email: "Login Email",
    auth_label_password: "Password",
    auth_btn_continue: "Continue 🚀",
    auth_toggle_no_account: "No account?",
    auth_toggle_register: "Register now",
    auth_toggle_has_account: "Already have an account?",
    auth_toggle_login: "Login",
    
    dash_header_title: "InternalAssistant Dashboard",
    dash_logout: "Logout",
    
    tab_general: "🏢 Company Config",
    tab_knowledge: "📚 Policy Knowledge",
    tab_logs: "📜 Activity Logs",
    tab_embed: "🔌 Embed Widget",
    
    cfg_title: "Company Configuration",
    cfg_welcome: "Welcome! Please complete your company registration below to activate your account.",
    cfg_label_name: "Company Name",
    cfg_label_slug: "Company ID (Slug - Unique Name)",
    cfg_label_email: "Company/Manager Email (Receive requests via Gmail)",
    cfg_label_sheet: "Google Spreadsheet ID (For n8n logging)",
    cfg_btn_save: "Save Config 💾",
    cfg_template_title: "📂 Google Sheet Template",
    cfg_template_desc: "To ensure n8n and AI read data correctly (Employee ID, Leave Days), please use the exact column names in Row 1.",
    cfg_template_download: "📥 Download Template (.CSV)",
    cfg_template_columns: "Required Columns: <code>EmployeeId, Employee, Days, ...</code>",
    
    kb_title: "Knowledge Base Management",
    kb_desc: "Upload policy files (.docx, .txt). AI will learn them instantly.",
    kb_label_file: "Document file to ingest:",
    kb_btn_upload: "Upload & Train AI 🚀",
    kb_active_docs: "Actively training on:",
    
    logs_title: "Activity History",
    logs_desc: "Monitor all interactions and employee requests via the Chatbot.",
    logs_leave_title: "📄 Leave Requests (Sent via n8n)",
    logs_mod_title: "🛡️ AI Content Moderation",
    logs_th_employee: "Employee",
    logs_th_type: "Type",
    logs_th_start: "Start Date",
    logs_th_status: "Status",
    logs_th_content: "Violated Content / Warning",
    logs_th_result: "Result",
    logs_th_details: "Flag Details",
    logs_empty_leave: "No leave requests found",
    logs_empty_mod: "No violations found",
    logs_error: "Error loading data",
    
    embed_title: "SDK Embed Code",
    embed_desc: "Copy this script tag and paste it before the <code>&lt;/body&gt;</code> tag in your application.",
    embed_copy_btn: "Copy",
    embed_copied: "Copied!",
    
    loader_loading: "Loading system...",
    loader_processing: "Processing...",
    loader_saving: "Saving config...",
    loader_ingesting: "AI is ingesting documents...",
    
    msg_update_success: "✅ Updated successfully!",
    msg_ingest_success: "✅ Knowledge ingested successfully!",
    msg_cfg_required: "Please save company config first!",
    msg_no_docs: "No documents found."
  }
};

export function applyLanguage(lang) {
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
  localStorage.setItem("portal-lang", lang);
  window.dispatchEvent(new CustomEvent("lang-change", { detail: lang }));
}

export function getCurrentLang() {
  return localStorage.getItem("portal-lang") || "vi";
}

export function t(key) {
  const lang = getCurrentLang();
  return translations[lang][key] || key;
}

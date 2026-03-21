/**
 * Language Helper — Detects EN/VI and provides shared translations.
 */

const VI_CHARS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function detectLang(text) {
  if (!text) return "vi";
  return VI_CHARS.test(text) ? "vi" : "en";
}

const T = {
  vi: {
    leave_policy_title: "📋 **Thông tin quy định nghỉ phép:**",
    leave_request_title: "📝 **Thông tin đơn của bạn:**",
    leave_data_id: "• Mã Data: `Fetch Data từ ID: ",
    leave_used: "• Đã nghỉ: **{days} ngày**",
    leave_start: "• Từ ngày: ",
    leave_end: "• Đến ngày: ",
    leave_requested: "• Xin nghỉ thêm: **{days} ngày**",
    leave_reason: "• Lý do: ",
    leave_next: "**Bạn muốn hệ thống xử lý tiếp như thế nào?**",
    leave_quota_warning: "\n🚨 **CẢNH BÁO QUỸ PHÉP NĂM:**\nAPI Hệ thống ghi nhận bạn đã sử dụng **{used} ngày** phép. Nếu duyệt thêm **{requested} ngày** này, tổng số sẽ là **{total}/12 ngày** (Vượt hạn mức quy định). Hệ thống từ chối tạo đơn nghỉ phép có lương tự động.",
    leave_contiguous_warning: "\n⚠️ **CẢNH BÁO QUY TRÌNH BAO GỒM:**\nBạn đang xin nghỉ **{days} ngày** liên tục, vượt hạn mức liền kề. Phải có sự phê duyệt trực tiếp bằng Email từ Giám đốc. Hệ thống tự động khóa tính năng nộp đơn nhanh.",
    btn_create_leave: "📄 Tạo đơn nghỉ (Quỹ còn lại: {rem})",
    btn_create_email: "✉️ Tạo email",
    btn_cancel: "❌ Không, cảm ơn",
    val_create_leave: "tao_don_nghi",
    val_create_email: "soan_email",
    val_cancel: "huy_bo",
    btn_email_gm: "✉️ Soạn Email gửi Giám đốc",
    btn_email_unpaid: "✉️ Xin nghỉ Không Lương (Gửi Email)",
    confirm_approved: "✅ **Đã gửi đơn xin nghỉ thành công!**\n\nĐơn của bạn đã được gửi qua hệ thống n8n đến quản lý.",
    confirm_email_success: "✅ **Đã soạn email thành công!**\n\nNội dung email đã được AI tự động viết dựa trên yêu cầu của bạn.\n\n👉 **[Bấm vào đây để mở Gmail và Gửi ngay]({link})**",
    error_connect: "⚠️ Không thể kết nối server.",
    rag_not_found: "Xin lỗi, tôi không tìm thấy thông tin liên quan trong quy định của công ty bạn.",
    rag_sys_prompt: "Bạn là trợ lý HR. Dựa trên quy định bên dưới, hãy trả lời câu hỏi của nhân viên bằng ngôn ngữ họ sử dụng ({lang}). Trả lời ngắn gọn, rõ ràng, dùng bullet points. Chỉ tóm tắt thông tin có trong quy định."
  },
  en: {
    leave_policy_title: "📋 **Leave Policy Information:**",
    leave_request_title: "📝 **Your Leave Request Details:**",
    leave_data_id: "• Data ID: `Fetch Data from ID: ",
    leave_used: "• Used Leave: **{days} days**",
    leave_start: "• From: ",
    leave_end: "• To: ",
    leave_requested: "• Additional Leave: **{days} days**",
    leave_reason: "• Reason: ",
    leave_next: "**How would you like to proceed?**",
    leave_quota_warning: "\n🚨 **ANNUAL LEAVE QUOTA WARNING:**\nSystem API recorded **{used} days** used. Adding these **{requested} days** brings the total to **{total}/12 days** (Exceeding limit). Auto-creation of paid leave is disabled.",
    leave_contiguous_warning: "\n⚠️ **PROCESS WARNING:**\nYou are requesting **{days} consecutive days**, exceeding the contiguous limit. Specific approval via Email from the Director is required. Fast-submit feature locked.",
    btn_create_leave: "📄 Create Leave Request (Balance: {rem})",
    btn_create_email: "✉️ Create Email",
    btn_cancel: "❌ No, thanks",
    val_create_leave: "create_leave",
    val_create_email: "create_email",
    val_cancel: "cancel",
    btn_email_gm: "✉️ Draft Email to Director",
    btn_email_unpaid: "✉️ Unpaid Leave (Send Email)",
    confirm_approved: "✅ **Leave Request Sent Successfully!**\n\nYour request has been submitted to management via n8n.",
    confirm_email_success: "✅ **Email Drafted Successfully!**\n\nAI has written the email draft based on your request.\n\n👉 **[Click here to Open Gmail and Send]({link})**",
    error_connect: "⚠️ Unable to connect to server.",
    rag_not_found: "Sorry, I couldn't find relevant information in your company's policies.",
    rag_sys_prompt: "You are an HR Assistant. Based on the policies below, answer the employee's question in the language they used ({lang}). Answer concisely and clearly using bullet points. Only summarize info from the policies."
  }
};

module.exports = { detectLang, T };

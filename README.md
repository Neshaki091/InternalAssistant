# 🌟 Internal AI Assistant — Employee Operations Hub

![Internal Assistant Banner](./assets/banner.png)

**Internal AI Assistant** là giải pháp BaaS (Backend-as-a-Service) toàn diện, giúp doanh nghiệp xây dựng một trợ lý AI thông minh, có khả năng nhúng trực tiếp vào các hệ thống nội bộ để hỗ trợ nhân viên tra cứu thông tin và thực hiện các quy trình tự động hóa một cách nhanh chóng.

---

## 📌 Giới thiệu dự án

Dự án này được xây dựng trong khuôn khổ Hackathon với mục tiêu thu hẹp khoảng cách giữa **kiến thức tĩnh** (tài liệu, chính sách) và **hành động thực tế** (xin nghỉ phép, gửi email, cập nhật báo cáo). 

Thay vì chỉ trả lời câu hỏi, **Internal AI Assistant** có thể hiểu ý định của người dùng và kích hoạt các quy trình làm việc (workflows) trên các công cụ mà doanh nghiệp đang sử dụng như Google Sheets, Gmail thông qua n8n.

---

## 🚀 Tính năng nổi bật

- 🧠 **Anti-Hallucination RAG (Knowledge Base):** Trả lời câu hỏi dựa trên tài liệu nội bộ của công ty với độ chính xác cao, hạn chế tối đa việc AI "nói dối".
- ⚡ **Action-Oriented Intent Parsing:** Tự động nhận diện và phân loại ý định người dùng (ví dụ: "Tôi muốn xin nghỉ phép từ ngày 25 đến 27") để kích hoạt quy trình tương ứng.
- 🔗 **Workflow Automation (n8n Integration):** Kết nối trực tiếp với n8n để thực hiện các hành động thực tế như cập nhật bảng tính, gửi email tự động.
- 🛡️ **AI Content Moderation:** Hệ thống giám sát âm thầm, phát hiện và ngăn chặn các nội dung độc hại hoặc nhạy cảm trong cuộc hội thoại.
- 🏢 **Multi-Tenant Admin Dashboard:** Cho phép quản lý nhiều khách hàng (clientId), mỗi khách hàng có cơ sở kiến thức và cấu hình riêng biệt.
- 🔌 **Zero-friction Integration:** Nhúng trợ lý vào bất kỳ trang web nào chỉ với một thẻ `<script>`.

---

## 🛠️ Công nghệ sử dụng

Dự án được xây dựng với kiến trúc hiện đại, tập trung vào hiệu suất và khả năng mở rộng:

- **AI Engine:** Google Gemini API (`gemma-3-1b-it` & `gemini-embedding-001`).
- **Backend:** Node.js, Express.js.
- **Database & Auth:** Supabase (PostgreSQL with `pgvector`).
- **Automation:** n8n Webhooks.
- **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript.

---

## 📸 Visual Showcase (English)

### 🤖 Intelligent Chatbot Interaction
The embeddable AI assistant can understand complex user intents like leave requests, extract relevant data (dates, reasons), and provide instant policy-based answers.
![AI Chatbot Interaction](./assets/screenshot_chat.png)

### 🔐 Secure Admin Access & Onboarding
A premium, glassmorphism-inspired login and registration system ensures secure access for company administrators.
| Admin Login | Company Registration |
| :---: | :---: |
| ![Login](./assets/screenshot_login.png) | ![Register](./assets/screenshot_register.png) |

### ⚙️ Centralized Management Dashboard
Administrators can easily configure company profiles, manage notification emails, and link Google Sheets for workflow automation.
![Company Configuration](./assets/screenshot_config.png)

### 📚 Knowledge Base & AI Training
A dedicated interface for uploading `.docx` and `.txt` policy documents. The AI processes these files instantly to provide hallucination-free answers.
![Knowledge Base](./assets/screenshot_knowledge.png)

### 📜 Comprehensive Activity Logs
Track all employee interactions, leave requests via n8n, and AI content moderation flags in one centralized location.
![Activity Logs](./assets/screenshot_logs.png)

### 🔌 Seamless SDK Integration
Get your unique `<script>` tag from the dashboard and embed it into any intranet or corporate portal with ease. 
| Dashboard Embed View | Code-level Integration |
| :---: | :---: |
| ![Embed Sidebar](./assets/screenshot_embed.png) | ![Code Integration](./assets/screenshot_code.png) |

---


## 📂 Cấu trúc thư mục

```text
InternalAssistant/
├── assets/             # Tài nguyên hình ảnh, banner
├── portal/             # Giao diện quản trị (Admin Dashboard)
├── sdk/                # Mã nguồn của widget nhúng (agent.js, agent.css)
├── src/                # Logic xử lý chính (Backend)
│   ├── routes/         # Định nghĩa các API endpoints
│   ├── workflows/      # Cấu hình các quy trình tự động hóa
│   ├── ragService.js   # Xử lý Retrieval-Augmented Generation
│   └── intentParser.js # Phân tích ý định người dùng
├── scripts/            # Các script hỗ trợ (ingest dữ liệu)
├── n8n_workflow/       # File export các quy trình n8n
└── server.js           # File khởi chạy server chính
```

---

## ⚙️ Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- Node.js (v18 trở lên)
- Tài khoản Supabase
- Gemini API Key

### 2. Cài đặt các phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example` và điền đầy đủ các thông tin:
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

### 4. Khởi chạy dự án
```bash
# Chế độ phát triển
npm run dev

# Chế độ Production
npm start
```

---

## 🖥️ Cách sử dụng

1. **Ingest dữ liệu:** Sử dụng script trong thư mục `scripts` để tải các chính sách công ty lên Vector Database.
2. **Quản trị:** Truy cập vào `portal/index.html` để quản lý các client, theo dõi log chat và cấu hình hệ thống.
3. **Nhúng Widget:** Thêm đoạn mã sau vào trang web của bạn:
   ```html
   <link rel="stylesheet" href="path/to/sdk/agent.css">
   <script src="path/to/sdk/agent.js" data-client-id="YOUR_CLIENT_ID"></script>
   ```

---

## 🌟 Đội ngũ phát triển

Dự án được thực hiện với niềm đam mê nâng cao trải nghiệm nhân viên thông qua sức mạnh của AI.

---

*© 2026 Internal Assistant Project. Built for Hackathon.*

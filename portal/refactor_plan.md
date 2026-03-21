# Portal Refactoring Plan

Mục tiêu: Đập đi xây lại thư mục `portal` thành một Single Page Application (SPA) chuyên nghiệp, dễ bảo trì, và đầy đủ chức năng SaaS.

## Hiện trạng
- `dashboard.html`: File khổng lồ, chứa cả CSS, JS, Auth, Config, Upload, Logs. Rất khó maintain và mở rộng.
- `index.html`: Cũ, không còn dùng nhiều sau khi có `dashboard.html`.

## Proposed Architecture (Vanilla SPA)
Chúng ta sẽ chia nhỏ cấu trúc thư mục `portal` như sau:
```
portal/
├── index.html        (Entry point duy nhất)
├── css/
│   ├── style.css     (Base styles, variables)
│   ├── auth.css      (Styles cho màn đăng nhập/đăng ký)
│   └── dashboard.css (Styles cho giao diện chính)
├── js/
│   ├── app.js        (Core router, Supabase init, State management)
│   ├── auth.js       (Logic đăng nhập, đăng ký, OAuth)
│   └── api.js        (Các hàm call backend / Supabase)
└── components/       (HTML templates)
    ├── auth.html
    ├── sidebar.html
    ├── tab-config.html
    ├── tab-knowledge.html
    └── tab-logs.html
```

## Chức năng cần đảm bảo
1. **Authentication**:
   - Đăng nhập/Đăng ký Email.
   - Login bằng Google/GitHub.
   - Tự động detect user mới qua OAuth và bắt buộc nhập MÃ CÔNG TY (Slug).
2. **Dashboard Management**:
   - Tab 1: Cấu hình thông tin Công ty (Tên, Slug không đổi, ID Google Sheet).
   - Tab 2: Quản lý Knowledge Base (Upload file `.docx`, xem danh sách file đã nạp).
   - Tab 3: Lịch sử hoạt động (Logs từ chatbot và n8n).
   - Tab 4: Sinh mã nhúng Widget (SDK).
3. **Routing**:
   - Chuyển tab mượt mà không load lại trang.

## Implementation Steps
1. **Setup thư mục**: Tạo các file CSS và JS tách biệt.
2. **Viết `index.html` mới**: Chứa layout shell (container rỗng chờ JS render).
3. **Phát triển `app.js`**: Viết router đơn giản để chuyển đổi giữa màn hình Auth và Dashboard.
4. **Tách Component**: Di chuyển các đoạn HTML từ `dashboard.html` cũ vào các hàm render trong JS.
5. **Testing**: Đảm bảo toàn bộ luồng Auth, Configure, và Upload hoạt động chuẩn chỉ.

## Verification
- Reload trang vẫn giữ trạng thái đăng nhập.
- OAuth user bị chặn ở màn cấu hình cho đến khi nhập Slug.
- Tab Logs gọi API đúng tham số Client ID.

# MTEC Operations Hub 🚀

**MTEC Operations Hub** là hệ thống nền tảng (portal) toàn diện phục vụ công tác quản lý nhân sự, vận hành, tài chính và cơ sở vật chất dành riêng cho Ban Điều Hành CLB MTEC (NTTU). Hệ thống được phát triển với giao diện tối giản, hiện đại và chuẩn mực.

---

## 🌟 Tính Năng Nổi Bật

### 📊 1. Dashboard (Tổng quan hệ thống)
- Hiển thị các chỉ số (metrics) cốt lõi: Tổng thành viên, quỹ hiện tại, tài sản cần bảo trì, đơn từ cần duyệt.
- Tích hợp biểu đồ thống kê cơ cấu thành viên theo ban (Truyền thông, Công nghệ, Vận hành, Chủ nhiệm).
- Hoạt động gần đây và **AI Insight** hỗ trợ phân tích nhanh xu hướng hoạt động của CLB.

### 👥 2. Quản lý Thành viên (Members Management)
- Bảng quản lý hồ sơ thành viên chi tiết (MSSV, Họ tên, Ban trực thuộc, Chức vụ, Trạng thái).
- Xem hồ sơ chi tiết (Profile Modal) hiển thị kỹ năng, kinh nghiệm và mục tiêu định hướng.
- Bộ lọc đa dạng (theo Ban, theo trạng thái Hoạt động/Đã nghỉ) cùng tính năng tìm kiếm Real-time.

### 📝 3. Quản lý Đơn từ & Yêu cầu (Requests & Forms)
- Theo dõi tiến độ duyệt đơn theo thời gian thực (Rút khỏi CLB, Cam kết trách nhiệm, Bảo lưu).
- Phân loại trạng thái minh bạch: Đang chờ, Đã duyệt, Từ chối.

### 💰 4. Quản lý Tài chính (Finance)
- Theo dõi sát sao Quỹ hiện tại, Tổng Thu và Tổng Chi theo tháng.
- Bảng lịch sử giao dịch (Mã GD, Số tiền, Người phụ trách, Danh mục) với nhãn trực quan.

### ⚠️ 5. Kỷ luật & Chuyên cần (Discipline)
- Theo dõi KPI, số buổi vắng mặt và tự động phân loại mức độ kỷ luật (Nhắc nhở, Cảnh cáo).
- Hệ thống cảnh báo tự động: Báo động khi có thành viên vắng không phép > 2 buổi hoặc KPI < 60.

### 📦 6. Cơ sở vật chất & Hậu cần (Logistics)
- Quản lý danh mục tài sản (Thiết bị, Dụng cụ) và tình trạng thực tế (Tốt, Mới, Đang mượn, Cần bảo trì).
- Theo dõi sát sao lịch mượn/trả thiết bị và yêu cầu mới từ các Ban.

### 🤖 7. MTEC Document Generator v2.0
- Hệ thống tự động điền biểu mẫu (Automated Form Generation) dựa trên nguồn dữ liệu Excel/Google Sheets.
- Tích hợp **AI Assistant** (sử dụng Gemini API) để tự động soạn thảo nhanh các thông báo nội bộ.

### ⚙️ 8. Thiết lập hệ thống (Settings) & Đa ngôn ngữ (i18n)
- Quản lý hồ sơ cá nhân, phân quyền (Super Admin) và cấu hình thông báo hệ thống.
- **Hỗ trợ Song Ngữ (Anh - Việt):** Hệ thống tích hợp `i18next` cho phép chuyển đổi ngôn ngữ toàn bộ UI ngay lập tức.

---

## 💻 Tech Stack (Công nghệ sử dụng)

- **Framework**: React 18
- **Ngôn ngữ**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Internationalization (i18n)**: `react-i18next` & `i18next-browser-languagedetector`
- **AI Integration**: Google Gemini API

---

## ⚙️ Cài Đặt & Khởi Chạy Local

Yêu cầu môi trường:
- Node.js >= 18.0.0
- npm >= 9.0.0

1. **Clone project và cài đặt dependencies**
   ```bash
   git clone https://github.com/your-username/mtec-operations-hub.git
   cd mtec-operations-hub
   npm install
   ```

2. **Cấu hình biến môi trường**
   - Sao chép file `.env.example` thành `.env`:
     ```bash
     cp .env.example .env
     ```
   - Mở file `.env` và điền `VITE_GEMINI_API_KEY` của bạn (lấy tại [Google AI Studio](https://aistudio.google.com/app/apikey)).

3. **Chạy server phát triển (Development)**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ khả dụng tại `http://localhost:5173`.

4. **Build cho môi trường Production**
   ```bash
   npm run build
   ```

5. **Preview bản Build**
   ```bash
   npm run preview
   ```

---

## 🤝 Đóng góp (Contributing)

Chúng tôi hoan nghênh mọi sự đóng góp để cải thiện hệ thống. Vui lòng làm theo các bước:
1. Fork dự án.
2. Tạo một Branch mới (`git checkout -b feature/AmazingFeature`).
3. Commit các thay đổi (`git commit -m 'Add some AmazingFeature'`).
4. Push lên Branch (`git push origin feature/AmazingFeature`).
5. Mở một Pull Request.

---

## 📁 Cấu Trúc Thư Mục Chính

```text
mtec-operations-hub/
├── docs/                # Chứa các tài liệu thiết kế hệ thống và mô tả tính năng chi tiết
├── public/              # Chứa các asset tĩnh (hình ảnh, favicon)
├── src/                 # Source code chính
│   ├── components/      # Các UI component có thể tái sử dụng (Layout, Widget, v.v.)
│   ├── data/            # Mock data (Seed data) dùng cho phát triển và hiển thị giao diện
│   ├── i18n/            # Hệ thống chuyển đổi ngôn ngữ (locales en, vi)
│   ├── services/        # Các service tương tác API (VD: Gemini API)
│   ├── types/           # Định nghĩa TypeScript interfaces/types cho dự án
│   ├── views/           # Các component đóng vai trò làm màn hình chính (Page/View)
│   ├── App.tsx          # Router và Entry component của ứng dụng
│   ├── index.css        # Khai báo CSS toàn cục và config Tailwind
│   ├── main.tsx         # File khởi tạo React app
│   └── theme.ts         # Khai báo Design System / Brand Colors (Dark Blue & Gold)
├── tailwind.config.ts   # Cấu hình TailwindCSS
├── tsconfig.json        # Cấu hình TypeScript
└── vite.config.ts       # Cấu hình Vite bundler
```

---

## 📜 Giấy Phép & Bản Quyền
Dự án được xây dựng và thiết kế nội bộ cho Câu lạc bộ Công nghệ (MTEC) - Đại học Nguyễn Tất Thành (NTTU). Mọi quyền về mặt logic, UI/UX và dữ liệu thuộc về Ban Điều Hành MTEC.

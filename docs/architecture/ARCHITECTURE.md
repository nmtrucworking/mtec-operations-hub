# Kiến trúc Hệ thống (Architecture)

Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc và thiết kế kỹ thuật của **MTEC Operations Hub**.

## 1. Nguyên lý Thiết kế (Design Principles)

- **Component-based UI**: Toàn bộ giao diện được chia nhỏ thành các functional components, dễ tái sử dụng và bảo trì.
- **Client-Side Rendering (CSR)**: Dự án hiện tại hoạt động hoàn toàn trên trình duyệt người dùng với React và Vite giúp đảm bảo thời gian tải và chuyển trang nhanh chóng (nhờ Routing state nội bộ thay vì load lại trang).
- **Static Typing**: Sử dụng TypeScript để định nghĩa các interface dữ liệu cốt lõi (User, Request, Finance, Asset), giảm rủi ro lỗi runtime.

## 2. Kiến trúc Thư mục

### `src/components/`
- Chứa các thành phần UI dùng chung.
- **`layout/`**: `AppShell` (bao gồm thanh điều hướng Sidebar, Header, khung chứa nội dung) và `Sidebar` tách biệt.
- **`shared/`**: Các widget dùng chung như biểu đồ, card thống kê (`StatCard`), component danh mục.

### `src/views/`
- Nơi định nghĩa các trang chức năng độc lập (Ví dụ: `DashboardView`, `MembersView`).
- Mỗi View sẽ nhận data thông qua state cục bộ, hoặc props từ `App.tsx` (ví dụ như `colors`).
- Các View này hoàn toàn cô lập về mặt logic hiển thị, giúp việc phân chia task phát triển trở nên dễ dàng.

### `src/data/`
- Thay vì fetch API từ Backend, dự án hiện đang thiết lập cơ chế **Mock Data** thông qua các file TypeScript (e.g. `requests.ts`, `finance.ts`, `logistics.ts`). 
- Các biến `*SeedData` được export để làm dữ liệu khởi tạo cho ứng dụng.

### `src/i18n/`
- Giải pháp đa ngôn ngữ dựa trên thư viện `i18next`.
- Thư mục chứa các tệp `en.json` và `vi.json`. Các tệp này sử dụng cấu trúc JSON lồng nhau (nested keys) nhằm phân loại keys theo từng View (ví dụ: `dashboard.title`, `members.exportBtn`), tránh xung đột và dễ quản lý.
- Hook `useTranslation` được gọi trong từng component để render text động.

### `src/services/`
- Nơi cấu hình các phương thức gọi API ra bên ngoài (External APIs).
- Cụ thể hiện tại có `gemini.ts` định nghĩa hàm `callGeminiAPI(prompt)` xử lý việc gọi LLM hỗ trợ sinh văn bản (AI Document Generator).

## 3. State Management

- **Local State**: Các state độc lập trong từng View (như form inputs, filter parameters) được xử lý thông qua `useState` và `useMemo`.
- **Global State**: Quản lý Authentication state (`isAuthenticated`) và Navigation state (`activeTab`) hiện đang được giữ ở cấp cao nhất `App.tsx`.
- Khi dự án mở rộng, việc chuyển Global State sang Context API hoặc Redux / Zustand sẽ được xem xét.

## 4. Design System & Theme

- Được định nghĩa tại `src/theme.ts`.
- Sử dụng bảng màu mang nhận diện thương hiệu của MTEC:
  - Màu nền chủ đạo (Dark Background): `#0a1f3f` (Xanh hải quân đậm)
  - Màu nhấn (Accent Gold): `#ffc20e` (Vàng)
- Các biến màu này được inject vào Tailwind class dưới dạng object `colors` và pass dưới dạng Props tới mọi View.

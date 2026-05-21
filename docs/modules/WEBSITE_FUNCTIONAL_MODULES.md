# MTEC Operations Hub — Tài liệu mô tả các module chức năng website

## 1. Mục đích tài liệu

Tài liệu này mô tả các module chức năng chính của website **MTEC Operations Hub** theo cấu trúc hiện tại của frontend repository `mtec-operations-hub` và backend repository `mtec-operations-hub-backend`.

Mục tiêu sử dụng:

- Làm tài liệu định hướng cho thành viên phát triển hệ thống.
- Chuẩn hóa cách hiểu về phạm vi từng module.
- Làm cơ sở chia task frontend/backend.
- Làm tài liệu đối chiếu khi nghiệm thu module.
- Hỗ trợ Ban Chủ nhiệm và Ban Vận hành hiểu luồng nghiệp vụ trên website.

## 2. Tổng quan hệ thống

**MTEC Operations Hub** là portal quản trị nội bộ phục vụ công tác vận hành Câu lạc bộ Truyền thông và Công nghệ MTEC.

Website hiện được tổ chức theo mô hình **single-page application** với các tab chức năng chính. Mỗi tab tương ứng với một view trong thư mục `src/views` và được đăng ký tập trung tại `src/config/appRegistry.ts`.

Các nhóm module chính:

| STT | Module | Tab frontend | Mục đích chính |
|---:|---|---|---|
| 1 | Dashboard | `dashboard` | Tổng quan vận hành CLB |
| 2 | Quản lý thành viên | `members` | Quản lý hồ sơ nhân sự |
| 3 | Đơn từ & yêu cầu | `requests` | Quản lý quy trình gửi/duyệt đơn |
| 4 | Tài chính | `finance` | Quản lý thu, chi, phê duyệt giao dịch |
| 5 | Kỷ luật & hiệu suất | `discipline` | Quản lý KPI, chuyên cần, kỷ luật, thi đua |
| 6 | Hậu cần & tài sản | `logistics` | Quản lý cơ sở vật chất, tài sản, mượn/trả |
| 7 | Trình tạo văn bản | `generator` | Tạo biểu mẫu/văn bản bằng dữ liệu và AI |
| 8 | Thiết lập hệ thống | `settings` | Quản lý hồ sơ cá nhân và cấu hình tài khoản |
| 9 | Nhật ký hệ thống | `logs` | Theo dõi audit log và hoạt động hệ thống |

## 3. Kiến trúc chức năng tổng quát

### 3.1. Lớp frontend

Frontend sử dụng React + TypeScript + Vite. Cấu trúc chính:

```text
src/
├── components/      # UI component tái sử dụng
├── config/          # App registry, version, cấu hình module
├── data/            # Kiểu dữ liệu, mock data, danh mục nghiệp vụ
├── i18n/            # Song ngữ Anh - Việt
├── lib/             # Helper, permission utils
├── services/        # API client theo từng module
├── types/           # TypeScript types/interfaces
├── views/           # Màn hình/module chính
├── App.tsx          # Entry component và logic session
└── main.tsx         # React bootstrap
```

### 3.2. Lớp backend

Backend sử dụng FastAPI + SQLAlchemy. Cấu trúc chức năng chính:

```text
app/
├── core/            # Config, security, RBAC, audit, response helpers
├── middleware/      # Middleware hệ thống
├── repositories/    # Data access layer nếu có
├── routers/         # API route theo module
├── services/        # Business services
├── db.py            # Database session/engine
├── deps.py          # Dependency injection, auth dependency
├── main.py          # FastAPI app entry
├── models.py        # SQLAlchemy models
├── schemas.py       # Pydantic schemas
└── utils.py         # Utility functions
```

### 3.3. Cơ chế phân quyền

Website sử dụng role-based access control. Một số role chính:

| Role | Ý nghĩa nghiệp vụ |
|---|---|
| `bcn` | Ban Chủ nhiệm / quản trị cấp cao |
| `bvh_hr` | Ban Vận hành — Nhân sự |
| `bvh_finance` | Ban Vận hành — Tài chính |
| `bvh_discipline` | Ban Vận hành — Kỷ luật/KPI |
| `bvh_logistics` | Ban Vận hành — Hậu cần |
| `bcm` | Ban Chuyên môn / trưởng nhóm chuyên môn |
| `member` | Thành viên thông thường |

Phân quyền hiển thị module được cấu hình ở frontend, nhưng quyền thao tác chính thức phải được kiểm tra ở backend.

## 4. Module 1 — Dashboard

### 4.1. Mục đích

Dashboard cung cấp cái nhìn tổng quan về trạng thái vận hành của CLB tại một thời điểm.

### 4.2. Người dùng chính

- Ban Chủ nhiệm.
- Ban Vận hành.
- Trưởng/Phó ban chuyên môn.
- Thành viên có quyền xem thông tin tổng quan.

### 4.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Chỉ số tổng quan | Hiển thị tổng thành viên, quỹ hiện tại, tài sản cần bảo trì, đơn từ chờ duyệt |
| Cơ cấu thành viên | Thống kê thành viên theo ban/bộ phận |
| Hoạt động gần đây | Hiển thị các thay đổi hoặc hoạt động mới nhất trong hệ thống |
| AI Insight | Tạo nhận định nhanh dựa trên dữ liệu vận hành nếu backend AI gateway đã cấu hình |

### 4.4. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `GET /api/v1/dashboard/overview` | Lấy dữ liệu tổng hợp cho dashboard |
| `GET /api/v1/members` | Thống kê nhân sự |
| `GET /api/v1/transactions` | Thống kê tài chính |
| `GET /api/v1/assets` | Thống kê tài sản |
| `GET /api/v1/requests` | Thống kê đơn từ |

### 4.5. Trạng thái hiện tại

Module đã có UI và service kết nối backend. Cần tiếp tục kiểm thử tính đúng của số liệu tổng hợp khi dữ liệu thực tăng lên.

## 5. Module 2 — Quản lý thành viên

### 5.1. Mục đích

Module Quản lý thành viên là lõi của hệ thống nhân sự, dùng để quản lý hồ sơ thành viên CLB.

### 5.2. Người dùng chính

- `bcn`
- `bvh_hr`
- Các role khác có thể được xem danh sách/hồ sơ tùy cấu hình quyền.

### 5.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Danh sách thành viên | Hiển thị MSSV, họ tên, ban, chức vụ, trạng thái |
| Tìm kiếm | Tìm theo tên hoặc MSSV |
| Bộ lọc | Lọc theo ban và trạng thái hoạt động |
| Xem hồ sơ | Hiển thị thông tin cá nhân, thông tin tham gia, kỹ năng, kinh nghiệm, mục tiêu |
| Thêm thành viên | Tạo hồ sơ thành viên mới |
| Cập nhật thành viên | Chỉnh sửa hồ sơ thành viên |
| Xoá mềm/ngừng hoạt động | Chuyển trạng thái thành viên sang `Inactive` thay vì xoá vật lý |
| Import thành viên | Nhập danh sách từ CSV/XLSX |
| Export dữ liệu | Xuất CSV hoặc ZIP hồ sơ |
| Xuất hồ sơ DOCX | Tạo hồ sơ thành viên theo biểu mẫu nội bộ |
| Lịch sử thay đổi | Xem audit log liên quan đến thành viên |

### 5.4. Cấu trúc dữ liệu nghiệp vụ

Một hồ sơ thành viên nên bao gồm:

| Nhóm thông tin | Trường dữ liệu tiêu biểu |
|---|---|
| Thông tin định danh | `id`, `mssv`, `name`, `gender`, `dob` |
| Thông tin học vụ | `lop`, `khoa`, `chuyenNganh` |
| Liên hệ | `phone`, `email`, `address` |
| Tham gia CLB | `ban`, `roleTitle`, `status`, `joinDate` |
| Năng lực | `hardSkills`, `softSkills`, `experience` |
| Định hướng | `goal`, `orientation` |
| Theo dõi vận hành | `createdAt`, `updatedAt`, audit logs |

### 5.5. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `GET /api/v1/members` | Lấy danh sách thành viên |
| `GET /api/v1/members/{member_id}` | Lấy chi tiết thành viên |
| `POST /api/v1/members` | Tạo thành viên |
| `PATCH /api/v1/members/{member_id}` | Cập nhật thành viên |
| `PATCH /api/v1/members/{member_id}/status` | Đổi trạng thái thành viên |
| `DELETE /api/v1/members/{member_id}` | Xoá mềm thành viên theo hướng chuẩn hóa mới |
| `POST /api/v1/members/import` | Import thành viên |
| `GET /api/v1/members/import/template` | Tải template import |
| `GET /api/v1/members/export` | Export danh sách/hồ sơ |
| `GET /api/v1/members/{member_id}/profile` | Xuất hồ sơ DOCX |

### 5.6. Phụ thuộc module

| Module liên quan | Kiểu phụ thuộc |
|---|---|
| Kỷ luật & hiệu suất | Dùng member id để ghi KPI, vắng mặt, kỷ luật |
| Đơn từ & yêu cầu | Dùng MSSV/họ tên để tạo yêu cầu |
| Tài chính | Có thể liên kết người phụ trách hoặc đối tượng thanh toán |
| Hậu cần | Có thể liên kết người giữ tài sản |
| Nhật ký hệ thống | Ghi nhận create/update/soft delete member |

### 5.7. Trạng thái hiện tại

Module đã có UI tương đối đầy đủ. Cần hoàn thiện hai điểm kỹ thuật quan trọng:

1. Đồng bộ endpoint xoá mềm giữa frontend và backend.
2. Lưu `hardSkills` và `softSkills` vào bảng `member_skills` thay vì chỉ xử lý ở frontend.

## 6. Module 3 — Đơn từ & yêu cầu

### 6.1. Mục đích

Module Đơn từ & yêu cầu dùng để quản lý các yêu cầu nội bộ cần phê duyệt, ví dụ: rút khỏi CLB, bảo lưu hoạt động, cam kết trách nhiệm hoặc các loại đơn khác.

### 6.2. Người dùng chính

- `bcn`
- `bvh_hr`
- Thành viên gửi yêu cầu nếu frontend mở quyền tạo đơn trong tương lai.

### 6.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Danh sách yêu cầu | Theo dõi các đơn/yêu cầu đã gửi |
| Tạo yêu cầu | Ghi nhận yêu cầu mới |
| Cập nhật yêu cầu | Sửa nội dung khi chưa duyệt hoặc theo quyền cho phép |
| Duyệt/từ chối | BCN hoặc nhân sự xét duyệt yêu cầu |
| Ghi chú xét duyệt | Lưu lý do duyệt/từ chối |
| Liên kết tài chính | Khi yêu cầu có phát sinh thu/chi, tạo transaction liên kết |

### 6.4. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `GET /api/v1/requests` | Lấy danh sách yêu cầu |
| `GET /api/v1/requests/{request_id}` | Lấy chi tiết yêu cầu |
| `POST /api/v1/requests` | Tạo yêu cầu |
| `PATCH /api/v1/requests/{request_id}` | Cập nhật yêu cầu |
| `POST /api/v1/requests/{request_id}/review` | Duyệt hoặc từ chối yêu cầu |
| `POST /api/v1/transactions` | Tạo giao dịch phát sinh nếu yêu cầu được duyệt |

### 6.5. Phụ thuộc module

| Module liên quan | Kiểu phụ thuộc |
|---|---|
| Thành viên | Gắn yêu cầu với MSSV/họ tên |
| Tài chính | Tự động tạo giao dịch nếu có finance draft |
| Nhật ký hệ thống | Ghi nhận hành động xét duyệt |

### 6.6. Trạng thái hiện tại

Module đã được mount trong frontend nhưng hiện cấu hình frontend chỉ cho `bcn` thấy tab. Nếu muốn thành viên tự gửi đơn, cần mở luồng UI và quyền API phù hợp.

## 7. Module 4 — Tài chính

### 7.1. Mục đích

Module Tài chính quản lý dòng tiền nội bộ của CLB, bao gồm khoản thu, khoản chi, phê duyệt chi và báo cáo quỹ.

### 7.2. Người dùng chính

- `bcn`
- `bvh_finance`
- `bvh_logistics` trong các nghiệp vụ liên quan hậu cần/tài sản.

### 7.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Tổng quan tài chính | Hiển thị tổng thu, tổng chi, quỹ hiện tại |
| Danh sách giao dịch | Theo dõi toàn bộ giao dịch thu/chi |
| Tạo giao dịch | Ghi nhận khoản thu hoặc khoản chi |
| Cập nhật giao dịch | Điều chỉnh thông tin giao dịch |
| Phê duyệt giao dịch | Duyệt chi theo role yêu cầu |
| Từ chối giao dịch | Từ chối khoản chi không hợp lệ |
| Xoá mềm giao dịch | Ẩn giao dịch không hợp lệ nhưng vẫn giữ audit trail |
| Giao dịch chờ duyệt | Danh sách khoản chi cần xử lý |

### 7.4. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `GET /api/v1/transactions` | Lấy danh sách giao dịch |
| `GET /api/v1/transactions/pending` | Lấy giao dịch chờ duyệt |
| `POST /api/v1/transactions` | Tạo giao dịch |
| `PATCH /api/v1/transactions/{transaction_id}` | Cập nhật giao dịch |
| `POST /api/v1/transactions/{transaction_id}/review` | Duyệt/từ chối giao dịch |
| `DELETE /api/v1/transactions/{transaction_id}` | Xoá mềm giao dịch |
| `GET /api/v1/dashboard/overview` | Tổng hợp quỹ hiện tại, tổng thu, tổng chi |

### 7.5. Quy tắc nghiệp vụ chính

| Quy tắc | Mô tả |
|---|---|
| Khoản thu | Mặc định có thể ở trạng thái đã duyệt |
| Khoản chi | Cần duyệt trước khi tính vào quỹ |
| Role duyệt | Phụ thuộc `requiredApprovalRole` |
| Audit | Các hành động tạo, duyệt, xoá mềm cần có audit log |

### 7.6. Phụ thuộc module

| Module liên quan | Kiểu phụ thuộc |
|---|---|
| Dashboard | Cung cấp số liệu quỹ |
| Requests | Nhận giao dịch phát sinh từ yêu cầu đã duyệt |
| Logistics | Chi phí tài sản/hậu cần có thể tạo giao dịch |
| Logs | Ghi nhật ký thay đổi giao dịch |

## 8. Module 5 — Kỷ luật & hiệu suất

### 8.1. Mục đích

Module Kỷ luật & hiệu suất phục vụ theo dõi chuyên cần, KPI, vi phạm, thành tích và dữ liệu đánh giá thành viên.

### 8.2. Người dùng chính

- `bcn`
- `bvh_discipline`
- Một phần dữ liệu có thể liên quan `bvh_hr` và `bcm` trong đánh giá chuyên môn.

### 8.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Hồ sơ kỷ luật | Theo dõi số buổi vắng, KPI, mức kỷ luật |
| Tạo/cập nhật record | Ghi nhận hoặc điều chỉnh hồ sơ kỷ luật |
| Điểm danh cuộc họp | Tạo cuộc họp và ghi nhận trạng thái có mặt/vắng mặt/có phép |
| Đồng bộ vắng mặt | Tự động cộng số buổi vắng từ dữ liệu attendance |
| Thi đua/cuộc thi | Ghi nhận kết quả tham gia cuộc thi, cộng KPI thưởng |
| Đồng bộ KPI thi đua | Cộng điểm thưởng từ kết quả cuộc thi vào hồ sơ KPI |
| Cảnh báo | Phát hiện thành viên vắng nhiều hoặc KPI thấp |

### 8.4. Tab con trong UI

| Tab con | Mục đích |
|---|---|
| Hồ sơ Kỷ luật | Quản lý `DisciplineRecord` |
| Điểm danh Cuộc họp | Quản lý `Meeting` và `Attendance` |
| Hiệu suất / Thi đua | Quản lý cuộc thi và kết quả thành viên |

### 8.5. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `GET /api/v1/discipline-records` | Danh sách hồ sơ kỷ luật/KPI |
| `GET /api/v1/discipline-records/stats` | Thống kê kỷ luật/KPI |
| `POST /api/v1/discipline-records` | Tạo hồ sơ kỷ luật |
| `PATCH /api/v1/discipline-records/{record_id}` | Cập nhật hồ sơ kỷ luật |
| `POST /api/v1/discipline-records/sync-attendance/{meeting_id}` | Đồng bộ vắng mặt từ cuộc họp |
| `POST /api/v1/discipline-records/sync-competition-kpi/{competition_id}` | Đồng bộ KPI từ cuộc thi |
| `GET /api/v1/meetings` | Danh sách cuộc họp |
| `POST /api/v1/meetings` | Tạo cuộc họp |
| `PUT /api/v1/meetings/{meeting_id}/attendance` | Cập nhật điểm danh |
| `GET /api/v1/meetings/{meeting_id}/attendance` | Lấy danh sách điểm danh |

### 8.6. Evaluation v2

Backend đã có nền tảng đánh giá nâng cao ở API v2, gồm:

- Chu kỳ đánh giá.
- Bộ tiêu chí đánh giá.
- Vai trò thành viên theo chu kỳ, hỗ trợ đa ban.
- Score events.
- Minh chứng đánh giá.
- Tính điểm tự động.
- Khiếu nại/phúc khảo kết quả đánh giá.

Các API tiêu biểu:

| API | Mục đích |
|---|---|
| `POST /api/v2/evaluations/cycles` | Tạo chu kỳ đánh giá |
| `GET /api/v2/evaluations/cycles` | Danh sách chu kỳ |
| `POST /api/v2/evaluations/criteria/seed` | Seed tiêu chí đánh giá mặc định |
| `GET /api/v2/evaluations/criteria` | Danh sách tiêu chí |
| `POST /api/v2/evaluations/cycles/{cycle_id}/member-roles` | Gán vai trò thành viên trong chu kỳ |
| `POST /api/v2/evaluations/cycles/{cycle_id}/score-events` | Ghi sự kiện điểm |
| `POST /api/v2/evaluations/cycles/{cycle_id}/compute` | Tính kết quả đánh giá chu kỳ |
| `GET /api/v2/evaluations/cycles/{cycle_id}/summary` | Tổng hợp kết quả chu kỳ |

### 8.7. Trạng thái hiện tại

Module kỷ luật/KPI đã có UI. Evaluation v2 đã có backend đáng kể nhưng cần UI riêng hoặc tích hợp sâu hơn vào tab Discipline.

## 9. Module 6 — Hậu cần & tài sản

### 9.1. Mục đích

Module Hậu cần & tài sản quản lý cơ sở vật chất, thiết bị, dụng cụ và tình trạng mượn/trả phục vụ hoạt động CLB.

### 9.2. Người dùng chính

- `bcn`
- `bvh_logistics`
- `bvh_finance`
- `bcm` trong các yêu cầu sử dụng tài sản hoặc chuẩn bị sự kiện.

### 9.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Danh mục tài sản | Quản lý tên tài sản, số lượng, loại tài sản |
| Trạng thái tài sản | Theo dõi tốt, mới, đang mượn, cần bảo trì |
| Người giữ tài sản | Ghi nhận cá nhân/bộ phận đang giữ tài sản |
| Cập nhật tài sản | Thêm/sửa tài sản và tình trạng |
| Cảnh báo bảo trì | Hỗ trợ dashboard thống kê tài sản cần xử lý |

### 9.4. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `GET /api/v1/assets` | Danh sách tài sản |
| `GET /api/v1/assets/{asset_id}` | Chi tiết tài sản |
| `POST /api/v1/assets` | Tạo tài sản |
| `PATCH /api/v1/assets/{asset_id}` | Cập nhật tài sản |
| `GET /api/v1/dashboard/overview` | Tổng hợp tài sản cần bảo trì |

### 9.5. Phụ thuộc module

| Module liên quan | Kiểu phụ thuộc |
|---|---|
| Dashboard | Cung cấp số liệu tài sản cần bảo trì |
| Finance | Tài sản mới/bảo trì có thể phát sinh giao dịch |
| Logs | Ghi nhận tạo/cập nhật tài sản |

## 10. Module 7 — Trình tạo văn bản / Document Generator

### 10.1. Mục đích

Module Document Generator hỗ trợ tạo văn bản nội bộ, biểu mẫu và nội dung hành chính bằng dữ liệu có cấu trúc và AI assistant.

### 10.2. Người dùng chính

- `bcn`
- Các role khác nếu được mở quyền trong tương lai.

### 10.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Tạo văn bản từ prompt | Sinh bản nháp thông báo/nội dung nội bộ |
| Tạo insight | Phân tích nhanh dựa trên prompt hoặc dữ liệu nhập |
| Xử lý ngữ cảnh | Nhận file/link/text làm ngữ cảnh cho AI |
| Xuất văn bản | Tạo tài liệu theo template nếu backend hỗ trợ |
| Biểu mẫu thành viên | Có thể liên kết với template hồ sơ thành viên |

### 10.4. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `POST /api/v1/ai/generate-insight` | Tạo phân tích/insight |
| `POST /api/v1/ai/generate-draft` | Tạo bản nháp văn bản |
| `POST /api/v1/ai/process-context` | Xử lý ngữ cảnh đầu vào |
| `POST /api/v1/ai/export-document` | Xuất văn bản theo template |
| `GET /api/v1/members/{member_id}/profile` | Xuất hồ sơ thành viên DOCX |

### 10.5. Ràng buộc kỹ thuật

| Ràng buộc | Mô tả |
|---|---|
| API key | Cần cấu hình `VITE_GEMINI_API_KEY` ở frontend và `AI_API_KEY` ở backend nếu dùng AI thật |
| Rate limit | Backend nên giới hạn số request AI để tránh lạm dụng |
| Bảo mật dữ liệu | Không đưa thông tin nhạy cảm vào prompt nếu chưa có chính sách xử lý dữ liệu rõ ràng |

## 11. Module 8 — Thiết lập hệ thống

### 11.1. Mục đích

Module Settings cho phép người dùng quản lý thông tin tài khoản cá nhân và một số cấu hình thông báo/hệ thống.

### 11.2. Người dùng chính

Tất cả người dùng đã đăng nhập.

### 11.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Hồ sơ cá nhân | Cập nhật họ tên, email, số điện thoại, avatar initials |
| Đổi mật khẩu | Cập nhật mật khẩu tài khoản |
| Cấu hình thông báo | Bật/tắt một số loại thông báo |
| Hiển thị phân quyền | Cho người dùng biết role hiện tại |
| Ngôn ngữ | Kết hợp với i18n để hỗ trợ Anh - Việt |

### 11.4. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `GET /api/v1/auth/me` | Lấy thông tin user hiện tại |
| `PATCH /api/v1/settings/profile` | Cập nhật hồ sơ cá nhân |
| `POST /api/v1/settings/change-password` | Đổi mật khẩu |
| `GET /api/v1/settings/notifications` | Lấy cấu hình thông báo |
| `PATCH /api/v1/settings/notifications` | Cập nhật cấu hình thông báo |

## 12. Module 9 — Nhật ký hệ thống / Logs

### 12.1. Mục đích

Module Logs dùng để theo dõi lịch sử thao tác trong hệ thống, phục vụ minh bạch hóa vận hành và truy vết thay đổi dữ liệu.

### 12.2. Người dùng chính

- `bcn`

### 12.3. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Danh sách log | Hiển thị các hành động đã xảy ra |
| Tìm kiếm log | Tìm theo action, resource, member id hoặc actor |
| Truy vết thay đổi | Xem before/after snapshot nếu backend có lưu |
| Hỗ trợ audit | Làm căn cứ kiểm tra hoạt động quản trị |

### 12.4. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `GET /api/v1/logs` | Lấy danh sách audit logs |

### 12.5. Các action log tiêu biểu

| Action | Ý nghĩa |
|---|---|
| `CREATE_MEMBER` | Tạo hồ sơ thành viên |
| `UPDATE_MEMBER` | Cập nhật hồ sơ thành viên |
| `SOFT_DELETE_MEMBER` | Xoá mềm/ngừng hoạt động thành viên |
| `REVIEW_REQUEST` | Duyệt/từ chối yêu cầu |
| `REVIEW_TRANSACTION` | Duyệt/từ chối giao dịch |
| `SOFT_DELETE_TRANSACTION` | Xoá mềm giao dịch |
| `CREATE_DISCIPLINE_RECORD` | Tạo hồ sơ kỷ luật |
| `UPDATE_DISCIPLINE_RECORD` | Cập nhật hồ sơ kỷ luật |
| `UPDATE_ATTENDANCE` | Cập nhật điểm danh |

## 13. Module nền — Xác thực và phân quyền

### 13.1. Mục đích

Đây là module nền dùng bởi toàn bộ hệ thống. Người dùng phải đăng nhập trước khi truy cập các module nghiệp vụ.

### 13.2. Chức năng chính

| Nhóm chức năng | Mô tả |
|---|---|
| Đăng nhập | Xác thực username/password |
| Khôi phục session | Frontend lưu token và gọi lại `/auth/me` khi reload |
| Đăng xuất | Xóa token khỏi local storage/session storage |
| Refresh token | Gia hạn phiên nếu backend hỗ trợ |
| RBAC | Kiểm tra quyền hiển thị module và quyền thao tác backend |

### 13.3. Dữ liệu/API liên quan

| API | Mục đích |
|---|---|
| `POST /api/v1/auth/login` | Đăng nhập |
| `POST /api/v1/auth/logout` | Đăng xuất |
| `GET /api/v1/auth/me` | Lấy user hiện tại |
| `POST /api/v1/auth/refresh` | Refresh token |
| `GET /api/v2/auth/me` | Auth endpoint phiên bản v2 nếu dùng API v2 |

## 14. Ma trận module — role truy cập frontend

Bảng dưới đây mô tả quyền hiển thị tab ở frontend theo cấu hình hiện tại. Backend vẫn phải kiểm tra quyền lại cho từng API.

| Module | `bcn` | `bvh_hr` | `bvh_finance` | `bvh_discipline` | `bvh_logistics` | `bcm` | `member` |
|---|---:|---:|---:|---:|---:|---:|---:|
| Dashboard | Có | Có | Có | Có | Có | Có | Có |
| Members | Có | Có | Có | Có | Có | Có | Có |
| Requests | Có | Không | Không | Không | Không | Không | Không |
| Finance | Có | Không | Có | Không | Có | Không | Không |
| Discipline | Có | Không | Không | Có | Không | Không | Không |
| Logistics | Có | Không | Có | Không | Có | Có | Không |
| Generator | Có | Không | Không | Không | Không | Không | Không |
| Settings | Có | Có | Có | Có | Có | Có | Có |
| Logs | Có | Không | Không | Không | Không | Không | Không |

## 15. Luồng nghiệp vụ tổng hợp

### 15.1. Luồng quản lý thành viên

```text
Tạo/import thành viên
        ↓
Xem/cập nhật hồ sơ
        ↓
Gán ban, chức vụ, trạng thái
        ↓
Theo dõi KPI/kỷ luật/điểm danh
        ↓
Xuất hồ sơ hoặc chuyển inactive khi ngừng hoạt động
```

### 15.2. Luồng điểm danh và kỷ luật

```text
Tạo cuộc họp
        ↓
Cập nhật điểm danh
        ↓
Đồng bộ vắng mặt sang DisciplineRecord
        ↓
Cập nhật số buổi vắng và mức kỷ luật
        ↓
Phục vụ đánh giá định kỳ
```

### 15.3. Luồng đơn từ có phát sinh tài chính

```text
Tạo yêu cầu
        ↓
BCN/BVH HR duyệt yêu cầu
        ↓
Nếu có finance draft → tạo transaction liên kết
        ↓
Tài chính/BCN xét duyệt transaction
        ↓
Cập nhật số liệu quỹ trên dashboard
```

### 15.4. Luồng đánh giá thành viên nâng cao

```text
Tạo chu kỳ đánh giá
        ↓
Seed/cấu hình tiêu chí
        ↓
Gán vai trò thành viên theo ban/chức năng
        ↓
Ghi score events và minh chứng
        ↓
Compute kết quả
        ↓
Duyệt/khoá chu kỳ
        ↓
Xử lý khiếu nại nếu có
```

## 16. Module chưa hoàn thiện hoặc cần mở rộng

| Nhóm mở rộng | Trạng thái đề xuất | Ghi chú |
|---|---|---|
| Tuyển thành viên end-to-end | Cần bổ sung | Cần applicant, screening, interview, approval, onboarding |
| Evaluation UI v2 | Cần bổ sung | Backend đã có nền tảng API v2, frontend chưa có tab riêng |
| Member skills persistence | Đang cần hoàn thiện | Cần lưu `hardSkills`/`softSkills` vào `member_skills` |
| Soft-delete member | Đang cần hoàn thiện | Cần endpoint backend tương thích frontend |
| Notification thực tế | Cần xác minh | Settings có cấu hình, cần kiểm tra kênh gửi thông báo |
| File/document storage | Cần chuẩn hóa | Cần chính sách lưu file, quyền truy cập, versioning |

## 17. Checklist nghiệm thu theo module

### 17.1. Dashboard

- Hiển thị đủ các chỉ số tổng quan.
- Số liệu khớp với dữ liệu backend.
- Không lỗi khi dữ liệu trống.
- Có xử lý loading/error state.

### 17.2. Members

- Tạo thành viên thành công.
- Cập nhật thành viên thành công.
- Import CSV/XLSX thành công.
- Export CSV/ZIP/DOCX thành công.
- Lọc và tìm kiếm đúng.
- Kỹ năng được lưu sau reload.
- Xoá mềm không làm mất record vật lý.

### 17.3. Requests

- Tạo yêu cầu thành công.
- Duyệt/từ chối đúng quyền.
- Không duyệt lại yêu cầu đã xử lý.
- Tạo transaction liên kết nếu có finance draft.

### 17.4. Finance

- Tạo thu/chi thành công.
- Phê duyệt đúng role.
- Tổng quỹ cập nhật đúng.
- Xoá mềm transaction không làm mất audit trail.

### 17.5. Discipline

- Tạo/cập nhật discipline record thành công.
- Tạo meeting thành công.
- Cập nhật attendance thành công.
- Đồng bộ vắng mặt chính xác.
- Đồng bộ KPI thi đua chính xác.

### 17.6. Logistics

- Tạo/cập nhật tài sản thành công.
- Trạng thái tài sản hiển thị đúng.
- Dashboard nhận diện được tài sản cần bảo trì.

### 17.7. Generator

- Tạo draft văn bản thành công.
- Xử lý input lỗi rõ ràng.
- Không làm lộ API key ở frontend.
- Có rate limit ở backend.

### 17.8. Settings

- Cập nhật hồ sơ cá nhân thành công.
- Đổi mật khẩu đúng validation.
- Cấu hình thông báo lưu được.

### 17.9. Logs

- Ghi log cho các thao tác quan trọng.
- Tìm kiếm/lọc log hoạt động đúng.
- Snapshot before/after không chứa dữ liệu nhạy cảm ngoài phạm vi cần thiết.

## 18. Kết luận

Website hiện đã có cấu trúc module rõ ràng, phù hợp với định hướng portal quản trị vận hành CLB. Các module cốt lõi đã được mount trong frontend và phần lớn có API backend tương ứng.

Trọng tâm hoàn thiện tiếp theo nên là:

1. Chuẩn hóa module Quản lý thành viên để đạt mức production-ready.
2. Mở rộng quy trình tuyển thành viên end-to-end.
3. Tích hợp UI cho evaluation v2.
4. Hoàn thiện test và checklist nghiệm thu cho từng module.
5. Chuẩn hóa tài liệu API/module để thuận tiện bàn giao cho thành viên mới.

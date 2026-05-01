## Plan: Hoàn thiện quản lý tài chính

TL;DR: Hoàn thiện FinanceView theo hướng mock/in-memory nhưng đồng bộ đầy đủ với Requests và Dashboard trong cùng một nguồn dữ liệu cấp app. Ưu tiên thêm hàng chờ duyệt, xoá mềm để giữ audit trail, phân quyền theo vai trò, và bổ sung validation/lọc/tổng hợp để giao diện đúng nghiệp vụ hơn.

**Steps**
1. Khóa phạm vi và mô hình dữ liệu chung cho toàn bộ luồng tài chính, không làm backend/persistence trong đợt này.
2. Lifting state lên cấp App để Finance, Requests và Dashboard cùng đọc/ghi một nguồn dữ liệu. Tạo một shared store hoặc hook trong src/ để quản lý requests, transactions và các hàm cập nhật như thêm/sửa/duyệt/xoá mềm.
3. Mở rộng model ở src/data/finance.ts và src/data/requests.ts để có thêm trạng thái pending/approved/rejected, liên kết request-to-transaction, trường ghi chú duyệt, và cơ sở cho xoá mềm. Cập nhật seed data cho phù hợp với quy trình mới.
4. Cập nhật src/views/FinanceView.tsx thành màn hình quản lý đầy đủ hơn: lọc theo ngày/loại/trạng thái, validation rõ ràng, thêm lưới cho hàng chờ duyệt, nút duyệt/từ chối/xoá mềm theo role, và modal tạo/sửa giao dịch có policy theo danh mục.
5. Cập nhật src/views/RequestsView.tsx để khi một đơn được duyệt có thể sinh bản ghi tài chính liên kết, đồng thời hiển thị trạng thái và người duyệt nhất quán với Finance.
6. Truyền currentUser/role từ src/App.tsx vào các view cần phân quyền, và siết lại trong Finance/AppShell để ẩn hoặc vô hiệu hóa hành động không hợp lệ theo ma trận quyền trong docs/PERMISSIONS.md.
7. Đồng bộ src/views/DashboardView.tsx với nguồn dữ liệu mới để số dư, tổng thu/chi, đơn chờ duyệt và recent activity không bị lệch so với Finance/Requests.
8. Bổ sung i18n keys trong src/i18n/locales/vi.json và src/i18n/locales/en.json cho các trạng thái mới, hành động duyệt, xoá mềm, validation và bộ lọc.
9. Cập nhật docs/PERMISSIONS.md nếu cần để mô tả rõ quy tắc duyệt chi theo hàng chờ và quyền của bvh_finance/bcn trong màn tài chính.

**Relevant files**
- src/App.tsx - điểm ghép state và truyền quyền
- src/views/FinanceView.tsx - nơi làm lại luồng tài chính chính
- src/views/RequestsView.tsx - đồng bộ duyệt đơn với giao dịch
- src/views/DashboardView.tsx - đồng bộ số liệu tổng quan
- src/data/finance.ts - mở rộng model, seed và policy
- src/data/requests.ts - mở rộng trạng thái và liên kết dữ liệu
- src/components/layout/AppShell.tsx - kiểm tra tab/hành động theo role
- src/i18n/locales/vi.json và src/i18n/locales/en.json - text cho workflow mới
- docs/PERMISSIONS.md - tài liệu quyền và quy trình

**Verification**
1. Chạy `npm run build` để bắt lỗi TypeScript và JSX sau khi đổi model, props và shared state.
2. Kiểm tra thủ công luồng Finance: tạo giao dịch, đưa khoản chi vào chờ duyệt, duyệt hoặc từ chối, rồi xác nhận Dashboard cập nhật ngay.
3. Kiểm tra luồng Requests: duyệt một đơn có liên kết và xác nhận Finance sinh đúng bản ghi liên quan.
4. Thử với user bvh_finance và bcn để xác nhận nút duyệt, xoá mềm và tạo giao dịch chỉ hiện đúng quyền.

**Decisions**
- Phạm vi đợt này chỉ làm trên mock/in-memory, chưa thêm backend hoặc persistence.
- Finance và Requests phải dùng chung nguồn dữ liệu cấp app để Dashboard không lệch số.
- Xoá giao dịch là xoá mềm để giữ lịch sử kiểm tra.
- Hàng chờ duyệt là bắt buộc; quy tắc duyệt sẽ dựa theo policy danh mục thay vì một ngưỡng cố định duy nhất.

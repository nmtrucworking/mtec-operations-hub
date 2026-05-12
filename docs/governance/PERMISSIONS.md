# Bảng Phân Quyền Truy Cập Hệ Thống (MTEC Operations Hub)

Dựa trên các quy định trong **MTEC-CLB-01 Điều lệ hoạt động CLB Truyền Thông và Công Nghệ**, dưới đây là bảng phân quyền truy cập hệ thống dành cho các nhóm người dùng khác nhau trên ứng dụng MTEC Operations Hub.

## 1. Định nghĩa vai trò (Roles)

1. **Ban Chủ Nhiệm (BCN):** Chủ nhiệm, Phó Chủ nhiệm. Là cơ quan điều hành cao nhất.
2. **Ban Vận Hành (BVH):** Trưởng ban và các thành viên phụ trách Nhân sự, Tài chính, Kỷ luật, Hậu cần.
3. **Ban Chuyên Môn Khác:** Trưởng ban/Thành viên của Ban Công nghệ và Ban Truyền thông.
4. **Thành viên (Member):** Thành viên chính thức/Cộng tác viên thông thường.

## 2. Ma trận phân quyền (Permission Matrix)

Chú thích quyền hạn:
- **Toàn quyền (Full):** Được xem, thêm, sửa, xóa (CRUD), và phê duyệt.
- **Chỉ xem (View):** Chỉ được xem danh sách và chi tiết.
- **Cá nhân/Ban (Own):** Chỉ được xem, tạo và thao tác trên dữ liệu của chính mình hoặc ban mình quản lý.
- **Không (None):** Không có quyền truy cập.

|         Màn hình (View)          |         Ban Chủ Nhiệm (BCN)          |     Ban Vận Hành (Tổ Nhân Sự)     |     Ban Vận Hành (Tổ Tài Chính)     |        Ban Vận Hành (Tổ Kỷ Luật)        |    Ban Vận Hành (Tổ Hậu Cần)     |  Ban Chuyên Môn (Khác)  |  Thành viên (Member)  |                                                        Căn cứ theo Điều lệ                                                         |
| :------------------------------: | :----------------------------------: | :-------------------------------: | :---------------------------------: | :-------------------------------------: | :------------------------------: | :---------------------: | :-------------------: | :--------------------------------------------------------------------------------------------------------------------------------: |
|          **Dashboard**           |            **Toàn quyền**            |          View (Thống kê)          |           View (Thống kê)           |             View (Thống kê)             |         View (Thống kê)          | View (Thống kê cơ bản)  | View (Chỉ số cá nhân) |                   **Điều 14 & 16:** BCN cần nắm bắt tổng quan toàn bộ, các tổ BVH xem thống kê theo chuyên môn.                    |
|   **Members** (Hồ sơ nhân sự)    |            **Toàn quyền**            |          **Toàn quyền**           |                View                 |                  View                   |               View               |  View (Danh sách CLB)   |  Own (Hồ sơ cá nhân)  | **Điều 16 (Khoản 3):** Tổ Nhân sự chịu trách nhiệm "Quản lý hồ sơ thành viên, giám sát quy trình tuyển dụng và đánh giá năng lực". |
| **Requests** (Đơn từ hành chính) | **Toàn quyền** (Phê duyệt cuối cùng) | **Toàn quyền** (Xử lý & Cấp phép) |                View                 |                  View                   |               View               |  Own (Tạo đơn cho ban)  | Own (Tạo đơn cá nhân) |                      **Điều 8:** Tổ Nhân sự tiếp nhận hồ sơ, xét duyệt. BCN ra quyết định xác nhận cuối cùng.                      |
|     **Finance** (Tài chính)      |    **Toàn quyền** (Duyệt chi lớn)    |               View                | **Toàn quyền** (Nhập liệu, Giữ quỹ) |                  None                   |      Own (Tạo yêu cầu chi)       |  Own (Tạo yêu cầu chi)  |         None          |      **Điều 16 & 21:** Tổ Tài chính "Quản lý và kiểm soát thu chi... lập báo cáo". BCN phê duyệt các khoản chi vượt định mức.      |
|  **Discipline** (Kỷ luật & KPI)  | **Toàn quyền** (Khai trừ, Đình chỉ)  |               View                |                None                 | **Toàn quyền** (Ghi nhận & Cảnh cáo L1) |               None               | View (Nhân sự ban mình) |  Own (Xem điểm KPI)   |   **Điều 11b & 16:** Tổ Kỷ luật theo dõi tỷ lệ chuyên cần và áp dụng "Lần 1 (Cảnh cáo nội bộ)". BCN áp dụng "Lần 2" và "Lần 3".    |
|  **Logistics** (Cơ sở vật chất)  |            **Toàn quyền**            |               View                |                View                 |                  None                   | **Toàn quyền** (Lập sổ theo dõi) | Own (Tạo yêu cầu mượn)  |         None          |        **Điều 16 & 22:** Tổ Hậu cần chịu trách nhiệm "Triển khai hậu cần" và "lập sổ theo dõi, kiểm kê định kỳ mỗi học kỳ".        |
| **Generator** (Tạo biểu mẫu AI)  |            **Toàn quyền**            |          **Toàn quyền**           |                View                 |                  View                   |               None               |          None           |         None          |                           Đây là công cụ hỗ trợ cho công tác Hành chính - Nhân sự của Tổ Nhân Sự và BCN.                           |
| **Settings** (Cài đặt hệ thống)  |           **Super Admin**            |          **Admin (HR)**           |         **Admin (Finance)**         |         **Admin (Discipline)**          |      **Admin (Logistics)**       |          User           |         User          |               **Điều 14:** BCN là cơ quan đại diện pháp lý và điều hành cao nhất. Các tổ BVH quản trị module nội bộ.               |

## 3. Quy trình thực thi tiêu biểu (Use-cases)

### 3.1. Phê duyệt chi tiêu tài chính (Điều 21)
- Ban chuyên môn (Tech/Media) gửi *Đơn yêu cầu chi* (Requests).
- **Ban Vận Hành** kiểm tra tính hợp lệ và xuất quỹ nếu trong hạn mức định kỳ.
- Nếu vượt mức hoặc quỹ dự án lớn, hệ thống sẽ yêu cầu tài khoản của **Ban Chủ Nhiệm** vào xác nhận (Approve).
- Ban Vận Hành nhập lịch sử giao dịch vào **FinanceView**.

### 3.4. Hàng chờ duyệt chi trong FinanceView
- Tất cả giao dịch **Chi** mới tạo sẽ đi vào trạng thái **Chờ duyệt** trước khi được tính vào số dư quỹ.
- Vai trò duyệt được xác định theo **policy danh mục**:
	- Danh mục vận hành thường kỳ (ví dụ: Sự kiện, Vật tư) do **BVH Tài chính** duyệt.
	- Danh mục rủi ro cao hoặc quy mô lớn (ví dụ: Đối ngoại, Dự án lớn, Thiết bị) yêu cầu **BCN** duyệt.
- Hành động xoá giao dịch được thực thi theo cơ chế **xoá mềm** để giữ audit trail (người xoá, thời điểm xoá).
- Khi một Request có thông tin tài chính và được duyệt, hệ thống có thể tự sinh giao dịch liên kết trong Finance để theo dõi xuyên suốt.

### 3.2. Xử lý kỷ luật & KPI (Điều 11b)
- Hệ thống tự động ghi nhận vắng mặt.
- Nếu vắng > 2 buổi, **Ban Vận Hành** sử dụng **DisciplineView** để phát hành cảnh cáo Lần 1.
- Nếu tái phạm, hồ sơ chuyển lên cấp **Ban Chủ Nhiệm** để ban hành quyết định đình chỉ hoặc khai trừ. Ban Vận hành sau đó thu hồi quyền truy cập (Điều 22 Khoản 2).

### 3.3. Quy trình kết nạp / Rút khỏi CLB (Điều 8)
- Thành viên nộp form đăng ký / đơn xin rút.
- **Ban Vận Hành** tiếp nhận trong **RequestsView**, kiểm tra các bước bàn giao tài sản (LogisticsView) và tài chính.
- Báo cáo lên **Ban Chủ Nhiệm** ký quyết định, sau đó BVH chuyển trạng thái thành viên (Active/Inactive) trong **MembersView**.

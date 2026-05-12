# Request Approval Flow

```mermaid
flowchart TD
    A[Member tạo yêu cầu] --> B[Hệ thống kiểm tra dữ liệu]
    B --> C{Hợp lệ?}
    C -- Không --> D[Trả lỗi cho người dùng]
    C -- Có --> E[Lưu trạng thái Chờ duyệt]
    E --> F[BVH Nhân Sự xem xét]
    F --> G{Cần BCN duyệt?}
    G -- Có --> H[Chuyển BCN duyệt cuối]
    G -- Không --> I[Phê duyệt yêu cầu]
    H --> I
    I --> J{Có liên kết tài chính?}
    J -- Có --> K[Tạo giao dịch liên kết]
    J -- Không --> L[Kết thúc quy trình]
    K --> L
```

## Mục đích
Mô tả luồng xử lý từ lúc tạo yêu cầu đến khi hệ thống hoàn tất duyệt và sinh giao dịch liên quan nếu cần.

## Điểm kiểm soát
- Kiểm tra quyền người tạo.
- Kiểm tra trạng thái nháp hay đã gửi.
- Tạo audit log cho mọi bước thay đổi trạng thái.

# Expense Approval Flow

```mermaid
flowchart TD
    A[Tạo giao dịch chi] --> B[Đưa vào hàng chờ duyệt]
    B --> C[Kiểm tra danh mục chi]
    C --> D{Danh mục rủi ro cao?}
    D -- Có --> E[YC BCN duyệt]
    D -- Không --> F[BVH Tài Chính duyệt]
    E --> G[Phê duyệt / Từ chối]
    F --> G
    G --> H{Đã duyệt?}
    H -- Có --> I[Cập nhật số dư và trạng thái giao dịch]
    H -- Không --> J[Ghi nhận từ chối]
    I --> K[Kết thúc]
    J --> K
```

## Mục đích
Đặc tả quy trình duyệt chi dựa trên policy danh mục và vai trò phê duyệt.

## Điểm kiểm soát
- Không cho duyệt nếu thiếu quyền.
- Xoá mềm để giữ lịch sử.
- Đồng bộ trạng thái với dashboard và logs.

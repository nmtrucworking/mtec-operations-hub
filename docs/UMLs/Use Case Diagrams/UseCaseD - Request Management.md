# Request Management Use Case Diagram

# Phân tích tác nhân (Actors)

- **Member**: tạo và theo dõi các yêu cầu của cá nhân hoặc ban mình.
- **BVH Nhân Sự**: tiếp nhận, xử lý và duyệt các yêu cầu hành chính.
- **BCN**: duyệt cuối cùng cho các trường hợp vượt thẩm quyền.

# Danh sách Use Case

- Xem danh sách yêu cầu.
- Xem chi tiết yêu cầu.
- Tạo yêu cầu mới.
- Cập nhật yêu cầu khi còn ở trạng thái nháp.
- Gửi yêu cầu để duyệt.
- Phê duyệt hoặc từ chối yêu cầu.
- Xuất danh sách yêu cầu.
- Liên kết yêu cầu với giao dịch tài chính hoặc xử lý hậu cần khi cần.

```mermaid
flowchart LR
    Member((Member))
    HR((BVH Nhân Sự))
    BCN((Ban Chủ Nhiệm))

    subgraph Requests_Module [Phân hệ Quản lý Đơn từ]
        UC1([Xem danh sách yêu cầu])
        UC2([Xem chi tiết yêu cầu])
        UC3([Tạo yêu cầu mới])
        UC4([Cập nhật yêu cầu nháp])
        UC5([Gửi yêu cầu để duyệt])
        UC6([Phê duyệt / Từ chối])
        UC7([Xuất danh sách])
    end

    Member --- UC1
    Member --- UC2
    Member --- UC3
    Member --- UC4
    Member --- UC5

    HR --- UC1
    HR --- UC2
    HR --- UC5
    HR --- UC6
    HR --- UC7

    BCN --- UC1
    BCN --- UC2
    BCN --- UC6
    BCN --- UC7

    UC5 -.-> UC6
```

# RBAC Matrix

| Use Case | Actor cho phép | Ghi chú nghiệp vụ |
|---|---|---|
| Xem danh sách/chi tiết | BCN, BVH Nhân Sự, Member liên quan | Chỉ hiển thị dữ liệu trong phạm vi được phép. |
| Tạo yêu cầu | BCN, BVH Nhân Sự, Member | Chỉ tạo trong phạm vi cá nhân hoặc ban mình. |
| Cập nhật yêu cầu nháp | BCN, BVH Nhân Sự, Member | Không cho sửa sau khi đã gửi duyệt. |
| Gửi yêu cầu | BCN, BVH Nhân Sự, Member | Tạo trạng thái chờ duyệt. |
| Phê duyệt/Từ chối | BVH Nhân Sự, BCN | BCN xử lý cuối cùng với ca vượt hạn mức. |
| Xuất dữ liệu | BCN, BVH Nhân Sự | Có thể áp dụng lọc trước khi xuất. |

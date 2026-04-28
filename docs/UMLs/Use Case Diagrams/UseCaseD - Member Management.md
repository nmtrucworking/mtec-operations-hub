#uml #use-case
```table-of-contents
```
# Phân tích Tác nhân (Actors)

# List of Use Case
- **Xem danh sách thành viên:** Cho phép tìm kiếm theo tên/MSSV, lọc theo Ban hoặc Trạng thái.
- **Xem chi tiết thành viên:** Xem đầy đủ thông tin cá nhân, kỹ năng và định hướng của một thành viên cụ thể.
- **Thêm thành viên:** Khởi tạo hồ sơ mới dựa trên MSSV duy nhất.
- **Cập nhật thông tin:** Chỉnh sửa các trường thông tin (ngoại trừ MSSV).
- **Cập nhật trạng thái:** Chuyển đổi trạng thái giữa `Active` và `Inactive`.
- **Xuất dữ liệu (Export):** Trích xuất danh sách thành viên ra file CSV.
```mermaid
flowchart LR
    %% Actors
    BCN((Ban Chủ Nhiệm))
    HR((BVH Nhân Sự))
    Other((Thành viên/Ban khác))

    %% Use Cases
    subgraph Members_Module [Phân hệ Quản lý Thành viên]
        UC1([Xem danh sách thành viên])
        UC2([Xem chi tiết hồ sơ])
        UC3([Thêm thành viên mới])
        UC4([Cập nhật thông tin])
        UC5([Thay đổi trạng thái\nActive/Inactive])
        UC6([Xuất danh sách CSV])
    end

    %% Associations
    Other --- UC1
    Other --- UC2

    HR --- UC1
    HR --- UC2
    HR --- UC3
    HR --- UC4
    HR --- UC5
    HR --- UC6

    BCN --- UC1
    BCN --- UC2
    BCN --- UC3
    BCN --- UC4
    BCN --- UC5
    BCN --- UC6

    %% Relationships
    UC1 -.->|include| UC2
```

# RBAC Matrix
|**Use Case**|**Actor cho phép**|**Ghi chú nghiệp vụ**|
|---|---|---|
|**Xem danh sách/Chi tiết**|Tất cả các Role (BCN, HR, Finance, Logistics, Member...)|Phục vụ tra cứu nội bộ.|
|**Thêm thành viên**|BCN, BVH_HR|Kiểm tra trùng lặp MSSV và ghi Audit Log.|
|**Cập nhật thông tin**|BCN, BVH_HR|Không được phép sửa MSSV.|
|**Cập nhật trạng thái**|BCN, BVH_HR|Chỉ chấp nhận giá trị `Active` hoặc `Inactive`.|
|**Xuất dữ liệu CSV**|BCN, BVH_HR|Hỗ trợ lọc theo Ban/Trạng thái trước khi xuất.|


# AI Gateway Use Case Diagram

# Phân tích tác nhân (Actors)

- **BCN**: sử dụng công cụ tạo văn bản cho công việc điều hành chung.
- **BVH Nhân Sự**: soạn thảo và xử lý các biểu mẫu hành chính.
- **Ban Chuyên Môn**: có thể xem hoặc dùng theo quyền được cấp.

# Danh sách Use Case

- Chọn mẫu văn bản.
- Nạp ngữ cảnh từ file hoặc Google Sheets.
- Tạo bản nháp bằng AI.
- Chỉnh sửa nội dung đã sinh.
- Xuất văn bản ra DOCX/PDF.
- Lưu lịch sử tạo tài liệu.

```mermaid
flowchart LR
    BCN((BCN))
    HR((BVH Nhân Sự))
    Other((Ban Chuyên Môn))

    subgraph AI_Module [Phân hệ AI Gateway]
        UC1([Chọn mẫu văn bản])
        UC2([Nạp ngữ cảnh đầu vào])
        UC3([Tạo bản nháp AI])
        UC4([Chỉnh sửa nội dung])
        UC5([Xuất DOCX/PDF])
        UC6([Lưu lịch sử tạo tài liệu])
    end

    BCN --- UC1
    BCN --- UC3
    BCN --- UC4
    BCN --- UC5
    BCN --- UC6

    HR --- UC1
    HR --- UC2
    HR --- UC3
    HR --- UC4
    HR --- UC5
    HR --- UC6

    Other --- UC1
    Other --- UC3

    UC2 -.-> UC3
    UC3 -.-> UC5
```

# RBAC Matrix

| Use Case | Actor cho phép | Ghi chú nghiệp vụ |
|---|---|---|
| Chọn mẫu văn bản | BCN, BVH Nhân Sự, Ban Chuyên Môn được cấp quyền | Mẫu dùng để chuẩn hóa đầu ra. |
| Nạp ngữ cảnh đầu vào | BCN, BVH Nhân Sự | Hỗ trợ file upload hoặc link dữ liệu. |
| Tạo bản nháp AI | BCN, BVH Nhân Sự, quyền được cấp | Cần giới hạn rate limit cho endpoint AI. |
| Xuất DOCX/PDF | BCN, BVH Nhân Sự | Có thể xuất theo template đã chọn. |
| Lưu lịch sử | Hệ thống | Phục vụ audit và truy vết nội dung. |

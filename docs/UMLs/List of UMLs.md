```table-of-contents
```

# 1. Behavioral Diagrams
## 1.1. Use Case Diagram

| Phân hệ            | Trạng thái | Links                             |
| ------------------ | ---------- | --------------------------------- |
| Member Management  | Hoàn thành | [[UseCaseD - Member Management]]  |
| Request Management | Hoàn thành | [[UseCaseD - Request Management]] |
| Finance Management | Hoàn thành | [[UseCaseD - Finance Management]] |
| AI Gateway         | Hoàn thành | [[UseCaseD - AI Gateway]]         |

## 1.2. Activity Diagram
Đặc tả các quy trình nghiệp vụ (Wokflow) phức tạp:

| Sơ đồ | Đặc tả | Links |
| ----- | ------ | ----- |
| Request Approval Flow | Từ lúc Member tạo đơn đến khi BCN/HR duyệt và hệ thống tự động tạo giao dịch tài chính liên kết. | [[Activity Diagrams/Request Approval Flow]] |
| Expense Approval Flow | Luồng kiểm tra vai trò phê duyệt (Required Approval Role) dựa trên danh mục chi phí (Category) | [[Activity Diagrams/Expense Approval Flow]] |

## 1.3. State Machine Diagram

| Sơ đồ | Đặc tả | Links |
| ----- | ------ | ----- |
| Request Lifecycle | Vòng đời của yêu cầu từ nháp đến đóng hồ sơ | [[State Machine Diagrams/Request Lifecycle]] |
| Transaction Lifecycle | Vòng đời của giao dịch tài chính và xoá mềm | [[State Machine Diagrams/Transaction Lifecycle]] |

# 2. Interaction Diagrams
## 2.1. Sequence Diagram

| Sơ đồ | Đặc tả | Links |
| ----- | ------ | ----- |
| Auth Flow | Luồng đăng nhập và cấp token | [[Sequence Diagrams/Auth Flow]] |
| Request to Finance | Luồng duyệt request và sinh giao dịch liên kết | [[Sequence Diagrams/Request to Finance]] |
| AI Insight | Luồng gửi prompt đến Gemini và lưu log | [[Sequence Diagrams/AI Insight]] |

# 3. Structural Diagrams

## 3.1. Class Diagram

| Sơ đồ | Đặc tả | Links |
| ----- | ------ | ----- |
| Class Diagram | Các thực thể dữ liệu và quan hệ chính | [[Structural Diagrams/Class Diagram]] |

## 3.2. Package Diagram

| Sơ đồ | Đặc tả | Links |
| ----- | ------ | ----- |
| Package Diagram | Kiến trúc phân lớp backend | [[Structural Diagrams/Package Diagram]] |

## 3.3. Deployment Diagram

| Sơ đồ | Đặc tả | Links |
| ----- | ------ | ----- |
| Deployment Diagram | Triển khai Frontend, Nginx, API và Database | [[Structural Diagrams/Deployment Diagram]] |

# 4. Data Modeling

## 4.1. ERD

| Sơ đồ | Đặc tả | Links |
| ----- | ------ | ----- |
| ERD | Mô hình dữ liệu các bảng chính | [[Data Modeling/ERD]] |

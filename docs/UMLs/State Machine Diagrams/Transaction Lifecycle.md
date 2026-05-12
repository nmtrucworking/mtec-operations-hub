# Transaction Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PendingApproval
    PendingApproval --> Approved: approve
    PendingApproval --> Rejected: reject
    Approved --> Posted: persist to ledger
    Posted --> SoftDeleted: delete soft
    Rejected --> Archived: archive
    SoftDeleted --> Archived: retain audit trail
    Archived --> [*]
```

## Mục đích
Mô tả vòng đời của giao dịch tài chính và cách xoá mềm được giữ lại để audit.

## Trạng thái chính
- PendingApproval
- Approved
- Posted
- SoftDeleted
- Archived
- Rejected

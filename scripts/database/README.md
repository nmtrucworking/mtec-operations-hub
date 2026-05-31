# Database handover scripts

Thư mục này chứa script SQL phục vụ bàn giao dữ liệu ban đầu cho CLB MTEC.

## Files

| File | Mục đích |
|---|---|
| `reset_database.sql` | Xóa dữ liệu vận hành hiện có để đưa database về trạng thái sạch trước khi seed. |
| `seed_members.sql` | Chèn/cập nhật danh sách thành viên và kỹ năng bàn giao. |

## Yêu cầu

- PostgreSQL database đã được migrate theo backend hiện tại.
- Có `psql` trong terminal.
- Có biến môi trường `DATABASE_URL`.

Ví dụ:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/mtec_operations_hub"
```

## Chạy reset database

Script reset có cờ xác nhận để tránh chạy nhầm:

```bash
psql "$DATABASE_URL" -v confirm_reset=1 -f scripts/database/reset_database.sql
```

Mặc định script giữ lại các bảng cấu hình/xác thực:

- `users`
- `roles`
- `user_roles`
- `settings_notifications`
- `evaluation_criteria`

Script xóa dữ liệu vận hành như members, skills, attendance, meetings, finance, assets, discipline, evaluation runtime và audit logs.

## Chạy seed thành viên

```bash
psql "$DATABASE_URL" -f scripts/database/seed_members.sql
```

Script seed có tính idempotent theo `members.mssv`:

- Nếu MSSV chưa tồn tại: insert member mới.
- Nếu MSSV đã tồn tại: update thông tin member.
- Kỹ năng của các MSSV trong seed list sẽ được xóa và chèn lại để đồng bộ.

## Chạy toàn bộ quy trình bàn giao

```bash
psql "$DATABASE_URL" -v confirm_reset=1 -f scripts/database/reset_database.sql
psql "$DATABASE_URL" -f scripts/database/seed_members.sql
```

Hoặc dùng npm scripts ở root repo:

```bash
npm run db:reset
npm run db:seed:members
```

## Kiểm tra sau khi seed

```sql
SELECT COUNT(*) FROM members;
SELECT COUNT(*) FROM member_skills;
SELECT ban, status, COUNT(*) FROM members GROUP BY ban, status ORDER BY ban, status;
```

Kỳ vọng với seed hiện tại:

- `members`: 23 bản ghi.
- `member_skills`: 88 bản ghi.

-- MTEC Operations Hub - Member Seed Script
-- Purpose: insert/update handover member records for CLB MTEC.
--
-- Usage:
--   psql "$DATABASE_URL" -f scripts/database/seed_members.sql
--
-- Notes:
--   - The script is idempotent by members.mssv.
--   - It refreshes skills for the seeded MSSV list.
--   - It does not create application users or login accounts.

\set ON_ERROR_STOP on

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH seed_members (
  id,
  mssv,
  name,
  gender,
  dob,
  ban,
  role_title,
  status,
  phone,
  email,
  join_date,
  lop,
  chuyen_nganh,
  khoa,
  address,
  experience,
  goal,
  orientation
) AS (
  VALUES
  ('mtec-member-0001', '2400003987', 'Nguyễn Minh Trúc', 'Nam', '2006-05-08', 'Ban Chủ nhiệm', 'Phó Chủ nhiệm', 'Active', '0917137387', 'nmtruc.study@gmail.com', '2026-05-26', '24DTH1', 'Khoa học Dữ liệu', 'Công nghệ Thông tin', 'Quận 4, TP. HCM', 'Có kinh nghiệm hỗ trợ tổ chức sự kiện học thuật.', 'Phát triển kỹ năng quản trị dự án và lãnh đạo.', 'Trở thành Data Scientist trong 3 năm tới.'),
  ('mtec-member-0002', '2500018535', 'Nguyễn Thị Ngọc Ngân', 'Nữ', '2007-11-16', 'Ban Truyền thông', 'Thành viên', 'Active', '0344006801', '2500018535@nttu.edu.vn', '2026-05-26', '25DTT1', 'Truyền thông Đa phương tiện', 'Truyền thông Sáng tạo', 'Quận 12, TP. HCM', 'Đã quản lý page bán hàng online nhỏ.', 'Học quy trình sản xuất media chuyên nghiệp.', 'Định hướng Social Media Manager.'),
  ('mtec-member-0003', '2500017768', 'Hoàng Thị Út Linh', 'Nữ', '2007-06-02', 'Ban Công nghệ', 'Thành viên', 'Active', '0817846667', 'utlinhdepgai@gmail.com', '2026-05-26', '25DPM2', 'Kỹ thuật Phần mềm', 'Công nghệ Thông tin', 'Gò Vấp, TP. HCM', 'Đang tự học Frontend.', 'Tìm team để code dự án thực tế.', 'Trở thành Fullstack Developer.'),
  ('mtec-member-0004', '2500021001', 'Lê Quốc Huy', 'Nam', '2007-03-12', 'Ban Công nghệ', 'Thành viên', 'Active', '0901200304', '2500021001@nttu.edu.vn', '2026-01-02', '25DTT2', 'Khoa học Dữ liệu', 'Công nghệ Thông tin', 'Thủ Đức, TP. HCM', 'Tham gia dự án phân tích dữ liệu học tập.', 'Nâng cao năng lực machine learning.', 'Data Analyst trong 2 năm tới.'),
  ('mtec-member-0005', '2500021002', 'Trần Bảo Ngọc', 'Nữ', '2007-07-21', 'Ban Truyền thông', 'Thành viên', 'Active', '0901200305', '2500021002@nttu.edu.vn', '2026-01-03', '25DTT1', 'Truyền thông Đa phương tiện', 'Truyền thông Sáng tạo', 'Bình Thạnh, TP. HCM', 'Đã thực tập tại studio media nhỏ.', 'Xây dựng profile truyền thông chuyên nghiệp.', 'Content Creator toàn thời gian.'),
  ('mtec-member-0006', '2500021003', 'Phạm Đức Anh', 'Nam', '2006-02-03', 'Ban Chủ nhiệm', 'Thành viên', 'Inactive', '0901200306', '2500021003@nttu.edu.vn', '2026-01-05', '24DQT1', 'Quản trị Kinh doanh', 'Kinh tế - Quản trị', 'Quận 7, TP. HCM', 'Hỗ trợ điều phối nhân sự cho sự kiện sinh viên.', 'Cải thiện kỹ năng quản trị vận hành.', 'Operations Executive.'),
  ('mtec-member-0007', '2500021004', 'Võ Gia Hân', 'Nữ', '2007-12-27', 'Ban Truyền thông', 'Thành viên', 'Active', '0901200307', '2500021004@nttu.edu.vn', '2026-01-08', '25DPR1', 'Quan hệ Công chúng', 'Truyền thông Sáng tạo', 'Quận 10, TP. HCM', 'Tham gia đội truyền thông cấp khoa.', 'Nâng cao kỹ năng PR nội bộ.', 'Chuyên viên truyền thông doanh nghiệp.'),
  ('mtec-member-0008', '2500021005', 'Nguyễn Tiến Đạt', 'Nam', '2007-09-09', 'Ban Công nghệ', 'Thành viên', 'Active', '0901200308', '2500021005@nttu.edu.vn', '2026-01-10', '25DPM1', 'Kỹ thuật Phần mềm', 'Công nghệ Thông tin', 'Tân Bình, TP. HCM', 'Đã xây dựng website portfolio cá nhân.', 'Làm chủ fullstack stack JavaScript.', 'Frontend Developer.'),
  ('mtec-member-0009', '2500021006', 'Bùi Thảo My', 'Nữ', '2008-01-14', 'Ban Chủ nhiệm', 'Thành viên', 'Inactive', '0901200309', '2500021006@nttu.edu.vn', '2026-01-12', '25DTN1', 'Tài chính - Ngân hàng', 'Kinh tế - Quản trị', 'Quận 6, TP. HCM', 'Hỗ trợ thu chi cho đội nhóm học tập.', 'Hiểu quy trình quản lý tài chính CLB.', 'Chuyên viên tài chính vận hành.'),
  ('mtec-member-0010', '2500021007', 'Đỗ Minh Quân', 'Nam', '2007-08-18', 'Ban Công nghệ', 'Thành viên', 'Active', '0901200310', '2500021007@nttu.edu.vn', '2026-01-15', '25DAT1', 'An toàn Thông tin', 'Công nghệ Thông tin', 'Phú Nhuận, TP. HCM', 'Đã học CTF cơ bản trên nền tảng online.', 'Nâng cao kiến thức ATTT ứng dụng.', 'Security Engineer.'),
  ('mtec-member-0011', '2500021008', 'Đặng Nhật Lê', 'Nam', '2007-11-01', 'Ban Truyền thông', 'Thành viên', 'Active', '0901200311', '2500021008@nttu.edu.vn', '2026-01-18', '25DGD1', 'Thiết kế Đồ hoạ', 'Truyền thông Sáng tạo', 'Gò Vấp, TP. HCM', 'Freelance thiết kế poster sự kiện.', 'Xây dựng bộ nhận diện cho CLB.', 'Graphic Designer.'),
  ('mtec-member-0012', '2500021009', 'Lê Phương Anh', 'Nữ', '2007-05-24', 'Ban Chủ nhiệm', 'Thành viên', 'Active', '0901200312', '2500021009@nttu.edu.vn', '2026-01-20', '25DMA1', 'Marketing', 'Kinh tế - Quản trị', 'Hóc Môn, TP. HCM', 'Đã tham gia các chiến dịch truyền thông sinh viên.', 'Áp dụng marketing vào tuyển thành viên.', 'Marketing Operations.'),
  ('mtec-member-0013', '2500021010', 'Huỳnh Gia Bảo', 'Nam', '2007-10-04', 'Ban Công nghệ', 'Thành viên', 'Active', '0901200313', '2500021010@nttu.edu.vn', '2026-01-22', '25DMN1', 'Mạng Máy tính', 'Công nghệ Thông tin', 'Thủ Đức, TP. HCM', 'Từng hỗ trợ setup LAN cho sự kiện học tập.', 'Thông thạo vận hành hạ tầng nhỏ.', 'Network Administrator.'),
  ('mtec-member-0014', '2500021011', 'Nguyễn Hà Vy', 'Nữ', '2008-06-06', 'Ban Truyền thông', 'Thành viên', 'Inactive', '0901200314', '2500021011@nttu.edu.vn', '2026-01-24', '25DAN1', 'Ngôn ngữ Anh', 'Ngoại ngữ', 'Quận 8, TP. HCM', 'Cộng tác viên dịch bài cho CLB học thuật.', 'Đồng bộ nội dung song ngữ cho fanpage.', 'Content Localization Specialist.'),
  ('mtec-member-0015', '2500021012', 'Trịnh Đức Tài', 'Nam', '2007-03-30', 'Ban Chủ nhiệm', 'Thành viên', 'Active', '0901200315', '2500021012@nttu.edu.vn', '2026-01-26', '25DQT2', 'Quản trị Kinh doanh', 'Kinh tế - Quản trị', 'Bình Chánh, TP. HCM', 'Tổ trưởng nhóm dự án môn học.', 'Hỗ trợ tối ưu quy trình CLB.', 'Project Coordinator.'),
  ('mtec-member-0016', '2500021013', 'Trần Thị Ý Nhi', 'Nữ', '2008-04-11', 'Ban Công nghệ', 'Thành viên', 'Active', '0901200316', '2500021013@nttu.edu.vn', '2026-01-28', '25DAI1', 'Trí tuệ Nhân tạo', 'Công nghệ Thông tin', 'Tân Phú, TP. HCM', 'Tham gia nhóm nghiên cứu AI cấp trường.', 'Xây dựng mô hình dự đoán cho dữ liệu nội bộ.', 'AI Engineer.'),
  ('mtec-member-0017', '2500021014', 'Phạm Minh Châu', 'Nữ', '2007-02-19', 'Ban Truyền thông', 'Thành viên', 'Active', '0901200317', '2500021014@nttu.edu.vn', '2026-01-30', '25DNT1', 'Ngôn ngữ Trung', 'Ngoại ngữ', 'Quận 5, TP. HCM', 'Tình nguyện viên truyền thông sự kiện văn hóa.', 'Mở rộng kênh nội dung đa ngôn ngữ.', 'Communications Specialist.'),
  ('mtec-member-0018', '2500021015', 'Nguyễn Hoàng Sơn', 'Nam', '2006-09-22', 'Ban Công nghệ', 'Thành viên', 'Inactive', '0901200318', '2500021015@nttu.edu.vn', '2026-02-01', '24DPM2', 'Kỹ thuật Phần mềm', 'Công nghệ Thông tin', 'Quận 11, TP. HCM', 'Tham gia dự án môn học theo scrum.', 'Cải thiện chất lượng code và review.', 'Software Engineer.'),
  ('mtec-member-0019', '2500021016', 'Đoàn Thị Kim Ngân', 'Nữ', '2008-01-05', 'Ban Chủ nhiệm', 'Thành viên', 'Active', '0901200319', '2500021016@nttu.edu.vn', '2026-02-03', '25DMA2', 'Marketing', 'Kinh tế - Quản trị', 'Quận 3, TP. HCM', 'Đã tham gia CLB marketing cấp khoa.', 'Ứng dụng marketing vào tuyển sinh CLB.', 'Marketing Analyst.'),
  ('mtec-member-0020', '2500021017', 'Lâm Quỳnh Như', 'Nữ', '2008-07-17', 'Ban Truyền thông', 'Thành viên', 'Active', '0901200320', '2500021017@nttu.edu.vn', '2026-02-05', '25DNJ1', 'Ngôn ngữ Nhật', 'Ngoại ngữ', 'Tân Phú, TP. HCM', 'Cộng tác viên truyền thông cho khoa.', 'Đồng bộ thông điệp truyền thông nội bộ.', 'Event Communication.'),
  ('mtec-member-0021', '2500021018', 'Lê Thành Công', 'Nam', '2007-06-28', 'Ban Công nghệ', 'Thành viên', 'Active', '0901200321', '2500021018@nttu.edu.vn', '2026-02-08', '25DTT3', 'Khoa học Dữ liệu', 'Công nghệ Thông tin', 'Quận 9, TP. HCM', 'Tham gia cuộc thi phân tích dữ liệu cấp trường.', 'Dùng dashboard để theo dõi vận hành.', 'Business Intelligence Analyst.'),
  ('mtec-member-0022', '2500021019', 'Trần Mai Anh', 'Nữ', '2008-03-13', 'Ban Chủ nhiệm', 'Thành viên', 'Inactive', '0901200322', '2500021019@nttu.edu.vn', '2026-02-10', '25DTN2', 'Tài chính - Ngân hàng', 'Kinh tế - Quản trị', 'Nhà Bè, TP. HCM', 'Hỗ trợ tổng hợp chi phí sự kiện nhóm.', 'Hiểu dòng tiền và kế hoạch ngân sách.', 'Finance Operations.'),
  ('mtec-member-0023', '2500021020', 'Phan Anh Khoa', 'Nam', '2007-12-07', 'Ban Truyền thông', 'Thành viên', 'Active', '0901200323', '2500021020@nttu.edu.vn', '2026-02-12', '25DGD2', 'Thiết kế Đồ hoạ', 'Truyền thông Sáng tạo', 'Quận 1, TP. HCM', 'Đã thiết kế visual cho nhiều sự kiện sinh viên.', 'Nâng cấp chất lượng hình ảnh truyền thông CLB.', 'Visual Designer.')
), upserted AS (
  INSERT INTO members (
    id, mssv, name, gender, dob, ban, role_title, status, phone, email,
    join_date, lop, chuyen_nganh, khoa, address, experience, goal, orientation,
    created_at, updated_at
  )
  SELECT
    id,
    mssv,
    name,
    gender,
    dob::date,
    ban,
    role_title,
    status,
    phone,
    email,
    join_date::date,
    lop,
    chuyen_nganh,
    khoa,
    address,
    experience,
    goal,
    orientation,
    NOW(),
    NOW()
  FROM seed_members
  ON CONFLICT (mssv) DO UPDATE SET
    name = EXCLUDED.name,
    gender = EXCLUDED.gender,
    dob = EXCLUDED.dob,
    ban = EXCLUDED.ban,
    role_title = EXCLUDED.role_title,
    status = EXCLUDED.status,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    join_date = EXCLUDED.join_date,
    lop = EXCLUDED.lop,
    chuyen_nganh = EXCLUDED.chuyen_nganh,
    khoa = EXCLUDED.khoa,
    address = EXCLUDED.address,
    experience = EXCLUDED.experience,
    goal = EXCLUDED.goal,
    orientation = EXCLUDED.orientation,
    updated_at = NOW()
  RETURNING id, mssv
)
SELECT COUNT(*) AS upserted_members FROM upserted;

WITH seeded_mssv(mssv) AS (
  VALUES
    ('2400003987'), ('2500018535'), ('2500017768'), ('2500021001'), ('2500021002'),
    ('2500021003'), ('2500021004'), ('2500021005'), ('2500021006'), ('2500021007'),
    ('2500021008'), ('2500021009'), ('2500021010'), ('2500021011'), ('2500021012'),
    ('2500021013'), ('2500021014'), ('2500021015'), ('2500021016'), ('2500021017'),
    ('2500021018'), ('2500021019'), ('2500021020')
)
DELETE FROM member_skills
WHERE member_id IN (
  SELECT members.id
  FROM members
  JOIN seeded_mssv ON seeded_mssv.mssv = members.mssv
);

WITH seed_skills(mssv, type, name, level) AS (
  VALUES
  ('2400003987', 'hard', 'Lập trình / Website', 'Tốt'),
  ('2400003987', 'hard', 'Thiết kế', 'Cơ bản'),
  ('2400003987', 'soft', 'Giao tiếp', 'Tốt'),
  ('2400003987', 'soft', 'Làm việc nhóm', 'Tốt'),
  ('2500018535', 'hard', 'Quản lý Fanpage', 'Tốt'),
  ('2500018535', 'soft', 'Sáng tạo', 'Tốt'),
  ('2500017768', 'hard', 'Lập trình / Website', 'Cơ bản'),
  ('2500017768', 'soft', 'Giải quyết vấn đề', 'Trung bình'),
  ('2500021001', 'hard', 'Python', 'Tốt'),
  ('2500021001', 'hard', 'SQL', 'Trung bình'),
  ('2500021001', 'soft', 'Tư duy logic', 'Tốt'),
  ('2500021001', 'soft', 'Làm việc nhóm', 'Trung bình'),
  ('2500021002', 'hard', 'Canva', 'Tốt'),
  ('2500021002', 'hard', 'Quay dựng video', 'Trung bình'),
  ('2500021002', 'soft', 'Sáng tạo nội dung', 'Tốt'),
  ('2500021002', 'soft', 'Thuyết trình', 'Trung bình'),
  ('2500021003', 'hard', 'Lập kế hoạch', 'Trung bình'),
  ('2500021003', 'hard', 'Excel', 'Tốt'),
  ('2500021003', 'soft', 'Quản lý thời gian', 'Trung bình'),
  ('2500021003', 'soft', 'Đàm phán', 'Cơ bản'),
  ('2500021004', 'hard', 'Viết thông cáo', 'Trung bình'),
  ('2500021004', 'hard', 'Tổ chức sự kiện', 'Trung bình'),
  ('2500021004', 'soft', 'Giao tiếp', 'Tốt'),
  ('2500021004', 'soft', 'Kết nối đối tác', 'Trung bình'),
  ('2500021005', 'hard', 'React', 'Trung bình'),
  ('2500021005', 'hard', 'Node.js', 'Cơ bản'),
  ('2500021005', 'soft', 'Tự học', 'Tốt'),
  ('2500021005', 'soft', 'Báo cáo công việc', 'Trung bình'),
  ('2500021006', 'hard', 'Tổng hợp số liệu', 'Trung bình'),
  ('2500021006', 'hard', 'Lập ngân sách', 'Cơ bản'),
  ('2500021006', 'soft', 'Cẩn thận', 'Tốt'),
  ('2500021006', 'soft', 'Kỷ luật', 'Tốt'),
  ('2500021007', 'hard', 'Bảo mật web cơ bản', 'Trung bình'),
  ('2500021007', 'hard', 'Linux', 'Cơ bản'),
  ('2500021007', 'soft', 'Phân tích rủi ro', 'Trung bình'),
  ('2500021007', 'soft', 'Giải quyết vấn đề', 'Tốt'),
  ('2500021008', 'hard', 'Photoshop', 'Tốt'),
  ('2500021008', 'hard', 'Illustrator', 'Trung bình'),
  ('2500021008', 'soft', 'Nhận diện thương hiệu', 'Trung bình'),
  ('2500021008', 'soft', 'Làm việc nhóm', 'Trung bình'),
  ('2500021009', 'hard', 'Nghiên cứu người dùng', 'Trung bình'),
  ('2500021009', 'hard', 'Báo cáo KPI', 'Cơ bản'),
  ('2500021009', 'soft', 'Tổ chức công việc', 'Tốt'),
  ('2500021009', 'soft', 'Tư duy hệ thống', 'Trung bình'),
  ('2500021010', 'hard', 'Cấu hình mạng cơ bản', 'Trung bình'),
  ('2500021010', 'hard', 'MikroTik', 'Cơ bản'),
  ('2500021010', 'soft', 'Tính kỷ luật', 'Tốt'),
  ('2500021010', 'soft', 'Hỗ trợ kỹ thuật', 'Trung bình'),
  ('2500021011', 'hard', 'Biên tập nội dung Anh-Việt', 'Tốt'),
  ('2500021011', 'hard', 'Proofreading', 'Trung bình'),
  ('2500021011', 'soft', 'Linh hoạt', 'Trung bình'),
  ('2500021011', 'soft', 'Lắng nghe', 'Tốt'),
  ('2500021012', 'hard', 'Quản trị công việc', 'Trung bình'),
  ('2500021012', 'hard', 'Notion', 'Trung bình'),
  ('2500021012', 'soft', 'Lãnh đạo nhóm nhỏ', 'Trung bình'),
  ('2500021012', 'soft', 'Giao tiếp nội bộ', 'Tốt'),
  ('2500021013', 'hard', 'Machine Learning cơ bản', 'Trung bình'),
  ('2500021013', 'hard', 'NumPy', 'Trung bình'),
  ('2500021013', 'soft', 'Nghiên cứu độc lập', 'Tốt'),
  ('2500021013', 'soft', 'Đặt câu hỏi', 'Trung bình'),
  ('2500021014', 'hard', 'Biên dịch cơ bản', 'Trung bình'),
  ('2500021014', 'hard', 'Nội dung mạng xã hội', 'Cơ bản'),
  ('2500021014', 'soft', 'Kiên nhẫn', 'Tốt'),
  ('2500021014', 'soft', 'Kết nối cộng đồng', 'Trung bình'),
  ('2500021015', 'hard', 'TypeScript', 'Trung bình'),
  ('2500021015', 'hard', 'Git', 'Trung bình'),
  ('2500021015', 'soft', 'Tư duy phân tích', 'Tốt'),
  ('2500021015', 'soft', 'Bảo trì tài liệu', 'Cơ bản'),
  ('2500021016', 'hard', 'Phân tích chiến dịch', 'Cơ bản'),
  ('2500021016', 'hard', 'Báo cáo dữ liệu', 'Trung bình'),
  ('2500021016', 'soft', 'Tổng hợp thông tin', 'Tốt'),
  ('2500021016', 'soft', 'Làm việc đa nhiệm', 'Trung bình'),
  ('2500021017', 'hard', 'Viết nội dung sự kiện', 'Trung bình'),
  ('2500021017', 'hard', 'Chụp ảnh cơ bản', 'Cơ bản'),
  ('2500021017', 'soft', 'Tinh thần trách nhiệm', 'Tốt'),
  ('2500021017', 'soft', 'Phản hồi nhanh', 'Trung bình'),
  ('2500021018', 'hard', 'Power BI', 'Trung bình'),
  ('2500021018', 'hard', 'Pandas', 'Trung bình'),
  ('2500021018', 'soft', 'Giải trình số liệu', 'Trung bình'),
  ('2500021018', 'soft', 'Tính chủ động', 'Tốt'),
  ('2500021019', 'hard', 'Quản lý chi phí', 'Trung bình'),
  ('2500021019', 'hard', 'Kế toán căn bản', 'Cơ bản'),
  ('2500021019', 'soft', 'Cân bằng công việc', 'Trung bình'),
  ('2500021019', 'soft', 'Tư duy trách nhiệm', 'Tốt'),
  ('2500021020', 'hard', 'Figma', 'Trung bình'),
  ('2500021020', 'hard', 'Thiết kế social post', 'Tốt'),
  ('2500021020', 'soft', 'Tiếp nhận feedback', 'Tốt'),
  ('2500021020', 'soft', 'Phối hợp liên ban', 'Trung bình')
)
INSERT INTO member_skills (id, member_id, type, name, level)
SELECT gen_random_uuid()::text, members.id, seed_skills.type, seed_skills.name, seed_skills.level
FROM seed_skills
JOIN members ON members.mssv = seed_skills.mssv;

COMMIT;

SELECT COUNT(*) AS seeded_members
FROM members
WHERE mssv IN (
  '2400003987', '2500018535', '2500017768', '2500021001', '2500021002',
  '2500021003', '2500021004', '2500021005', '2500021006', '2500021007',
  '2500021008', '2500021009', '2500021010', '2500021011', '2500021012',
  '2500021013', '2500021014', '2500021015', '2500021016', '2500021017',
  '2500021018', '2500021019', '2500021020'
);

SELECT COUNT(*) AS seeded_member_skills
FROM member_skills
WHERE member_id IN (
  SELECT id FROM members
  WHERE mssv IN (
    '2400003987', '2500018535', '2500017768', '2500021001', '2500021002',
    '2500021003', '2500021004', '2500021005', '2500021006', '2500021007',
    '2500021008', '2500021009', '2500021010', '2500021011', '2500021012',
    '2500021013', '2500021014', '2500021015', '2500021016', '2500021017',
    '2500021018', '2500021019', '2500021020'
  )
);

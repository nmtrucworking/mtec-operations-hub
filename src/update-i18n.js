const fs = require('fs');
const path = require('path');

const viPath = path.join(__dirname, 'i18n', 'locales', 'vi.json');
const enPath = path.join(__dirname, 'i18n', 'locales', 'en.json');

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newVi = {
  "members": {
    "title": "Quản lý Thành viên",
    "subtitle": "Hồ sơ nhân sự CLB ({{count}} kết quả)",
    "exportBtn": "Xuất Excel",
    "addBtn": "Thêm thành viên",
    "searchPlaceholder": "Tìm theo tên hoặc MSSV",
    "filterDeptAll": "Tất cả Ban",
    "filterStatusAll": "Mọi trạng thái",
    "statusActive": "Đang hoạt động",
    "statusInactive": "Đã nghỉ",
    "thStt": "STT",
    "thName": "Họ và tên",
    "thMssv": "MSSV",
    "thDept": "Ban trực thuộc",
    "thRole": "Chức vụ",
    "thStatus": "Trạng thái",
    "thAction": "Thao tác",
    "viewDetail": "Xem chi tiết",
    "emptyState": "Không tìm thấy thành viên phù hợp.",
    "profileTitle": "Hồ sơ chi tiết",
    "lblGender": "Giới tính",
    "lblDob": "Ngày sinh",
    "lblPhone": "Số điện thoại",
    "lblEmail": "Email",
    "lblAddress": "Địa chỉ",
    "lblMajor": "Chuyên ngành",
    "skills": "Kỹ năng",
    "goals": "Mục tiêu và định hướng",
    "notUpdated": "Chưa cập nhật",
    "noExperience": "Chưa cập nhật kinh nghiệm",
    "experience": "Kinh nghiệm",
    "close": "Đóng",
    "update": "Cập nhật"
  }
};

const newEn = {
  "members": {
    "title": "Members Management",
    "subtitle": "Club HR Profiles ({{count}} results)",
    "exportBtn": "Export Excel",
    "addBtn": "Add Member",
    "searchPlaceholder": "Search by name or ID",
    "filterDeptAll": "All Departments",
    "filterStatusAll": "All Statuses",
    "statusActive": "Active",
    "statusInactive": "Inactive",
    "thStt": "No.",
    "thName": "Full Name",
    "thMssv": "Student ID",
    "thDept": "Department",
    "thRole": "Role",
    "thStatus": "Status",
    "thAction": "Actions",
    "viewDetail": "View details",
    "emptyState": "No matching members found.",
    "profileTitle": "Detailed Profile",
    "lblGender": "Gender",
    "lblDob": "Date of Birth",
    "lblPhone": "Phone",
    "lblEmail": "Email",
    "lblAddress": "Address",
    "lblMajor": "Major",
    "skills": "Skills",
    "goals": "Goals & Orientation",
    "notUpdated": "Not updated",
    "noExperience": "Experience not updated",
    "experience": "Experience",
    "close": "Close",
    "update": "Update"
  }
};

Object.assign(viData, newVi);
Object.assign(enData, newEn);

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
console.log('i18n JSON files updated.');

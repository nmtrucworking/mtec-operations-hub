export type SkillLevel = 'Tốt' | 'Trung bình' | 'Cơ bản';

export const FACULTY_MAJOR_MAP: Record<string, string[]> = {
  'Công nghệ Thông tin': ['Khoa học Dữ liệu', 'Kỹ thuật Phần mềm', 'An toàn Thông tin', 'Mạng Máy tính', 'Trí tuệ Nhân tạo'],
  'Truyền thông Sáng tạo': ['Truyền thông Đa phương tiện', 'Quan hệ Công chúng', 'Thiết kế Đồ hoạ'],
  'Kinh tế - Quản trị': ['Quản trị Kinh doanh', 'Marketing', 'Tài chính - Ngân hàng'],
  'Ngoại ngữ': ['Ngôn ngữ Anh', 'Ngôn ngữ Trung', 'Ngôn ngữ Nhật'],
  'Khác': ['Khác']
};


export interface MemberSkill {
  name: string;
  level: SkillLevel;
}

export const DEPARTMENTS = ['Ban Chu nhiem', 'Ban Cong nghe', 'Ban Truyen thong'];

const compareText = (left: string, right: string) => left.localeCompare(right, 'vi', { sensitivity: 'base' });

export const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeBanList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeBanList(item));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return normalizeBanList(record.ban ?? record.department ?? record.name ?? record.title);
  }

  const text = String(value ?? '').trim();
  if (!text) {
    return [];
  }

  return text
    .split(/[,;/\n|]+/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
};

export const formatBanList = (value: unknown): string => {
  const uniqueBans = Array.from(new Set(normalizeBanList(value)));
  uniqueBans.sort(compareText);
  return uniqueBans.join(', ');
};

export const banListMatches = (value: unknown, target: string): boolean => {
  const normalizedTarget = normalizeText(target);
  if (!normalizedTarget) {
    return false;
  }

  return normalizeBanList(value).some((item) => {
    const normalizedItem = normalizeText(item);
    return (
      normalizedItem === normalizedTarget ||
      normalizedItem.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedItem)
    );
  });
};

export const compareBanLists = (left: unknown, right: unknown): number => formatBanList(left).localeCompare(formatBanList(right), 'vi', { sensitivity: 'base' });

export interface Member {
  id: number;
  mssv: string;
  name: string;
  gender: string;
  dob: string;
  ban: string[];
  role: string;
  status: 'Active' | 'Inactive';
  phone: string;
  email: string;
  joinDate: string;
  lop: string;
  chuyenNganh: string;
  khoa: string;
  address: string;
  hardSkills: MemberSkill[];
  softSkills: MemberSkill[];
  experience: string;
  goal: string;
  orientation: string;
}

export const mockMembers: Member[] = [
  {
    id: 1,
    mssv: '2400003987',
    name: 'Nguyen Minh Truc',
    gender: 'Nam',
    dob: '08/05/2006',
    ban: ['Ban Chu nhiem'],
    role: 'Pho Chu nhiem',
    status: 'Active',
    phone: '0917137387',
    email: 'nmtruc.study@gmail.com',
    joinDate: '26/05/2026',
    lop: '24DTH1',
    chuyenNganh: 'Khoa hoc Du lieu',
    khoa: 'Cong nghe Thong tin',
    address: 'Quan 4, TP. HCM',
    hardSkills: [
      { name: 'Lap trinh / Website', level: 'Tốt' },
      { name: 'Thiet ke', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'Giao tiep', level: 'Tốt' },
      { name: 'Lam viec nhom', level: 'Tốt' }
    ],
    experience: 'Co kinh nghiem ho tro to chuc su kien hoc thuat.',
    goal: 'Phat trien ky nang quan tri du an va lanh dao.',
    orientation: 'Tro thanh Data Scientist trong 3 nam toi.'
  },
  {
    id: 2,
    mssv: '2500018535',
    name: 'Nguyen Thi Ngoc Ngan',
    gender: 'Nu',
    dob: '16/11/2007',
    ban: ['Ban Truyen thong'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0344006801',
    email: '2500018535@nttu.edu.vn',
    joinDate: '26/05/2026',
    lop: '25DTT1',
    chuyenNganh: 'Truyen thong Da phuong tien',
    khoa: 'Truyen thong Sang tao',
    address: 'Quan 12, TP. HCM',
    hardSkills: [{ name: 'Quan ly Fanpage', level: 'Tốt' }],
    softSkills: [{ name: 'Sang tao', level: 'Tốt' }],
    experience: 'Da quan ly page ban hang online nho.',
    goal: 'Hoc quy trinh san xuat media chuyen nghiep.',
    orientation: 'Dinh huong Social Media Manager.'
  },
  {
    id: 3,
    mssv: '2500017768',
    name: 'Hoang Thi Ut Linh',
    gender: 'Nu',
    dob: '02/06/2007',
    ban: ['Ban Cong nghe'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0817846667',
    email: 'utlinhdepgai@gmail.com',
    joinDate: '26/05/2026',
    lop: '25DPM2',
    chuyenNganh: 'Ky thuat Phan mem',
    khoa: 'Cong nghe Thong tin',
    address: 'Go Vap, TP. HCM',
    hardSkills: [{ name: 'Lap trinh / Website', level: 'Cơ bản' }],
    softSkills: [{ name: 'Giai quyet van de', level: 'Trung bình' }],
    experience: 'Dang tu hoc Frontend.',
    goal: 'Tim team de code du an thuc te.',
    orientation: 'Tro thanh Fullstack Developer.'
  },
  {
    id: 4,
    mssv: '2500021001',
    name: 'Le Quoc Huy',
    gender: 'Nam',
    dob: '12/03/2007',
    ban: ['Ban Cong nghe'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200304',
    email: '2500021001@nttu.edu.vn',
    joinDate: '02/01/2026',
    lop: '25DTT2',
    chuyenNganh: 'Khoa học Dữ liệu',
    khoa: 'Công nghệ Thông tin',
    address: 'Thu Duc, TP. HCM',
    hardSkills: [
      { name: 'Python', level: 'Tốt' },
      { name: 'SQL', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Tu duy logic', level: 'Tốt' },
      { name: 'Lam viec nhom', level: 'Trung bình' }
    ],
    experience: 'Tham gia du an phan tich du lieu hoc tap.',
    goal: 'Nang cao nang luc machine learning.',
    orientation: 'Data Analyst trong 2 nam toi.'
  },
  {
    id: 5,
    mssv: '2500021002',
    name: 'Tran Bao Ngoc',
    gender: 'Nu',
    dob: '21/07/2007',
    ban: ['Ban Truyen thong'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200305',
    email: '2500021002@nttu.edu.vn',
    joinDate: '03/01/2026',
    lop: '25DTT1',
    chuyenNganh: 'Truyền thông Đa phương tiện',
    khoa: 'Truyền thông Sáng tạo',
    address: 'Binh Thanh, TP. HCM',
    hardSkills: [
      { name: 'Canva', level: 'Tốt' },
      { name: 'Quay dung video', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Sang tao noi dung', level: 'Tốt' },
      { name: 'Thuyet trinh', level: 'Trung bình' }
    ],
    experience: 'Da thuc tap tai studio media nho.',
    goal: 'Xay dung profile truyen thong chuyen nghiep.',
    orientation: 'Content Creator toan thoi gian.'
  },
  {
    id: 6,
    mssv: '2500021003',
    name: 'Pham Duc Anh',
    gender: 'Nam',
    dob: '03/02/2006',
    ban: ['Ban Chu nhiem'],
    role: 'Thanh vien',
    status: 'Inactive',
    phone: '0901200306',
    email: '2500021003@nttu.edu.vn',
    joinDate: '05/01/2026',
    lop: '24DQT1',
    chuyenNganh: 'Quản trị Kinh doanh',
    khoa: 'Kinh tế - Quản trị',
    address: 'Quan 7, TP. HCM',
    hardSkills: [
      { name: 'Lap ke hoach', level: 'Trung bình' },
      { name: 'Excel', level: 'Tốt' }
    ],
    softSkills: [
      { name: 'Quan ly thoi gian', level: 'Trung bình' },
      { name: 'Dam phan', level: 'Cơ bản' }
    ],
    experience: 'Ho tro dieu phoi nhan su cho su kien sinh vien.',
    goal: 'Cai thien ky nang quan tri van hanh.',
    orientation: 'Operations Executive.'
  },
  {
    id: 7,
    mssv: '2500021004',
    name: 'Vo Gia Han',
    gender: 'Nu',
    dob: '27/12/2007',
    ban: ['Ban Truyen thong'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200307',
    email: '2500021004@nttu.edu.vn',
    joinDate: '08/01/2026',
    lop: '25DPR1',
    chuyenNganh: 'Quan hệ Công chúng',
    khoa: 'Truyền thông Sáng tạo',
    address: 'Quan 10, TP. HCM',
    hardSkills: [
      { name: 'Viet thong cao', level: 'Trung bình' },
      { name: 'To chuc su kien', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Giao tiep', level: 'Tốt' },
      { name: 'Ket noi doi tac', level: 'Trung bình' }
    ],
    experience: 'Tham gia doi truyen thong cap khoa.',
    goal: 'Nang cao ky nang PR noi bo.',
    orientation: 'Chuyen vien truyen thong doanh nghiep.'
  },
  {
    id: 8,
    mssv: '2500021005',
    name: 'Nguyen Tien Dat',
    gender: 'Nam',
    dob: '09/09/2007',
    ban: ['Ban Cong nghe'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200308',
    email: '2500021005@nttu.edu.vn',
    joinDate: '10/01/2026',
    lop: '25DPM1',
    chuyenNganh: 'Kỹ thuật Phần mềm',
    khoa: 'Công nghệ Thông tin',
    address: 'Tan Binh, TP. HCM',
    hardSkills: [
      { name: 'React', level: 'Trung bình' },
      { name: 'Node.js', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'Tu hoc', level: 'Tốt' },
      { name: 'Bao cao cong viec', level: 'Trung bình' }
    ],
    experience: 'Da xay dung website portfolio ca nhan.',
    goal: 'Lam chu fullstack stack JavaScript.',
    orientation: 'Frontend Developer.'
  },
  {
    id: 9,
    mssv: '2500021006',
    name: 'Bui Thao My',
    gender: 'Nu',
    dob: '14/01/2008',
    ban: ['Ban Chu nhiem'],
    role: 'Thanh vien',
    status: 'Inactive',
    phone: '0901200309',
    email: '2500021006@nttu.edu.vn',
    joinDate: '12/01/2026',
    lop: '25DTN1',
    chuyenNganh: 'Tài chính - Ngân hàng',
    khoa: 'Kinh tế - Quản trị',
    address: 'Quan 6, TP. HCM',
    hardSkills: [
      { name: 'Tong hop so lieu', level: 'Trung bình' },
      { name: 'Lap ngan sach', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'Can than', level: 'Tốt' },
      { name: 'Ky luat', level: 'Tốt' }
    ],
    experience: 'Ho tro thu chi cho doi nhom hoc tap.',
    goal: 'Hieu quy trinh quan ly tai chinh CLB.',
    orientation: 'Chuyen vien tai chinh van hanh.'
  },
  {
    id: 10,
    mssv: '2500021007',
    name: 'Do Minh Quan',
    gender: 'Nam',
    dob: '18/08/2007',
    ban: ['Ban Cong nghe'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200310',
    email: '2500021007@nttu.edu.vn',
    joinDate: '15/01/2026',
    lop: '25DAT1',
    chuyenNganh: 'An toàn Thông tin',
    khoa: 'Công nghệ Thông tin',
    address: 'Phu Nhuan, TP. HCM',
    hardSkills: [
      { name: 'Bao mat web can ban', level: 'Trung bình' },
      { name: 'Linux', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'Phan tich rui ro', level: 'Trung bình' },
      { name: 'Giai quyet van de', level: 'Tốt' }
    ],
    experience: 'Da hoc CTF co ban tren nen tang online.',
    goal: 'Nang cao kien thuc ATTT ung dung.',
    orientation: 'Security Engineer.'
  },
  {
    id: 11,
    mssv: '2500021008',
    name: 'Dang Nhat Le',
    gender: 'Nam',
    dob: '01/11/2007',
    ban: ['Ban Truyen thong'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200311',
    email: '2500021008@nttu.edu.vn',
    joinDate: '18/01/2026',
    lop: '25DGD1',
    chuyenNganh: 'Thiết kế Đồ hoạ',
    khoa: 'Truyền thông Sáng tạo',
    address: 'Go Vap, TP. HCM',
    hardSkills: [
      { name: 'Photoshop', level: 'Tốt' },
      { name: 'Illustrator', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Nhan dien thuong hieu', level: 'Trung bình' },
      { name: 'Lam viec nhom', level: 'Trung bình' }
    ],
    experience: 'Freelance thiet ke poster su kien.',
    goal: 'Xay dung bo nhan dien cho CLB.',
    orientation: 'Graphic Designer.'
  },
  {
    id: 12,
    mssv: '2500021009',
    name: 'Le Phuong Anh',
    gender: 'Nu',
    dob: '24/05/2007',
    ban: ['Ban Chu nhiem'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200312',
    email: '2500021009@nttu.edu.vn',
    joinDate: '20/01/2026',
    lop: '25DMA1',
    chuyenNganh: 'Marketing',
    khoa: 'Kinh tế - Quản trị',
    address: 'Hoc Mon, TP. HCM',
    hardSkills: [
      { name: 'Nghien cuu nguoi dung', level: 'Trung bình' },
      { name: 'Bao cao KPI', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'To chuc cong viec', level: 'Tốt' },
      { name: 'Tu duy he thong', level: 'Trung bình' }
    ],
    experience: 'Da tham gia cac chien dich truyen thong sinh vien.',
    goal: 'Ap dung marketing vao tuyen thanh vien.',
    orientation: 'Marketing Operations.'
  },
  {
    id: 13,
    mssv: '2500021010',
    name: 'Huynh Gia Bao',
    gender: 'Nam',
    dob: '04/10/2007',
    ban: ['Ban Cong nghe'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200313',
    email: '2500021010@nttu.edu.vn',
    joinDate: '22/01/2026',
    lop: '25DMN1',
    chuyenNganh: 'Mạng Máy tính',
    khoa: 'Công nghệ Thông tin',
    address: 'Thu Duc, TP. HCM',
    hardSkills: [
      { name: 'Cau hinh mang co ban', level: 'Trung bình' },
      { name: 'MikroTik', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'Tinh ky luat', level: 'Tốt' },
      { name: 'Ho tro ky thuat', level: 'Trung bình' }
    ],
    experience: 'Tung ho tro setup LAN cho su kien hoc tap.',
    goal: 'Thong thao van hanh ha tang nho.',
    orientation: 'Network Administrator.'
  },
  {
    id: 14,
    mssv: '2500021011',
    name: 'Nguyen Ha Vy',
    gender: 'Nu',
    dob: '06/06/2008',
    ban: ['Ban Truyen thong'],
    role: 'Thanh vien',
    status: 'Inactive',
    phone: '0901200314',
    email: '2500021011@nttu.edu.vn',
    joinDate: '24/01/2026',
    lop: '25DAN1',
    chuyenNganh: 'Ngôn ngữ Anh',
    khoa: 'Ngoại ngữ',
    address: 'Quan 8, TP. HCM',
    hardSkills: [
      { name: 'Bien tap noi dung Anh-Viet', level: 'Tốt' },
      { name: 'Proofreading', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Linh hoat', level: 'Trung bình' },
      { name: 'Lang nghe', level: 'Tốt' }
    ],
    experience: 'Cong tac vien dich bai cho CLB hoc thuat.',
    goal: 'Dong bo noi dung song ngu cho fanpage.',
    orientation: 'Content Localization Specialist.'
  },
  {
    id: 15,
    mssv: '2500021012',
    name: 'Trinh Duc Tai',
    gender: 'Nam',
    dob: '30/03/2007',
    ban: ['Ban Chu nhiem'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200315',
    email: '2500021012@nttu.edu.vn',
    joinDate: '26/01/2026',
    lop: '25DQT2',
    chuyenNganh: 'Quản trị Kinh doanh',
    khoa: 'Kinh tế - Quản trị',
    address: 'Binh Chanh, TP. HCM',
    hardSkills: [
      { name: 'Quan tri cong viec', level: 'Trung bình' },
      { name: 'Notion', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Lanh dao nhom nho', level: 'Trung bình' },
      { name: 'Giao tiep noi bo', level: 'Tốt' }
    ],
    experience: 'To truong nhom du an mon hoc.',
    goal: 'Ho tro toi uu quy trinh CLB.',
    orientation: 'Project Coordinator.'
  },
  {
    id: 16,
    mssv: '2500021013',
    name: 'Tran Thi Y Nhi',
    gender: 'Nu',
    dob: '11/04/2008',
    ban: ['Ban Cong nghe'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200316',
    email: '2500021013@nttu.edu.vn',
    joinDate: '28/01/2026',
    lop: '25DAI1',
    chuyenNganh: 'Trí tuệ Nhân tạo',
    khoa: 'Công nghệ Thông tin',
    address: 'Tan Phu, TP. HCM',
    hardSkills: [
      { name: 'Machine Learning co ban', level: 'Trung bình' },
      { name: 'NumPy', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Nghien cuu doc lap', level: 'Tốt' },
      { name: 'Dat cau hoi', level: 'Trung bình' }
    ],
    experience: 'Tham gia nhom nghien cuu AI cap truong.',
    goal: 'Xay dung mo hinh du doan cho du lieu noi bo.',
    orientation: 'AI Engineer.'
  },
  {
    id: 17,
    mssv: '2500021014',
    name: 'Pham Minh Chau',
    gender: 'Nu',
    dob: '19/02/2007',
    ban: ['Ban Truyen thong'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200317',
    email: '2500021014@nttu.edu.vn',
    joinDate: '30/01/2026',
    lop: '25DNT1',
    chuyenNganh: 'Ngôn ngữ Trung',
    khoa: 'Ngoại ngữ',
    address: 'Quan 5, TP. HCM',
    hardSkills: [
      { name: 'Bien dich can ban', level: 'Trung bình' },
      { name: 'Noi dung mang xa hoi', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'Kien nhan', level: 'Tốt' },
      { name: 'Ket noi cong dong', level: 'Trung bình' }
    ],
    experience: 'Tinh nguyen vien truyen thong su kien van hoa.',
    goal: 'Mo rong kenh noi dung da ngon ngu.',
    orientation: 'Communications Specialist.'
  },
  {
    id: 18,
    mssv: '2500021015',
    name: 'Nguyen Hoang Son',
    gender: 'Nam',
    dob: '22/09/2006',
    ban: ['Ban Cong nghe'],
    role: 'Thanh vien',
    status: 'Inactive',
    phone: '0901200318',
    email: '2500021015@nttu.edu.vn',
    joinDate: '01/02/2026',
    lop: '24DPM2',
    chuyenNganh: 'Kỹ thuật Phần mềm',
    khoa: 'Công nghệ Thông tin',
    address: 'Quan 11, TP. HCM',
    hardSkills: [
      { name: 'TypeScript', level: 'Trung bình' },
      { name: 'Git', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Tu duy phan tich', level: 'Tốt' },
      { name: 'Bao tri tai lieu', level: 'Cơ bản' }
    ],
    experience: 'Tham gia du an mon hoc theo scrum.',
    goal: 'Cai thien chat luong code va review.',
    orientation: 'Software Engineer.'
  },
  {
    id: 19,
    mssv: '2500021016',
    name: 'Doan Thi Kim Ngan',
    gender: 'Nu',
    dob: '05/01/2008',
    ban: ['Ban Chu nhiem'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200319',
    email: '2500021016@nttu.edu.vn',
    joinDate: '03/02/2026',
    lop: '25DMA2',
    chuyenNganh: 'Marketing',
    khoa: 'Kinh tế - Quản trị',
    address: 'Quan 3, TP. HCM',
    hardSkills: [
      { name: 'Phan tich chien dich', level: 'Cơ bản' },
      { name: 'Bao cao du lieu', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Tong hop thong tin', level: 'Tốt' },
      { name: 'Lam viec da nhiem', level: 'Trung bình' }
    ],
    experience: 'Da tham gia CLB marketing cap khoa.',
    goal: 'Ung dung marketing vao tuyen sinh CLB.',
    orientation: 'Marketing Analyst.'
  },
  {
    id: 20,
    mssv: '2500021017',
    name: 'Lam Quynh Nhu',
    gender: 'Nu',
    dob: '17/07/2008',
    ban: ['Ban Truyen thong'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200320',
    email: '2500021017@nttu.edu.vn',
    joinDate: '05/02/2026',
    lop: '25DNJ1',
    chuyenNganh: 'Ngôn ngữ Nhật',
    khoa: 'Ngoại ngữ',
    address: 'Quan Tan Phu, TP. HCM',
    hardSkills: [
      { name: 'Viet noi dung su kien', level: 'Trung bình' },
      { name: 'Chup anh co ban', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'Tinh than trach nhiem', level: 'Tốt' },
      { name: 'Phan hoi nhanh', level: 'Trung bình' }
    ],
    experience: 'Cong tac vien truyen thong cho khoa.',
    goal: 'Dong bo thong diep truyen thong noi bo.',
    orientation: 'Event Communication.'
  },
  {
    id: 21,
    mssv: '2500021018',
    name: 'Le Thanh Cong',
    gender: 'Nam',
    dob: '28/06/2007',
    ban: ['Ban Cong nghe'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200321',
    email: '2500021018@nttu.edu.vn',
    joinDate: '08/02/2026',
    lop: '25DTT3',
    chuyenNganh: 'Khoa học Dữ liệu',
    khoa: 'Công nghệ Thông tin',
    address: 'Quan 9, TP. HCM',
    hardSkills: [
      { name: 'Power BI', level: 'Trung bình' },
      { name: 'Pandas', level: 'Trung bình' }
    ],
    softSkills: [
      { name: 'Giai trinh so lieu', level: 'Trung bình' },
      { name: 'Tinh chu dong', level: 'Tốt' }
    ],
    experience: 'Tham gia cuoc thi phan tich du lieu cap truong.',
    goal: 'Dung dashboard de theo doi van hanh.',
    orientation: 'Business Intelligence Analyst.'
  },
  {
    id: 22,
    mssv: '2500021019',
    name: 'Tran Mai Anh',
    gender: 'Nu',
    dob: '13/03/2008',
    ban: ['Ban Chu nhiem'],
    role: 'Thanh vien',
    status: 'Inactive',
    phone: '0901200322',
    email: '2500021019@nttu.edu.vn',
    joinDate: '10/02/2026',
    lop: '25DTN2',
    chuyenNganh: 'Tài chính - Ngân hàng',
    khoa: 'Kinh tế - Quản trị',
    address: 'Nha Be, TP. HCM',
    hardSkills: [
      { name: 'Quan ly chi phi', level: 'Trung bình' },
      { name: 'Ke toan can ban', level: 'Cơ bản' }
    ],
    softSkills: [
      { name: 'Can bang cong viec', level: 'Trung bình' },
      { name: 'Tu duy trach nhiem', level: 'Tốt' }
    ],
    experience: 'Ho tro tong hop chi phi su kien nhom.',
    goal: 'Hieu dong tien va ke hoach ngan sach.',
    orientation: 'Finance Operations.'
  },
  {
    id: 23,
    mssv: '2500021020',
    name: 'Phan Anh Khoa',
    gender: 'Nam',
    dob: '07/12/2007',
    ban: ['Ban Truyen thong'],
    role: 'Thanh vien',
    status: 'Active',
    phone: '0901200323',
    email: '2500021020@nttu.edu.vn',
    joinDate: '12/02/2026',
    lop: '25DGD2',
    chuyenNganh: 'Thiết kế Đồ hoạ',
    khoa: 'Truyền thông Sáng tạo',
    address: 'Quan 1, TP. HCM',
    hardSkills: [
      { name: 'Figma', level: 'Trung bình' },
      { name: 'Thiet ke social post', level: 'Tốt' }
    ],
    softSkills: [
      { name: 'Tiep nhan feedback', level: 'Tốt' },
      { name: 'Phoi hop lien ban', level: 'Trung bình' }
    ],
    experience: 'Da thiet ke visual cho nhieu su kien sinh vien.',
    goal: 'Nang cap chat luong hinh anh truyen thong CLB.',
    orientation: 'Visual Designer.'
  }
];

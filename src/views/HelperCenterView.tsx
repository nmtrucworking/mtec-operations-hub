import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  Languages,
  LifeBuoy,
  Mail,
  MessageCircle,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserCheck,
} from 'lucide-react';
import { useTheme } from '../components/theme-provider';
import { Button } from '../components/ui/button';
import logoImg from '../assets/mtec_logo.svg';

const evaluationGuideUrl = new URL(
  '../assets/documents/QC-MTEC-03-2026 - Dự thảo Quy chế đánh giá thành viên MTEC.pdf',
  import.meta.url
).href;
const evaluationCriteriaUrl = new URL(
  '../assets/documents/BẢNG TIÊU CHÍ ĐÁNH GIÁ THÀNH VIÊN CHI TIẾT.xlsx',
  import.meta.url
).href;

type HelpCategory = 'all' | 'account' | 'profile' | 'discipline' | 'documents';

interface HelperCenterViewProps {
  onBackToLogin: () => void;
}

const categories: Array<{ id: HelpCategory; label: string; icon: React.ReactNode }> = [
  { id: 'all', label: 'Tất cả', icon: <LifeBuoy size={16} /> },
  { id: 'account', label: 'Tài khoản', icon: <ShieldCheck size={16} /> },
  { id: 'profile', label: 'Hồ sơ', icon: <UserCheck size={16} /> },
  { id: 'discipline', label: 'Đánh giá', icon: <ClipboardList size={16} /> },
  { id: 'documents', label: 'Biểu mẫu', icon: <BookOpen size={16} /> },
];

const helpItems = [
  {
    category: 'account',
    title: 'Không đăng nhập được vào hệ thống',
    answer:
      'Kiểm tra đúng MSSV hoặc tên tài khoản, sau đó dùng chức năng quên mật khẩu. Nếu vẫn lỗi, gửi MSSV và ảnh chụp màn hình cho Ban Vận hành.',
  },
  {
    category: 'account',
    title: 'Cần đổi email hoặc số điện thoại tài khoản',
    answer:
      'Thành viên gửi yêu cầu cập nhật thông tin cá nhân cho Ban Nhân sự. Sau khi xác minh, thông tin sẽ được đồng bộ vào hồ sơ hệ thống.',
  },
  {
    category: 'profile',
    title: 'Hồ sơ thành viên bị thiếu hoặc sai thông tin',
    answer:
      'Chuẩn bị MSSV, họ tên, ban trực thuộc và nội dung cần sửa. Ban Nhân sự sẽ kiểm tra với danh sách quản lý trước khi cập nhật.',
  },
  {
    category: 'profile',
    title: 'Muốn biết trạng thái hoạt động của mình',
    answer:
      'Liên hệ trưởng ban hoặc Ban Nhân sự để xác nhận trạng thái hiện tại, lịch sử tham gia và các ghi chú liên quan đến hồ sơ.',
  },
  {
    category: 'discipline',
    title: 'Cách xem điểm đánh giá định kỳ',
    answer:
      'Khi kết quả được công bố, thành viên có thể nhận thông báo từ ban phụ trách. Nếu cần đối soát minh chứng, liên hệ Ban Kỷ luật và Chuyên cần.',
  },
  {
    category: 'discipline',
    title: 'Khiếu nại kết quả đánh giá',
    answer:
      'Gửi nội dung khiếu nại kèm minh chứng trong thời hạn được thông báo của chu kỳ. Ban phụ trách sẽ phản hồi sau khi rà soát dữ liệu.',
  },
  {
    category: 'documents',
    title: 'Cần mẫu đơn hoặc biểu mẫu CLB',
    answer:
      'Một số tài liệu tham khảo được đặt ngay tại Helper Center. Với biểu mẫu nội bộ chưa công khai, hãy liên hệ Ban Vận hành để được cấp đúng phiên bản.',
  },
  {
    category: 'documents',
    title: 'Nộp minh chứng hoạt động ở đâu',
    answer:
      'Minh chứng cần đúng tên hoạt động, thời gian, vai trò và người xác nhận. Gửi theo kênh mà trưởng ban hoặc Ban Kỷ luật thông báo cho từng chu kỳ.',
  },
] satisfies Array<{ category: Exclude<HelpCategory, 'all'>; title: string; answer: string }>;

const supportChannels = [
  {
    title: 'Ban Nhân sự',
    description: 'Hồ sơ thành viên, thông tin cá nhân, trạng thái hoạt động.',
    action: 'Gửi yêu cầu',
    href: 'mailto:hr@mtec.nttu.edu.vn?subject=Yeu%20cau%20ho%20tro%20ho%20so%20thanh%20vien',
    icon: <Mail size={20} />,
  },
  {
    title: 'Ban Kỷ luật và Chuyên cần',
    description: 'Điểm đánh giá, minh chứng, khiếu nại kết quả chu kỳ.',
    action: 'Liên hệ đối soát',
    href: 'mailto:discipline@mtec.nttu.edu.vn?subject=Yeu%20cau%20doi%20soat%20danh%20gia',
    icon: <ClipboardList size={20} />,
  },
  {
    title: 'Ban Vận hành',
    description: 'Tài khoản đăng nhập, quyền truy cập và sự cố kỹ thuật.',
    action: 'Báo sự cố',
    href: 'mailto:operations@mtec.nttu.edu.vn?subject=Bao%20su%20co%20MTEC%20Operations%20Hub',
    icon: <MessageCircle size={20} />,
  },
];

const documentLinks = [
  {
    title: 'Quy chế đánh giá thành viên',
    description: 'Tài liệu quy định cách tính điểm, chu kỳ và quy trình đánh giá.',
    href: evaluationGuideUrl,
  },
  {
    title: 'Bảng tiêu chí đánh giá chi tiết',
    description: 'Bảng tính tham khảo cho tiêu chí và minh chứng cần chuẩn bị.',
    href: evaluationCriteriaUrl,
  },
];

export const HelperCenterView = ({ onBackToLogin }: HelperCenterViewProps) => {
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<HelpCategory>('all');
  const currentLang = (i18n.resolvedLanguage || i18n.language || 'vi').split('-')[0];

  const filteredHelpItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');

    return helpItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const searchableText = `${item.title} ${item.answer}`.toLocaleLowerCase('vi');
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div className="min-h-screen bg-background text-primary font-sans">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-card"
          >
            <img src={logoImg} alt="MTEC Logo" className="h-10 w-10 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gold">MTEC Helper Center</p>
              <p className="truncate text-xs text-secondary">Hỗ trợ thành viên CLB</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i18n.changeLanguage(currentLang === 'vi' ? 'en' : 'vi')}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-secondary transition-colors hover:text-primary"
              title="Đổi ngôn ngữ"
            >
              <Languages size={16} />
              <span className="font-semibold uppercase">{currentLang}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-secondary transition-colors hover:text-primary"
              title={theme === 'dark' ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              <LifeBuoy size={14} />
              Public Support
            </div>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Trung tâm hỗ trợ cho thành viên MTEC
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary md:text-base">
              Tra cứu hướng dẫn nhanh về tài khoản, hồ sơ, đánh giá định kỳ và biểu mẫu mà không cần đăng nhập vào hệ thống nội bộ.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="#faq"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-gold px-5 text-sm font-semibold text-background transition-colors hover:bg-gold-hover"
              >
                Tìm hướng dẫn
                <ChevronRight size={16} className="ml-2" />
              </a>
              <Button type="button" variant="outline" onClick={onBackToLogin}>
                <ArrowLeft size={16} className="mr-2" />
                Quay lại đăng nhập
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
            {[
              'Chuẩn bị MSSV hoặc email khi cần hỗ trợ tài khoản.',
              'Gửi minh chứng rõ thời gian, vai trò và người xác nhận.',
              'Không chia sẻ mật khẩu hoặc mã xác minh cho người khác.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg bg-background p-4">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-text" />
                <p className="text-sm leading-6">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mt-8">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Câu hỏi thường gặp</h2>
              <p className="mt-1 text-sm text-secondary">Lọc theo nhóm hoặc tìm bằng từ khóa để đến đúng hướng dẫn nhanh hơn.</p>
            </div>
            <div className="relative w-full lg:w-80">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tài khoản, hồ sơ, minh chứng..."
                className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-secondary focus:border-gold"
              />
            </div>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'border-gold bg-gold text-background'
                    : 'border-border bg-card text-secondary hover:text-primary'
                }`}
              >
                {category.icon}
                {category.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {filteredHelpItems.length > 0 ? (
              filteredHelpItems.map((item) => (
                <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-background text-gold">
                    <FileQuestion size={18} />
                  </div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary">{item.answer}</p>
                </article>
              ))
            ) : (
              <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 text-center">
                <FileQuestion size={28} className="mx-auto mb-3 text-secondary" />
                <p className="font-medium">Chưa tìm thấy hướng dẫn phù hợp</p>
                <p className="mt-1 text-sm text-secondary">Thử từ khóa khác hoặc gửi yêu cầu cho ban phụ trách bên dưới.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <h2 className="text-xl font-semibold">Kênh hỗ trợ</h2>
            <div className="mt-4 grid gap-3">
              {supportChannels.map((channel) => (
                <a
                  key={channel.title}
                  href={channel.href}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-gold/70"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-gold">
                    {channel.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{channel.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-secondary">{channel.description}</span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-gold sm:inline-flex">
                    {channel.action}
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Tài liệu tham khảo</h2>
            <div className="mt-4 grid gap-3">
              {documentLinks.map((document) => (
                <a
                  key={document.title}
                  href={document.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-gold/70"
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background text-gold">
                    <BookOpen size={19} />
                  </span>
                  <span className="block font-semibold">{document.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-secondary">{document.description}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

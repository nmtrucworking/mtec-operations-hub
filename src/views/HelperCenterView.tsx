import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  ExternalLink,
  FileQuestion,
  Filter,
  Languages,
  LifeBuoy,
  Mail,
  MessageCircle,
  Moon,
  MousePointerClick,
  Search,
  Send,
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

const categories: Array<{ id: HelpCategory; label: string; icon: React.ReactNode; description: string }> = [
  { id: 'all', label: 'Tất cả', icon: <LifeBuoy size={16} />, description: 'Toàn bộ hướng dẫn' },
  { id: 'account', label: 'Tài khoản', icon: <ShieldCheck size={16} />, description: 'Đăng nhập, mật khẩu, quyền truy cập' },
  { id: 'profile', label: 'Hồ sơ', icon: <UserCheck size={16} />, description: 'Thông tin cá nhân, trạng thái hoạt động' },
  { id: 'discipline', label: 'Đánh giá', icon: <ClipboardList size={16} />, description: 'Điểm, minh chứng, khiếu nại' },
  { id: 'documents', label: 'Biểu mẫu', icon: <BookOpen size={16} />, description: 'Tài liệu và file tham khảo' },
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

const usageSteps = [
  {
    title: 'Tìm theo vấn đề',
    description: 'Nhập MSSV, hồ sơ, mật khẩu, đánh giá hoặc minh chứng vào ô tìm kiếm.',
    icon: <Search size={20} />,
  },
  {
    title: 'Lọc đúng nhóm',
    description: 'Chọn nhóm Tài khoản, Hồ sơ, Đánh giá hoặc Biểu mẫu để rút ngắn danh sách.',
    icon: <Filter size={20} />,
  },
  {
    title: 'Đọc hướng xử lý',
    description: 'Mỗi thẻ FAQ cho biết tình huống, dữ liệu cần chuẩn bị và đơn vị phụ trách.',
    icon: <FileQuestion size={20} />,
  },
  {
    title: 'Gửi yêu cầu',
    description: 'Dùng kênh hỗ trợ hoặc tài liệu tham khảo ở cuối trang để tiếp tục xử lý.',
    icon: <Send size={20} />,
  },
];

const interfaceGuides = [
  {
    label: 'Ô tìm kiếm',
    title: 'Dùng khi đã biết từ khóa',
    description: 'Tốt nhất cho các lỗi cụ thể như “mật khẩu”, “MSSV”, “minh chứng”.',
    icon: <Search size={18} />,
  },
  {
    label: 'Bộ lọc nhóm',
    title: 'Dùng khi chưa chắc vấn đề thuộc đâu',
    description: 'Mỗi nhóm có mô tả ngắn để thành viên tự chọn đúng luồng hỗ trợ.',
    icon: <Filter size={18} />,
  },
  {
    label: 'Thẻ FAQ',
    title: 'Dùng để tự xử lý bước đầu',
    description: 'Nội dung ưu tiên hành động cần làm và thông tin cần gửi cho ban phụ trách.',
    icon: <FileQuestion size={18} />,
  },
  {
    label: 'Kênh hỗ trợ',
    title: 'Dùng khi cần người phụ trách phản hồi',
    description: 'Mỗi kênh đã tách theo nghiệp vụ để hạn chế gửi nhầm nơi tiếp nhận.',
    icon: <MessageCircle size={18} />,
  },
];

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
    icon: <ExternalLink size={18} />,
  },
  {
    title: 'Bảng tiêu chí đánh giá chi tiết',
    description: 'Bảng tính tham khảo cho tiêu chí và minh chứng cần chuẩn bị.',
    href: evaluationCriteriaUrl,
    icon: <Download size={18} />,
  },
];

export const HelperCenterView = ({ onBackToLogin }: HelperCenterViewProps) => {
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<HelpCategory>('all');
  const currentLang = (i18n.resolvedLanguage || i18n.language || 'vi').split('-')[0];
  const activeCategoryMeta = categories.find((category) => category.id === activeCategory) ?? categories[0];

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
    <div className="min-h-screen bg-[#f5f7f2] text-slate-950 dark:bg-[#101720] dark:text-white font-sans">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#101720]/90">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 lg:px-10 xl:px-14">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <img src={logoImg} alt="MTEC Logo" className="h-10 w-10 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gold">MTEC Helper Center</p>
              <p className="truncate text-xs text-slate-600 dark:text-slate-300">Hỗ trợ thành viên CLB</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i18n.changeLanguage(currentLang === 'vi' ? 'en' : 'vi')}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 transition-colors hover:text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:text-white"
              title="Đổi ngôn ngữ"
            >
              <Languages size={16} />
              <span className="font-semibold uppercase">{currentLang}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:text-white"
              title={theme === 'dark' ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full">
        <section className="grid w-full gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:px-10 xl:px-14">
          <div className="min-h-[360px] rounded-xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-300/20 dark:bg-[#182338] lg:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              <LifeBuoy size={14} />
              Public Support
            </div>
            <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              Trung tâm hỗ trợ cho thành viên MTEC
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-200 md:text-base">
              Tra cứu hướng dẫn nhanh về tài khoản, hồ sơ, đánh giá định kỳ và biểu mẫu mà không cần đăng nhập vào hệ thống nội bộ.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {usageSteps.map((step, index) => (
                <div key={step.title} className="rounded-lg border border-slate-200 bg-[#f8fafc] p-4 dark:border-white/10 dark:bg-black/20">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-background">{step.icon}</span>
                    <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                      Bước {index + 1}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#faq"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-gold px-5 text-sm font-semibold text-background transition-colors hover:bg-gold-hover"
              >
                <MousePointerClick size={16} className="mr-2" />
                Bắt đầu tra cứu
              </a>
              <Button type="button" variant="outline" onClick={onBackToLogin}>
                <ArrowLeft size={16} className="mr-2" />
                Quay lại đăng nhập
              </Button>
            </div>
          </div>

          <div className="grid content-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-300/20 dark:bg-[#11251f]">
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Trước khi gửi yêu cầu</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Chuẩn bị đủ thông tin giúp ban phụ trách phản hồi nhanh hơn.</p>
            </div>
            {[
              'MSSV hoặc email dùng trong hệ thống.',
              'Ảnh chụp màn hình lỗi hoặc minh chứng liên quan.',
              'Tên hoạt động, thời gian, vai trò và người xác nhận.',
              'Không gửi mật khẩu hoặc mã xác minh cho bất kỳ ai.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg bg-white p-4 dark:bg-black/20">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-text" />
                <p className="text-sm leading-6">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full border-y border-slate-200 bg-white px-4 py-6 dark:border-white/10 dark:bg-[#121b28] lg:px-10 xl:px-14">
          <div className="mb-4 flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Các thành phần trên trang dùng để làm gì?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Mỗi đối tượng giao diện được tách rõ theo mục đích sử dụng để thành viên thao tác nhanh hơn.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {interfaceGuides.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-[#f8fafc] p-5 dark:border-white/10 dark:bg-[#172033]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-gold dark:bg-black/20">{item.icon}</span>
                  <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                    {item.label}
                  </span>
                </div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="w-full px-4 py-8 lg:px-10 xl:px-14">
          <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] xl:items-end">
            <div>
              <h2 className="text-2xl font-semibold">Câu hỏi thường gặp</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Đang xem: <span className="font-semibold text-gold">{activeCategoryMeta.label}</span> - {activeCategoryMeta.description}
              </p>
            </div>
            <div className="relative w-full">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tài khoản, hồ sơ, minh chứng..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-slate-500 focus:border-gold dark:border-white/10 dark:bg-white/10 dark:placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`min-h-[84px] rounded-xl border p-4 text-left transition-colors ${
                  activeCategory === category.id
                    ? 'border-gold bg-gold text-background shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-gold/70 dark:border-white/10 dark:bg-[#172033] dark:text-slate-200'
                }`}
              >
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  {category.icon}
                  {category.label}
                </span>
                <span className="block text-xs leading-5 opacity-80">{category.description}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
            {filteredHelpItems.length > 0 ? (
              filteredHelpItems.map((item) => (
                <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#172033]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-gold dark:bg-black/20">
                      <FileQuestion size={18} />
                    </span>
                    <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                      FAQ
                    </span>
                  </div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-white/10 dark:bg-[#172033] lg:col-span-2 2xl:col-span-4">
                <FileQuestion size={28} className="mx-auto mb-3 text-slate-500 dark:text-slate-300" />
                <p className="font-medium">Chưa tìm thấy hướng dẫn phù hợp</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Thử từ khóa khác hoặc gửi yêu cầu cho ban phụ trách bên dưới.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid w-full gap-6 bg-white px-4 py-8 dark:bg-[#121b28] lg:grid-cols-[1.15fr_0.85fr] lg:px-10 xl:px-14">
          <div>
            <h2 className="text-2xl font-semibold">Kênh hỗ trợ</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Chọn đúng ban phụ trách để nội dung được xử lý theo nghiệp vụ.</p>
            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              {supportChannels.map((channel) => (
                <a
                  key={channel.title}
                  href={channel.href}
                  className="group flex min-h-[180px] flex-col justify-between rounded-xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm transition-colors hover:border-gold/70 dark:border-white/10 dark:bg-[#172033]"
                >
                  <span>
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-gold dark:bg-black/20">
                      {channel.icon}
                    </span>
                    <span className="block font-semibold">{channel.title}</span>
                    <span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">{channel.description}</span>
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold">
                    {channel.action}
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Tài liệu tham khảo</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Mở nhanh tài liệu cần thiết cho đánh giá và minh chứng.</p>
            <div className="mt-4 grid gap-3">
              {documentLinks.map((document) => (
                <a
                  key={document.title}
                  href={document.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm transition-colors hover:border-gold/70 dark:border-white/10 dark:bg-[#172033]"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-gold dark:bg-black/20">
                    {document.icon}
                  </span>
                  <span className="block font-semibold">{document.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">{document.description}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

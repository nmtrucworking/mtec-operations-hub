import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  Gavel,
  Lock,
  MessageSquare,
  ShieldCheck,
  Users,
  ChevronRight,
  Download,
  FileText
} from 'lucide-react';
import { Badge } from '../ui/badge';

// @ts-ignore
import qcMtecPdf from '../../assets/documents/QC-MTEC-03-2026 - Dự thảo Quy chế đánh giá thành viên MTEC.pdf?url';
// @ts-ignore
import bangTieuChiXlsx from '../../assets/documents/BẢNG TIÊU CHÍ ĐÁNH GIÁ THÀNH VIÊN CHI TIẾT.xlsx?url';

const componentRules = [
  {
    code: 'I',
    title: 'Kỷ luật & chuyên cần',
    maxScore: '30 điểm',
    detail: 'Tính từ điểm danh, tỷ lệ tham gia, vắng không phép, đi trễ và các lỗi tuân thủ cơ bản.',
  },
  {
    code: 'II',
    title: 'Thái độ & ý thức tổ chức',
    maxScore: '20 điểm',
    detail: 'Ghi nhận tinh thần phối hợp, phản hồi, trách nhiệm với thông báo và nghĩa vụ chung.',
  },
  {
    code: 'III-A',
    title: 'Hiệu suất chung',
    maxScore: '30 điểm',
    detail: 'Áp dụng cho đóng góp chung, nhiệm vụ liên ban, hoạt động CLB và thành tích thi đua.',
  },
  {
    code: 'III-B',
    title: 'Hiệu suất theo ban',
    maxScore: '20 điểm',
    detail: 'Tính theo vai trò chuyên môn từng ban; thành viên nhiều ban dùng trọng số tham gia.',
  },
];

const workflowSteps = [
  { label: 'Tạo chu kỳ', icon: ClipboardCheck },
  { label: 'Gán vai trò', icon: Users },
  { label: 'Ghi điểm', icon: Calculator },
  { label: 'Nộp minh chứng', icon: FileCheck },
  { label: 'Tính kết quả', icon: BadgeCheck },
  { label: 'Rà soát', icon: MessageSquare },
  { label: 'Duyệt & khóa', icon: Lock },
];

const classificationRules = [
  { label: 'Xuất sắc', range: 'Từ 90 điểm', tone: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { label: 'Tốt', range: 'Từ 80 đến dưới 90', tone: 'bg-green-100 text-green-700 border-green-200' },
  { label: 'Đạt', range: 'Từ 65 đến dưới 80', tone: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: 'Cần cải thiện', range: 'Từ 50 đến dưới 65', tone: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: 'Không đạt', range: 'Dưới 50 điểm', tone: 'bg-red-100 text-red-700 border-red-200' },
];

const evidenceRules = [
  'Điểm có yêu cầu minh chứng cần có link, mô tả hoặc tệp chứng minh trước khi duyệt.',
  'Người nộp minh chứng không tự xác minh minh chứng của chính mình.',
  'Minh chứng bị từ chối sẽ không được dùng trong chế độ tính điểm phê duyệt.',
];

const blockerRulesGrouped = [
  { 
    level: 'Tốt', 
    rules: ['Có vắng không phép trong chu kỳ.', 'Không hoàn thành nhiệm vụ trọng yếu liên quan nhiều đơn vị.'], 
    tone: 'bg-green-100 text-green-700 border-green-200' 
  },
  { 
    level: 'Đạt', 
    rules: ['Chuyên cần dưới 80%.', 'Đi trễ hoặc lỡ deadline lặp lại nhiều lần.'], 
    tone: 'bg-blue-100 text-blue-700 border-blue-200' 
  },
  { 
    level: 'Cần cải thiện', 
    rules: ['Cảnh cáo nội bộ có hiệu lực.'], 
    tone: 'bg-orange-100 text-orange-700 border-orange-200' 
  },
  { 
    level: 'Không đạt', 
    rules: ['Vi phạm nghiêm trọng có hiệu lực.'], 
    tone: 'bg-red-100 text-red-700 border-red-200' 
  },
];

const rightsRules = [
  { role: 'Thành viên', scope: 'Xem kết quả của mình, nộp minh chứng và gửi khiếu nại trong giai đoạn rà soát.' },
  { role: 'BCM/Phụ trách', scope: 'Ghi nhận điểm, vai trò và minh chứng trong phạm vi được phân công.' },
  { role: 'BVH/BCN', scope: 'Quản lý chu kỳ, kiểm tra dữ liệu, xử lý khiếu nại, phê duyệt và khóa kết quả.' },
];

const statusRules = [
  { code: 'DRAFT', label: 'Chuẩn bị cấu hình chu kỳ, tiêu chí và roster.' },
  { code: 'DATA_COLLECTION', label: 'Thu thập dữ liệu điểm danh, thi đua, minh chứng.' },
  { code: 'SCORING', label: 'Ghi điểm, đồng bộ dữ liệu và tính thử kết quả.' },
  { code: 'MEMBER_REVIEW', label: 'Thành viên rà soát kết quả và gửi khiếu nại.' },
  { code: 'APPEAL_RESOLUTION', label: 'Ban phụ trách xử lý khiếu nại và điều chỉnh nếu có căn cứ.' },
  { code: 'READY_FOR_APPROVAL', label: 'Kết quả đã sẵn sàng trình duyệt.' },
  { code: 'APPROVED/LOCKED', label: 'Kết quả được phê duyệt; khi khóa thì không còn ghi điểm mới.' },
];

export const EvaluationGuidePanel = () => {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <section className="border border-border/40 bg-card/50 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              <h3 className="text-xl font-bold text-foreground">Quy định đánh giá định kỳ</h3>
            </div>
            <p className="text-sm text-secondary max-w-3xl">
              Evaluation v2 là nguồn tính điểm chính cho chu kỳ đánh giá. Dữ liệu được tổng hợp từ điểm danh,
              thi đua, sự kiện điểm, minh chứng, case kỷ luật và kết quả đối soát.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="text-center border border-border/30 rounded-xl px-4 py-3 bg-background/50">
              <div className="text-2xl font-black text-primary">100</div>
              <div className="text-xs text-secondary font-semibold">Điểm tối đa</div>
            </div>
            <div className="text-center border border-border/30 rounded-xl px-4 py-3 bg-background/50">
              <div className="text-2xl font-black text-primary">80%</div>
              <div className="text-xs text-secondary font-semibold">Chuyên cần</div>
            </div>
            <div className="text-center border border-border/30 rounded-xl px-4 py-3 bg-background/50">
              <div className="text-2xl font-black text-primary">4</div>
              <div className="text-xs text-secondary font-semibold">Cấu phần</div>
            </div>
          </div>
        </div>
        
        {/* Document Links */}
        <div className="mt-5 pt-4 border-t border-border/40 flex flex-wrap gap-3">
          <a 
            href={qcMtecPdf} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors text-sm font-semibold"
          >
            <FileText size={16} />
            Quy chế Đánh giá (PDF)
            <Download size={14} className="ml-1 opacity-70" />
          </a>
          <a 
            href={bangTieuChiXlsx} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-green-600/20 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/10 dark:text-green-500 transition-colors text-sm font-semibold"
          >
            <FileText size={16} />
            Bảng Tiêu chí Chi tiết (Excel)
            <Download size={14} className="ml-1 opacity-70" />
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {componentRules.map((item) => (
          <div key={item.code} className="border border-border/40 bg-card/45 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">{item.code}</Badge>
              <span className="text-sm font-black text-foreground">{item.maxScore}</span>
            </div>
            <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
            <p className="text-sm text-secondary leading-6">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardCheck size={18} className="text-primary" />
          <h4 className="font-bold text-foreground">Vòng đời một chu kỳ</h4>
        </div>
        
        {/* Flowchart UI */}
        <div className="relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center gap-2 z-10 w-full md:w-24 shrink-0 group">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border-2 border-primary/30 text-primary shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                      <Icon size={20} />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">Bước {index + 1}</div>
                      <div className="text-xs font-bold text-foreground leading-tight">{step.label}</div>
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden md:flex h-0.5 flex-1 bg-border/50 shrink-0 relative top-[-15px]">
                      <div className="absolute right-[-4px] top-[-5px] text-border/80">
                        <ChevronRight size={12} strokeWidth={4} />
                      </div>
                    </div>
                  )}
                  {index < workflowSteps.length - 1 && (
                    <div className="flex md:hidden h-6 w-0.5 bg-border/50 shrink-0"></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-primary" />
            <h4 className="font-bold text-foreground">Cách tính điểm & xếp loại</h4>
          </div>
          <div className="space-y-3">
            {classificationRules.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 border border-border/30 rounded-xl px-3 py-2.5 bg-background/45">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${item.tone}`}>{item.label}</span>
                <span className="text-sm text-secondary font-medium text-right">{item.range}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-secondary leading-6">
            Điểm tiêu chí được chặn theo điểm tối đa của tiêu chí, điểm cấu phần được chặn theo trần cấu phần,
            tổng điểm được chặn trong khoảng 0 đến 100.
          </div>
        </div>

        <div className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-primary" />
            <h4 className="font-bold text-foreground">Điều kiện chặn xếp loại</h4>
          </div>
          <div className="flex-1 space-y-4">
            {blockerRulesGrouped.map((group) => (
              <div key={group.level} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${group.tone}`}>
                    Chặn mức xếp loại tối đa: {group.level}
                  </span>
                </div>
                <ul className="space-y-2 pl-2">
                  {group.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-secondary">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck size={18} className="text-primary" />
            <h4 className="font-bold text-foreground">Minh chứng</h4>
          </div>
          <div className="space-y-3">
            {evidenceRules.map((rule) => (
              <div key={rule} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-1" />
                <p className="text-sm text-secondary leading-6">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-primary" />
            <h4 className="font-bold text-foreground">Khiếu nại & đối soát</h4>
          </div>
          <div className="text-sm text-secondary leading-6 space-y-3">
            <p>Thành viên gửi khiếu nại trong giai đoạn rà soát nếu điểm, minh chứng hoặc xếp loại chưa đúng.</p>
            <p>Khi khiếu nại được chấp nhận, hệ thống có thể tạo sự kiện điều chỉnh điểm và tính lại kết quả.</p>
          </div>
        </div>

        <div className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Gavel size={18} className="text-primary" />
            <h4 className="font-bold text-foreground">Liên hệ kỷ luật</h4>
          </div>
          <div className="text-sm text-secondary leading-6 space-y-3">
            <p>Điểm danh vắng không phép có thể tạo điểm trừ và case kỷ luật trong cùng chu kỳ.</p>
            <p>Case kỷ luật có hiệu lực được dùng như blocker để bảo đảm xếp loại phản ánh đúng quy định CLB.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-primary" />
            <h4 className="font-bold text-foreground">Quyền xem và thao tác</h4>
          </div>
          <div className="space-y-3">
            {rightsRules.map((item) => (
              <div key={item.role} className="border border-border/30 rounded-xl p-3 bg-background/45">
                <div className="font-bold text-foreground text-sm mb-1">{item.role}</div>
                <div className="text-sm text-secondary leading-6">{item.scope}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight size={18} className="text-primary" />
            <h4 className="font-bold text-foreground">Ý nghĩa trạng thái chu kỳ</h4>
          </div>
          <div className="space-y-2">
            {statusRules.map((item) => (
              <div key={item.code} className="grid grid-cols-[150px_1fr] gap-3 border border-border/30 rounded-xl px-3 py-2.5 bg-background/45">
                <span className="font-mono text-xs font-black text-primary">{item.code}</span>
                <span className="text-sm text-secondary leading-5">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default EvaluationGuidePanel;

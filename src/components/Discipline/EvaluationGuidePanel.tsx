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
} from 'lucide-react';
import { Badge } from '../ui/badge';

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

const blockerRules = [
  'Chuyên cần dưới 80% sẽ chặn mức xếp loại tối đa còn Đạt.',
  'Có vắng không phép trong chu kỳ sẽ chặn mức xếp loại tối đa còn Tốt.',
  'Đi trễ hoặc lỡ deadline lặp lại nhiều lần sẽ chặn mức xếp loại tối đa còn Đạt.',
  'Cảnh cáo nội bộ có hiệu lực sẽ chặn mức xếp loại tối đa còn Cần cải thiện.',
  'Vi phạm nghiêm trọng có hiệu lực sẽ chặn mức xếp loại tối đa còn Không đạt.',
  'Không hoàn thành nhiệm vụ trọng yếu liên quan nhiều đơn vị sẽ chặn mức xếp loại tối đa còn Tốt.',
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
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck size={18} className="text-primary" />
          <h4 className="font-bold text-foreground">Vòng đời một chu kỳ</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-3">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-3 border border-border/30 rounded-xl px-3 py-3 bg-background/45">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-secondary">Bước {index + 1}</div>
                  <div className="text-sm font-bold text-foreground truncate">{step.label}</div>
                </div>
              </div>
            );
          })}
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

        <div className="border border-border/40 bg-card/45 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-primary" />
            <h4 className="font-bold text-foreground">Điều kiện chặn xếp loại</h4>
          </div>
          <div className="space-y-3">
            {blockerRules.map((rule) => (
              <div key={rule} className="flex items-start gap-3 border border-border/30 rounded-xl px-3 py-3 bg-background/45">
                <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-sm text-secondary leading-6">{rule}</p>
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

import { ArrowLeft, ChevronRight, ReceiptText, FileText, ClipboardPen, PackageOpen, ClipboardList, Users2, Accessibility, Car, Megaphone } from 'lucide-react'

interface AdminHubProps {
  onNavigate: (tab: string) => void
}

const tools = [
  {
    key: 'reimbursement',
    icon: ReceiptText,
    title: '发票报销',
    desc: '上传发票图片 · OCR 自动识别 · 一键生成报销单 · 预览打印 · 导出 PDF/Excel',
    color: 'cyan',
    tags: ['OCR 识别', '报销单生成'],
    enabled: true,
  },
  {
    key: 'meeting-notes',
    icon: ClipboardPen,
    title: '会议纪要',
    desc: '会议记录模板 · 决议事项跟踪 · 参会人签到 · 历史归档',
    color: 'violet',
    tags: ['记录模板', '事项跟踪'],
    enabled: false,
  },
  {
    key: 'goods-request',
    icon: PackageOpen,
    title: '物品申领',
    desc: '办公用品申请 · 设备借用登记 · 库存查询 · 审批流程',
    color: 'emerald',
    tags: ['申领登记', '库存管理'],
    enabled: false,
  },
  {
    key: 'asset-ledger',
    icon: ClipboardList,
    title: '资产台账',
    desc: '固定资产登记 · 折旧计算 · 盘点核对 · 报废处置',
    color: 'amber',
    tags: ['资产登记', '盘点管理'],
    enabled: false,
  },
  {
    key: 'contract-mgmt',
    icon: FileText,
    title: '合同管理',
    desc: '合同归档 · 到期自动提醒 · 续签管理 · 关联方信息',
    color: 'rose',
    tags: ['归档管理', '到期提醒'],
    enabled: false,
  },
  {
    key: 'visitor',
    icon: Users2,
    title: '访客登记',
    desc: '访客预约 · 出入登记 · 接待人通知 · 访问记录查询',
    color: 'sky',
    tags: ['预约登记', '安全追溯'],
    enabled: false,
  },
  {
    key: 'car-booking',
    icon: Car,
    title: '用车申请',
    desc: '公车使用申请 · 外出用车登记 · 里程记录 · 费用分摊',
    color: 'orange',
    tags: ['用车调度', '里程核算'],
    enabled: false,
  },
  {
    key: 'bulletin',
    icon: Megaphone,
    title: '公告栏',
    desc: '内部公告发布 · 通知推送 · 已读确认 · 置顶管理',
    color: 'teal',
    tags: ['发布管理', '已读追踪'],
    enabled: false,
  },
]

const colorMap: Record<string, { border: string; bg: string; text: string; shadow: string; gradient: string }> = {
  cyan:    { border: 'border-cyan-400/20 hover:border-cyan-400/40', bg: 'bg-cyan-400/10', text: 'text-cyan-400', shadow: 'shadow-cyan-400/20', gradient: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(13,25,55,0.6) 100%)' },
  violet:  { border: 'border-violet-400/20 hover:border-violet-400/40', bg: 'bg-violet-400/10', text: 'text-violet-400', shadow: 'shadow-violet-400/20', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(13,25,55,0.6) 100%)' },
  emerald: { border: 'border-emerald-400/20 hover:border-emerald-400/40', bg: 'bg-emerald-400/10', text: 'text-emerald-400', shadow: 'shadow-emerald-400/20', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(13,25,55,0.6) 100%)' },
  amber:   { border: 'border-amber-400/20 hover:border-amber-400/40', bg: 'bg-amber-400/10', text: 'text-amber-400', shadow: 'shadow-amber-400/20', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(13,25,55,0.6) 100%)' },
  rose:    { border: 'border-rose-400/20 hover:border-rose-400/40', bg: 'bg-rose-400/10', text: 'text-rose-400', shadow: 'shadow-rose-400/20', gradient: 'linear-gradient(135deg, rgba(251,113,133,0.06) 0%, rgba(13,25,55,0.6) 100%)' },
  sky:     { border: 'border-sky-400/20 hover:border-sky-400/40', bg: 'bg-sky-400/10', text: 'text-sky-400', shadow: 'shadow-sky-400/20', gradient: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(13,25,55,0.6) 100%)' },
  orange:  { border: 'border-orange-400/20 hover:border-orange-400/40', bg: 'bg-orange-400/10', text: 'text-orange-400', shadow: 'shadow-orange-400/20', gradient: 'linear-gradient(135deg, rgba(251,146,60,0.06) 0%, rgba(13,25,55,0.6) 100%)' },
  teal:    { border: 'border-teal-400/20 hover:border-teal-400/40', bg: 'bg-teal-400/10', text: 'text-teal-400', shadow: 'shadow-teal-400/20', gradient: 'linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(13,25,55,0.6) 100%)' },
}

export function AdminHub({ onNavigate }: AdminHubProps) {
  return (
    <div className="relative min-h-screen bg-[#0B1838] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-400/4 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-500/4 blur-[140px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8">
        {/* Back button */}
        <button
          onClick={() => onNavigate('workbench')}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-amber-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工作台
        </button>

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            <span className="text-xs font-medium text-amber-400/80 tracking-wider uppercase">Admin Module</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">行政管理</h1>
          <p className="mt-2 text-sm text-white/35">报销管理 · 资产台账 · 合同管理 · 访客登记 · 用车调度 · 内部公告</p>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-12">
          {tools.map((tool) => {
            const c = colorMap[tool.color]
            return (
              <button
                key={tool.key}
                onClick={() => tool.enabled ? onNavigate(tool.key) : undefined}
                className={`group relative text-left rounded-2xl border ${c.border} p-5 transition-all duration-300 ${tool.enabled ? 'hover:-translate-y-1 cursor-pointer active:translate-y-0' : 'cursor-default opacity-60'}`}
                style={{
                  background: c.gradient,
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 0 24px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                  <tool.icon className={`w-5 h-5 ${c.text}`} />
                </div>

                <h3 className="text-base font-bold text-white mb-1.5">{tool.title}</h3>
                <p className="text-xs text-white/35 leading-relaxed mb-4 line-clamp-3">{tool.desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tool.tags.map((tag) => (
                    <span key={tag} className={`text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/8`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Status */}
                {tool.enabled ? (
                  <div className={`flex items-center gap-1.5 ${tool.color === 'cyan' ? 'text-cyan-400/60' : 'text-white/30'} group-hover:${tool.color === 'cyan' ? 'text-cyan-400' : 'text-white/50'} transition-colors`}>
                    <span className="text-xs font-medium">进入工具</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ) : (
                  <span className="text-[10px] text-white/20 bg-white/3 px-2 py-0.5 rounded-full border border-white/5">
                    建设中
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { ArrowLeft, ChevronRight, TrendingUp, BarChart3, PieChart, FlaskConical } from 'lucide-react'

interface FinanceHubProps {
  onNavigate: (tab: string) => void
}

const modules = [
  {
    key: 'finance',
    icon: BarChart3,
    title: '收支明细看板',
    desc: '上传月度 Excel 对账单 · 自动解析收支 · 概览看板 · 类目分析 · 月度趋势',
    color: 'purple',
    tags: ['Excel 导入', '收支分析', '看板'],
    enabled: true,
  },
  {
    key: 'finance-test-accounts',
    icon: FlaskConical,
    title: '测试账号台账',
    desc: '录入测试账号与积分发放 · 自动记录时间 · 按账号/归属筛选 · 累计统计',
    color: 'cyan',
    tags: ['积分发放', '筛选统计'],
    enabled: true,
  },
  {
    key: 'finance-budget',
    icon: PieChart,
    title: '预算管理',
    desc: '年度预算编制 · 月度执行跟踪 · 超支预警 · 预算调整审批',
    color: 'rose',
    tags: ['预算编制', '执行监控'],
    enabled: false,
  },
  {
    key: 'finance-report',
    icon: TrendingUp,
    title: '财务报表',
    desc: '利润表 · 现金流量表 · 资产负债表 · 自定义报表生成',
    color: 'emerald',
    tags: ['三大报表', '自定义报表'],
    enabled: false,
  },
]

export function FinanceHub({ onNavigate }: FinanceHubProps) {
  return (
    <div className="relative min-h-screen bg-[#0B1838] overflow-hidden py-6 px-4 sm:py-8">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-400/4 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-rose-500/4 blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-6">
        {/* Back + header */}
        <button
          onClick={() => onNavigate('workbench')}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工作台
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-rose-600 text-white flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">
            📊
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">财务中心</h1>
            <p className="text-xs text-white/35">收支明细 · 月度对账 · 经营看板</p>
          </div>
        </div>

        {/* Module cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon
            const colorMap: Record<string, { border: string; bg: string; glow: string; text: string; badge: string }> = {
              purple: { border: 'border-purple-400/25', bg: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(13,25,55,0.6) 100%)', glow: 'rgba(168,85,247,0.06)', text: 'text-purple-400/80', badge: 'bg-purple-400/10 border-purple-400/20 text-purple-400/60' },
              rose: { border: 'border-rose-400/25', bg: 'linear-gradient(135deg, rgba(251,113,133,0.08) 0%, rgba(13,25,55,0.6) 100%)', glow: 'rgba(251,113,133,0.06)', text: 'text-rose-400/80', badge: 'bg-rose-400/10 border-rose-400/20 text-rose-400/60' },
              emerald: { border: 'border-emerald-400/25', bg: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(13,25,55,0.6) 100%)', glow: 'rgba(52,211,153,0.06)', text: 'text-emerald-400/80', badge: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400/60' },
              cyan: { border: 'border-cyan-400/25', bg: 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(13,25,55,0.6) 100%)', glow: 'rgba(34,211,238,0.06)', text: 'text-cyan-400/80', badge: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400/60' },
            }
            const c = colorMap[mod.color]

            if (mod.enabled) {
              return (
                <button
                  key={mod.key}
                  onClick={() => onNavigate(mod.key)}
                  className="group relative text-left rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer active:translate-y-0"
                  style={{
                    borderColor: c.border.replace('border-', ''),
                    background: c.bg,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 0 30px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${c.text.replace('80', '60')}`} />
                      <span className={`text-[11px] font-medium tracking-wider uppercase ${c.text}`}>
                        {mod.key.replace('finance-', '').replace('finance', 'Overview')}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-white/20 group-hover:${c.text.replace('80', '60')} group-hover:translate-x-0.5 transition-all`} />
                  </div>
                  <h3 className="text-base font-bold text-white/90 mb-1">{mod.title}</h3>
                  <p className="text-[11px] text-white/30 leading-relaxed mb-3">{mod.desc}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {mod.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full border ${c.badge}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              )
            }

            return (
              <div
                key={mod.key}
                className="relative rounded-2xl border border-white/6 p-5 opacity-50"
                style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white/20" />
                    <span className="text-[11px] font-medium text-white/25 tracking-wider uppercase">
                      {mod.key.replace('finance-', '')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/10" />
                </div>
                <h3 className="text-base font-bold text-white/60 mb-1">{mod.title}</h3>
                <p className="text-[11px] text-white/20 leading-relaxed mb-3">{mod.desc}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
                    建设中
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { Users, Calculator, ChevronRight, ArrowLeft, FileText, TrendingUp } from 'lucide-react'

interface HRHubProps {
  onNavigate: (tab: string) => void
}

export function HRHub({ onNavigate }: HRHubProps) {
  return (
    <div className="relative min-h-screen bg-[#0B1838] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-400/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[140px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8">
        {/* Back button */}
        <button
          onClick={() => onNavigate('workbench')}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-cyan-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工作台
        </button>

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <span className="text-xs font-medium text-cyan-400/80 tracking-wider uppercase">HR Module</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">人事管理</h1>
          <p className="mt-2 text-sm text-white/35">选择功能模块，管理员工档案与工资核算</p>
        </div>

        {/* Two entry cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 人事档案 */}
          <button
            onClick={() => onNavigate('personnel')}
            className="group relative text-left rounded-2xl border border-cyan-400/20 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 cursor-pointer active:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(13,25,55,0.6) 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 30px rgba(34,211,238,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-5">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">人事档案</h2>
            <p className="text-sm text-white/40 leading-relaxed mb-6">
              员工基础信息 · 入职时间 · 调薪记录 · 社保基数变更 · 全程留痕可追溯
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/8">
                <FileText className="w-3 h-3" />
                档案管理
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/8">
                <TrendingUp className="w-3 h-3" />
                变动追溯
              </span>
            </div>

            {/* Arrow */}
            <div className="flex items-center gap-1.5 text-cyan-400/60 group-hover:text-cyan-400 transition-colors">
              <span className="text-sm font-medium">进入档案</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* 工资测算 */}
          <button
            onClick={() => onNavigate('payroll')}
            className="group relative text-left rounded-2xl border border-emerald-400/20 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 cursor-pointer active:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(13,25,55,0.6) 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 30px rgba(16,185,129,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-5">
              <Calculator className="w-6 h-6 text-emerald-400" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">工资测算</h2>
            <p className="text-sm text-white/40 leading-relaxed mb-6">
              月度工资核算 · 五险一金 · 累计预扣个税 · 考勤扣款 · 工资表一键导出
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/8">
                <Calculator className="w-3 h-3" />
                个税核算
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/8">
                <FileText className="w-3 h-3" />
                工资表导出
              </span>
            </div>

            {/* Arrow */}
            <div className="flex items-center gap-1.5 text-emerald-400/60 group-hover:text-emerald-400 transition-colors">
              <span className="text-sm font-medium">进入测算</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

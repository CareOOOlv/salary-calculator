import { useEffect, useRef } from 'react'
import { Users, Wallet, ChevronRight, Zap } from 'lucide-react'

interface WorkbenchProps {
  onNavigate: (tab: string) => void
}

/* ─────────── 纯 CSS 星空背景（比 PNG 更可控） ─────────── */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type Star = { x: number; y: number; r: number; alpha: number; speed: number; color: string }
    const stars: Star[] = []
    const count = 350

    const colors = ['#ffffff', '#e8f0ff', '#d4f4ff', '#fff8dc', '#a5f3fc']

    for (let i = 0; i < count; i++) {
      const isBand = Math.random() < 0.35
      let x: number, y: number
      if (isBand) {
        // 银河系带状
        const t = Math.random()
        x = t * canvas.width + (Math.random() - 0.5) * 300
        y = canvas.height * 0.35 + (t - 0.5) * canvas.height * 0.6 + (Math.random() - 0.5) * 120
      } else {
        x = Math.random() * canvas.width
        y = Math.random() * canvas.height
      }
      const r = Math.random() < 0.92 ? Math.random() * 1.2 + 0.2 : Math.random() * 2.5 + 1.0
      const alpha = Math.random() * 0.7 + 0.3
      const speed = Math.random() * 0.02 + 0.005
      stars.push({ x, y, r, alpha, speed, color: colors[Math.floor(Math.random() * colors.length)] })
    }

    // 亮星（十字芒）
    const brightStars: { x: number; y: number; size: number; color: string }[] = []
    for (let i = 0; i < 12; i++) {
      brightStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    let anim = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // 普通星
      stars.forEach(s => {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.color
        ctx.globalAlpha = s.alpha * (0.85 + Math.sin(anim * s.speed + s.x) * 0.15)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // 亮星 + 十字芒
      brightStars.forEach(s => {
        // 光晕
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 8)
        grad.addColorStop(0, s.color + '20')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * 8, 0, Math.PI * 2)
        ctx.fill()

        // 星体
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fillStyle = s.color
        ctx.fill()

        // 十字芒
        ctx.strokeStyle = s.color + '80'
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.moveTo(s.x - s.size * 5, s.y)
        ctx.lineTo(s.x + s.size * 5, s.y)
        ctx.moveTo(s.x, s.y - s.size * 5)
        ctx.lineTo(s.x, s.y + s.size * 5)
        ctx.stroke()
      })

      anim++
      requestAnimationFrame(draw)
    }
    draw()

    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export function Workbench({ onNavigate }: WorkbenchProps) {
  return (
    <div className="relative min-h-screen bg-[#0B1838] overflow-hidden font-sans">
      {/* Starfield canvas */}
      <Starfield />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#0a1530] to-transparent z-[1] pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-400/5 blur-[140px] z-[1] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[140px] z-[1] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8">
        {/* Top bar: Logo + nav pills */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="EcomFlare" className="h-7 w-auto object-contain opacity-90" />
          </div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
            <span className="text-white/20">·</span>
            {['HR', 'Payroll', 'Income', 'Admin', 'Finance'].map((m, i) => (
              <span key={m} className="text-white/40">
                {m}
                {i < 4 && <span className="text-white/15 ml-1">·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            内部工作台
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-cyan-400/70">—</span>
            <span className="text-sm text-white/30">一站式内部管理系统</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-white/30">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400/60" />
              4 staff on board
            </span>
            <span className="text-white/10">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400/60" />
              HR records ready
            </span>
            <span className="text-white/10">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-400/60" />
              1 module 建设中
            </span>
          </div>
        </div>

        {/* 模块入口 */}
        <div className="mb-3">
          <span className="text-xs font-medium text-white/40 tracking-wider">模块入口</span>
        </div>

        {/* Cards grid: left big card + right 3 small cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* HR — Big card */}
          <button
            onClick={() => onNavigate('hr-hub')}
            className="group relative lg:col-span-1 text-left rounded-2xl border border-cyan-400/25 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40 cursor-pointer active:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(13,25,55,0.6) 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 30px rgba(34,211,238,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                <span className="text-[11px] font-medium text-cyan-400/80 tracking-wider uppercase">HR</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400/60 group-hover:translate-x-0.5 transition-all" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">人事管理</h3>
            <p className="text-xs text-white/30 mb-4">员工档案 · 工资测算 · 变动留痕</p>

            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1 text-[11px] text-white/40">
                <Users className="w-3 h-3" />
                人事档案
              </span>
              <span className="text-white/10">·</span>
              <span className="flex items-center gap-1 text-[11px] text-white/40">
                <Wallet className="w-3 h-3" />
                工资测算
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400/60" />
              <span className="text-[10px] text-cyan-400/50 bg-cyan-400/8 px-2 py-0.5 rounded-full border border-cyan-400/15">
                已启用
              </span>
            </div>
          </button>

          {/* Right column: 3 smaller cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Income */}
            <div
              className="relative rounded-2xl border border-white/6 p-5 sm:p-6 opacity-60"
              style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400/60" />
                  <span className="text-[11px] font-medium text-white/30 tracking-wider uppercase">Income</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/10" />
              </div>
              <h3 className="text-base font-bold text-white/80 mb-1">收入</h3>
              <p className="text-[11px] text-white/20 leading-relaxed">订阅 · API 服务 · 云存储</p>
              <div className="mt-4">
                <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
                  建设中
                </span>
              </div>
            </div>

            {/* Admin */}
            <button
              onClick={() => onNavigate('admin-hub')}
              className="group relative rounded-2xl border border-amber-400/20 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 cursor-pointer active:translate-y-0"
              style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(13,25,55,0.6) 100%)', backdropFilter: 'blur(12px)', boxShadow: '0 0 24px rgba(251,191,36,0.05), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                  <span className="text-[11px] font-medium text-amber-400/80 tracking-wider uppercase">Admin</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400/60 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-white/90 mb-1">行政</h3>
              <p className="text-[11px] text-white/30 leading-relaxed">报销 · 采购 · 资产 · 合同</p>
              <div className="mt-4">
                <span className="text-[10px] text-amber-400/60 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  已启用
                </span>
              </div>
            </button>

            {/* Finance */}
            <button
              onClick={() => onNavigate('finance-hub')}
              className="group relative rounded-2xl border border-purple-400/20 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-400/40 cursor-pointer active:translate-y-0"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(13,25,55,0.6) 100%)', backdropFilter: 'blur(12px)', boxShadow: '0 0 24px rgba(168,85,247,0.05), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                  <span className="text-[11px] font-medium text-purple-400/80 tracking-wider uppercase">Finance</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-purple-400/60 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-white/90 mb-1">财务</h3>
              <p className="text-[11px] text-white/30 leading-relaxed">收支看板 · 月度对账</p>
              <div className="mt-4">
                <span className="text-[10px] text-purple-400/60 bg-purple-400/10 px-2 py-0.5 rounded-full border border-purple-400/20">
                  已启用
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Empty bottom space to feel spacious */}
        <div className="h-20" />
      </div>
    </div>
  )
}

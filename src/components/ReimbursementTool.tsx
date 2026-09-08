import { ArrowLeft, ExternalLink } from 'lucide-react'

interface ReimbursementToolProps {
  onNavigate: (tab: string) => void
}

export function ReimbursementTool({ onNavigate }: ReimbursementToolProps) {
  const reimbursementUrl = `${import.meta.env.BASE_URL}reimbursement/index.html`

  return (
    <div className="relative min-h-screen bg-[#0B1838] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-400/4 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-500/4 blur-[120px] pointer-events-none" />

      <div className="relative h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-3 border-b border-white/8 bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => onNavigate('admin-hub')}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回行政中心
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <span className="text-xs font-medium text-cyan-400/80">发票报销工具</span>
          </div>
          <a
            href={reimbursementUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-white/30 hover:text-cyan-400 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            新窗口打开
          </a>
        </div>

        {/* Iframe */}
        <div className="flex-1 relative">
          <iframe
            src={reimbursementUrl}
            className="w-full h-full border-0"
            title="费用报销单生成工具"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"
          />
        </div>
      </div>
    </div>
  )
}
